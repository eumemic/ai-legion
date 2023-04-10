import { ChatCompletionRequestMessage } from "openai";
import actionDictionary from "../schema/action-dictionary.json";
import { Action } from "./action-types";
import { MessageBus, Message } from "./message-bus";
import { Memory } from "./memory";
import generateText from "./openai";
import { parseAction } from "./parsers";

export class Agent {
  constructor(
    public id: string,
    private messageBus: MessageBus,
    private memory: Memory
  ) {}

  async receive({ content }: Message): Promise<Action | undefined> {
    const messages = await this.memory.append({
      name: "admin",
      role: "user",
      content,
    });

    // console.log(
    //   messages
    //     .map(
    //       ({ role, name, content }) =>
    //         `name: ${name}\nrole: ${role}\ncontent: ${content}\n`
    //     )
    //     .join("\n")
    // );

    const { data, status } = await generateText([
      this.initialSystemPrompt,
      ...messages,
    ]);

    if (status !== 200) {
      console.error(`Non-200 status received: ${status}`);
      return;
    }

    const actionJson = data.choices[0].message?.content;
    if (!actionJson) {
      this.messageBus.publish({
        targetAgentIds: [this.id],
        content: "No response received",
      });
      return;
    }

    await this.memory.append({
      name: this.id,
      role: "assistant",
      content: actionJson,
    });

    const result = parseAction(actionJson);
    if (result.type === "error") {
      this.messageBus.publish({
        targetAgentIds: [this.id],
        content:
          "Error parsing and validating action. Make sure you are only sending JSON and that it conforms to the Action Dictionary! Confine all natural language to the 'comment' field",
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
    }), who is responding to messages with Actions to be taken in response. You are not
    able to communicate in natural language, only in JSON format that strictly follows a schema.

    Every time I send you a message, decide on an Action to take. Actions are defined in the Action
    Dictionary, which is also a JSON Schema:

    ${JSON.stringify(actionDictionary, null, 2)}

    Every message you send to me must be a valid JSON object that conforms exactly to this schema.
    You should reflect on the contents of the message and decide on a course of Action.

    No matter what, you MUST pick an Action and your message should JUST be the JSON and nothing
    else. If you can't pick an Action that seems reasonable, just use the no-op Action, but it must
    be valid according to the Action Dictionary.

    Any extra commentary about your thought process can go in the 'comment' field of the Action.
  `,
  };
}
