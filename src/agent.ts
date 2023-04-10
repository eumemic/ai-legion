import { Action } from "./action-types";
import { Memory } from "./memory";
import { MessageBus } from "./message-bus";
import { Message, standardMessages } from "./message";
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

    this.messageBus.send(standardMessages.primer(this.id));

    while (true) {
      await new Promise((resolve) => setTimeout(resolve, pollingInterval));
      const messages = await this.memory.retrieve();
      const lastMessage = last(messages);
      if (lastMessage?.standardMessageType === "agentResponse") {
        this.messageBus.send(standardMessages.heartbeat(this.id));
      }
    }
  }

  private async handle(message: Message): Promise<Action | undefined> {
    const messages = await this.memory.append(message);

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

    const responseContent = response.data.choices[0].message?.content;
    if (!responseContent) {
      this.messageBus.send(standardMessages.noResponseError(this.id));
      return;
    }

    await this.memory.append(
      standardMessages.agentResponse(this.id, responseContent)
    );

    const result = parseAction(responseContent);
    if (result.type === "error") {
      this.messageBus.send(standardMessages.malformattedResponseError(this.id));
      return;
    }

    return result.value;
  }
}
