import { last } from "lodash";
import ActionHandler from "./action-handler";
import makeDecision from "./make-decision";
import { actionMemento, Memory, messageMemento } from "./memory";
import { messageBuilder } from "./message";
import { MessageBus } from "./message-bus";
import parseAction from "./parse-action";
import TaskQueue from "./task-queue";
import { ActionDictionary } from "./action/action-dictionary";

const actionInterval = 10 * 1000;
const heartbeatInterval = 60 * 1000;

export class Agent {
  constructor(
    public id: string,
    private memory: Memory,
    private messageBus: MessageBus,
    private actionDictionary: ActionDictionary,
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

    const actionText = await makeDecision(this.id, mementos);
    if (!actionText) return;

    await this.memory.append(actionMemento(this.id, actionText));

    const result = parseAction(this.actionDictionary, actionText);
    if (result.type === "error") {
      this.messageBus.send(messageBuilder.error(this.id, result.message));
    } else {
      await this.actionHandler.handle(this.id, result.action);
    }
  }
}
