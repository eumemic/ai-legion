import { last } from "lodash";
import ActionHandler from "./action-handler";
import { Memory } from "./memory";
import { Message, messageBuilder } from "./message";
import { MessageBus } from "./message-bus";
import generateText from "./openai";
import { parseAction } from "./parsers";
import TaskQueue from "./task-queue";

const actionInterval = 10000;
const heartbeatInterval = 60000;

export class Agent {
  constructor(
    public id: string,
    private memory: Memory,
    private messageBus: MessageBus,
    private actionHandler: ActionHandler
  ) {}

  private taskQueue = new TaskQueue();
  private lastProcessedMessage: Message | undefined;

  // Start this Agent's event loop
  async start() {
    this.messageBus.subscribe(async (message) => {
      if (message.targetAgentIds && !message.targetAgentIds.includes(this.id))
        return;
      this.memory.append(message);
    });

    // Start heartbeat
    this.taskQueue.runPeriodically(async () => {
      const messages = await this.memory.retrieve();
      const lastMessage = last(messages);
      if (lastMessage?.messageType === "agentResponse") {
        this.messageBus.send(messageBuilder.heartbeat(this.id));
      }
    }, heartbeatInterval);

    // Take action periodically
    this.taskQueue.runPeriodically(() => this.takeAction(), actionInterval);
  }

  private async takeAction(): Promise<void> {
    const messages = await this.memory.retrieve();

    const lastMessage = last(messages);
    if (lastMessage === this.lastProcessedMessage) return;

    this.lastProcessedMessage = lastMessage;

    let response: Awaited<ReturnType<typeof generateText>>;
    // console.log(`Agent ${this.id} BEFORE`);
    try {
      response = await generateText(this.id, messages);
    } catch (e) {
      console.error(e);
      return;
    } finally {
      // console.log(`Agent ${this.id} AFTER`);
    }

    if (response.status !== 200) {
      console.error(`Non-200 status received: ${response.status}`);
      return;
    }

    const responseContent = response.data.choices[0].message?.content;
    if (!responseContent) {
      this.messageBus.send(messageBuilder.noResponseError(this.id));
      return;
    }

    await this.memory.append(
      messageBuilder.agentResponse(this.id, responseContent)
    );

    let result = parseAction(responseContent);

    if (result.type === "error") {
      // Try to find some usable JSON to parse anyway
      const firstCurly = responseContent.indexOf("{");
      const lastCurly = responseContent.lastIndexOf("}");
      if (firstCurly >= 0 && lastCurly > 0) {
        result = parseAction(responseContent.slice(firstCurly, lastCurly + 1));
        // if (result.type === "success") {
        //   this.messageBus.send(
        //     messageBuilder.generic(
        //       this.id,
        //       `I was able to understand your Action even though it contained extraneous text outside of the JSON. In the future please remember to only respond with JSON conforming to the Action Dictionary, and confine any natural language to the 'comment' field.`
        //     )
        //   );
        // }
      }
    }

    if (result.type === "error") {
      this.messageBus.send(messageBuilder.malformattedResponseError(this.id));
      return;
    }

    if (result.value) {
      await this.actionHandler.handle(this.id, result.value);
    }
  }
}
