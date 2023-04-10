import { Action } from "./action-types";
import { Memory } from "./memory";
import { Message, MessageBus } from "./message-bus";
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
      name: "control",
      role: "user",
      content,
    });

    let response: Awaited<ReturnType<typeof generateText>>;
    try {
      response = await generateText(messages);
    } catch (e) {
      console.error(e);
      return;
    }

    if (response.status !== 200) {
      console.error(`Non-200 status received: ${status}`);
      return;
    }

    const actionJson = response.data.choices[0].message?.content;
    if (!actionJson) {
      this.messageBus.send({
        targetAgentIds: [this.id],
        content: "No response received",
      });
      return;
    }

    await this.memory.append({
      name: `agent-${this.id}`,
      role: "assistant",
      content: actionJson,
    });

    const result = parseAction(actionJson);
    if (result.type === "error") {
      this.messageBus.send({
        targetAgentIds: [this.id],
        content:
          "Error parsing and validating action. Make sure you are only sending JSON and that it conforms to the Action Dictionary! Confine all natural language to the 'comment' field",
      });
      return;
    }

    return result.value;
  }
}
