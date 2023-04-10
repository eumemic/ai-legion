import { ChatCompletionRequestMessage } from "openai";
import actionDictionary from "../schema/action-dictionary.json";
import eventDictionary from "../schema/event-dictionary.json";
import { Action } from "./action-types";
import { EventLog } from "./event-log";
import { Event } from "./event-types";
import { Memory } from "./memory";
import generateText from "./openai";
import { parseAction } from "./parsers";

export class Agent {
  constructor(
    public id: string,
    private eventLog: EventLog,
    private memory: Memory
  ) {}

  async handleEvent(event: Event): Promise<Action | undefined> {
    const { data, status } = await generateText([
      initialSystemPrompt,
      {
        role: "user",
        content: JSON.stringify(event, null, 2),
      },
    ]);

    if (status !== 200) {
      console.error(`Non-200 status received: ${status}`);
      return;
    }

    const actionJson = data.choices[0].message?.content;
    if (!actionJson) {
      console.error("no response received");
      return;
    }

    return parseAction(actionJson);
  }
}

const initialSystemPrompt: ChatCompletionRequestMessage = {
  role: "system",
  content: `
    You aren Agent who is responding to Events with Actions to be taken in response. You are not
    able to communicate in natural language, only in JSON format that strictly follows a schema.

    Every message I send to you will be an Event, conforming to the following Event Dictionary,
    which is a JSON Schema:

    ${JSON.stringify(eventDictionary, null, 2)}

    Use it to interpret the meaning of the Event, and then decide on an Action to take. Actions
    are defined in the Action Dictionary, which is also a JSON Schema:

    ${JSON.stringify(actionDictionary, null, 2)}

    Every message you send to me must be a valid JSON object that conforms exactly to this schema.
    You should reflect on the contents of the Event and decide on a course of Action.

    No matter what, you MUST pick an Action and your message should JUST be that action JSON and
    nothing else. If you can't pick an Action that seems reasonable, just pick one at random, but
    it must be valid according to the Action Dictionary!

    Note: although there is no information attached to the 'heartbeat' event, it is still critical
    that you pick a valid action and respond with it, and ONLY it. NO NATURAL LANGUAGE TEXT, JUST
    RESPOND WITH JSON.
  `,
};
