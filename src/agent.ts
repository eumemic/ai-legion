import { Action } from "./action-types";
import { Memory } from "./memory";
import { MessageBus } from "./message-bus";
import { malformattedResponseMessage, Message } from "./message";
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
      role: "system",
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
      this.messageBus.send(malformattedResponseMessage(this.id));
      return;
    }

    return result.value;
  }
}
