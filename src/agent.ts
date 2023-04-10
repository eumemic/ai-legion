import { last } from "lodash";
import ActionHandler from "./action-handler";
import { actionMemento, Memory, messageMemento } from "./memory";
import { CODE_BLOCK_DELIMITER, messageBuilder } from "./message";
import { MessageBus } from "./message-bus";
import generateText from "./openai";
import parseAction from "./parse-action";
import TaskQueue from "./task-queue";

const actionInterval = 10 * 1000;
const heartbeatInterval = 60 * 1000;

export class Agent {
  constructor(
    public id: string,
    private memory: Memory,
    private messageBus: MessageBus,
    private actionHandler: ActionHandler
  ) {}

  private taskQueue = new TaskQueue();

  // Start this Agent's event loop
  async start() {
    // Subscribe to messages
    this.messageBus.subscribe((message) => {
      if (message.targetAgentIds && !message.targetAgentIds.includes(this.id))
        return;
      this.memory.append(messageMemento(message));
    });

    // Act on messages periodically
    this.taskQueue.runPeriodically(() => this.takeAction(), actionInterval);

    // Start heartbeat
    // this.taskQueue.runPeriodically(async () => {
    //   const messages = await this.memory.retrieve();
    //   const lastMessage = last(messages);
    //   if (lastMessage?.messageType === "agentResponse") {
    //     this.messageBus.send(messageBuilder.heartbeat(this.id));
    //   }
    // }, heartbeatInterval);
  }

  private async takeAction(): Promise<void> {
    const mementos = await this.memory.retrieve();

    // Do not act again if the last message was an action
    if (last(mementos)?.type === "action") return;

    let response: Awaited<ReturnType<typeof generateText>>;
    try {
      response = await generateText(this.id, mementos);
    } catch (e) {
      console.error(e);
      return;
    } finally {
    }

    if (response.status !== 200) {
      console.error(`Non-200 status received: ${response.status}`);
      return;
    }

    const actionText = response.data.choices[0].message?.content;
    if (!actionText) {
      this.messageBus.send(
        messageBuilder.error(
          this.id,
          `No response received, could you try again?`
        )
      );
      return;
    }

    await this.memory.append(actionMemento(this.id, actionText));

    let result = parseAction(actionText);

    if (result.type === "error") {
      result = parseAction(actionText);
      // if (result.type === "success") {
      //   this.messageBus.send(
      //     messageBuilder.generic(
      //       this.id,
      //       `I was able to understand your Action even though it contained extraneous text outside of the JSON. In the future please remember to only respond with JSON conforming to the Action Dictionary, and confine any natural language to the 'comment' field.`
      //     )
      //   );
      // }
    }

    if (result.type === "error") {
      this.messageBus.send(
        messageBuilder.error(
          this.id,
          `Your last message wasn't formatted correctly. If you need help, respond with simply:

  ${CODE_BLOCK_DELIMITER}
  help
  ${CODE_BLOCK_DELIMITER}
  `
        )
      );
      return;
    }

    if (result.value) {
      await this.actionHandler.handle(this.id, result.value);
    }
  }
}
