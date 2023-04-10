import { Action } from "./action-types";
import { Memory } from "./memory";
import { MessageBus } from "./message-bus";
import {
  heartbeatMessage,
  malformattedResponseMessage,
  Message,
  primerMessage,
} from "./message";
import generateText from "./openai";
import { parseAction } from "./parsers";
import ActionHandler from "./action-handler";
import { last } from "lodash";

const pollingInterval = 1000;

export class Agent {
  constructor(
    public id: string,
    private memory: Memory,
    private messageBus: MessageBus,
    private actionHandler: ActionHandler
  ) {}

  // Start this Agent's event loop
  async start() {
    this.messageBus.subscribe(async (message) => {
      if (message.targetAgentIds && !message.targetAgentIds.includes(this.id))
        return;

      const action = await this.handle(message);
      if (action) {
        await this.actionHandler.handle(action);
      }
    });

    this.messageBus.send(primerMessage(this.id));

    while (true) {
      await new Promise((resolve) => setTimeout(resolve, pollingInterval));
      const messages = await this.memory.retrieve();
      if (last(messages)?.role === "assistant") {
        this.messageBus.send(heartbeatMessage(this.id));
      }
    }
  }

  private async handle({ content }: Message): Promise<Action | undefined> {
    const messages = await this.memory.append({
      // name: "control",
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
      // name: `agent-${this.id}`,
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
