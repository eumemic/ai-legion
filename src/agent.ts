import { ChatCompletionRequestMessage } from "openai";
import actionDictionary from "../schema/action-dictionary.json";
import eventDictionary from "../schema/event-dictionary.json";
import { Action } from "./action-types";
import { EventBus } from "./event-bus";
import { Event } from "./event-types";
import { Memory } from "./memory";
import generateText from "./openai";
import { parseAction } from "./parsers";

export class Agent {
  constructor(
    public id: string,
    private eventBus: EventBus,
    private memory: Memory
  ) {}

  async handleEvent(event: Event): Promise<Action | undefined> {
    const mementos = await this.memory.append({ type: "event", event });

    const { data, status } = await generateText([
      this.initialSystemPrompt,
      ...mementos.map((m): ChatCompletionRequestMessage => {
        switch (m.type) {
          case "event":
            return { role: "user", content: JSON.stringify(m.event) };
          case "action":
            return { role: "assistant", content: JSON.stringify(m.action) };
        }
      }),
    ]);

    if (status !== 200) {
      console.error(`Non-200 status received: ${status}`);
      return;
    }

    const actionJson = data.choices[0].message?.content;
    if (!actionJson) {
      this.eventBus.publish({
        targetAgentIds: [this.id],
        payload: { type: "error", message: "No response received" },
      });
      return;
    }

    const result = parseAction(actionJson);
    if (result.type === "error") {
      this.eventBus.publish({
        targetAgentIds: [this.id],
        payload: {
          type: "error",
          message: `Error parsing and validating action. Make sure you are only sending JSON and that it conforms to the Action Dictionary! Confine all natural language to the 'comment' field`,
        },
      });
      return;
    }

    return result.value;
  }

  private initialSystemPrompt: ChatCompletionRequestMessage = {
    role: "system",
    content: `
    You are Agent (id=${
      this.id
    }), who is responding to Events with Actions to be taken in response. You are not
    able to communicate in natural language, only in JSON format that strictly follows a schema.

    Every message I send to you will be an Event, conforming to the following Event Dictionary,
    which is a JSON Schema:

    ${JSON.stringify(eventDictionary, null, 2)}

    Use it to interpret the meaning of the Event, and then decide on an Action to take. Actions
    are defined in the Action Dictionary, which is also a JSON Schema:

    ${JSON.stringify(actionDictionary, null, 2)}

    Every message you send to me must be a valid JSON object that conforms exactly to this schema.
    You should reflect on the contents of the Event and decide on a course of Action.

    No matter what, you MUST pick an Action and your message should JUST be the JSON and nothing
    else. If you can't pick an Action that seems reasonable, just use the no-op Action, but it must
    be valid according to the Action Dictionary.

    Any extra commentary about your thought process can go in the 'comment' field of the Action.

    If you receive an Event with type 'error', it probably means there was a problem with your last
    Action. Ensure that you are creating properly-formatted JSON that conforms to the Action Dictionary.
  `,
  };
}
