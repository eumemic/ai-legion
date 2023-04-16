import { last } from "lodash";
import ActionHandler from "./action-handler";
import makeDecision from "./make-decision";
import { Memory } from "./memory";
import { messageBuilder } from "./message";
import { MessageBus } from "./message-bus";
import { ModuleManager } from "./module/module-manager";
import parseAction from "./parse-action";
import TaskQueue from "./task-queue";
import { agentName, sleep } from "./util";

const actionInterval = 1000;
// const heartbeatInterval = 60 * 1000;

export class Agent {
  constructor(
    public id: string,
    private memory: Memory,
    private messageBus: MessageBus,
    private moduleManager: ModuleManager,
    private actionHandler: ActionHandler
  ) {}

  private taskQueue = new TaskQueue();

  // Start this Agent's event loop
  async start() {
    // Subscribe to messages
    this.messageBus.subscribe((message) => {
      if (message.targetAgentIds && !message.targetAgentIds.includes(this.id))
        return;
      this.memory.append({ type: "message", message });
    });

    // Act on messages periodically
    this.taskQueue.runPeriodically(() => this.takeAction(), actionInterval);

    // Start heartbeat
    // this.taskQueue.runPeriodically(async () => {
    //   const messages = await this.memory.retrieve();
    //   const lastMessage = last(messages);
    //   if (lastMessage?.type === "decision") {
    //     this.messageBus.send(
    //       messageBuilder.spontaneous(
    //         this.id,
    //         "This is your regularly scheduled heartbeat message. Is there anything you need to do?"
    //       )
    //     );
    //   }
    // }, heartbeatInterval);
  }

  private async takeAction(): Promise<void> {
    try {
      let events = await this.memory.retrieve();

      // Do not act again if the last event was a decision
      if (last(events)?.type === "decision") return;

      const actionText = await makeDecision(events);

      // Reassign events in case summarization occurred
      events = await this.memory.append({
        type: "decision",
        actionText,
      });

      const result = parseAction(this.moduleManager.actions, actionText);
      if (result.type === "error") {
        this.messageBus.send(messageBuilder.error(this.id, result.message));
      } else {
        await this.actionHandler.handle(this.id, result.action);
      }
    } catch (e) {
      console.error(
        `${agentName(
          this.id
        )} encountered the following problem while attempting to take action:`
      );
      console.error(e);
    } finally {
      if (process.env.AGENT_DELAY) {
        await sleep(parseInt(process.env.AGENT_DELAY));
      }
    }
  }
}
