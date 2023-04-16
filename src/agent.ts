// agent.ts

import { last } from "lodash";
import ActionHandler from "./action-handler_agent";
import makeDecision from "./make-decision";
import { Event, Memory } from "./memory";
import { Message } from "./message";
import core from "./module/definitions/core";
import filesystem from "./module/definitions/filesystem";
import goals from "./module/definitions/goals";
import messaging from "./module/definitions/messaging";
import notes from "./module/definitions/notes";
import web from "./module/definitions/web";
import { ModuleManager } from "./module/module-manager";
import { contextWindowSize, Model } from "./openai";
import parseAction from "./parse-action";
import FileStore from "./store/file-store";
import JsonStore from "./store/json-store";
import TaskQueue from "./task-queue";
import { agentName, sleep } from "./util";

const actionInterval = 1000;
// const heartbeatInterval = 60 * 1000;

interface ControlMessage {
  type: string;
  controlMessage: any;
}

export interface AgentMessage {
  agentId: string;
  type: string;
  agentMessage?: Message | string;
  data?: any;
}

class Agent {
  private agentId: string;
  private model: Model;
  private agents: string[];
  private memory: Memory;
  private moduleManager: ModuleManager;
  private actionHandler: ActionHandler;

  constructor(agentId: string, agents: string[], model: Model) {
    this.agentId = agentId;
    this.agents = agents;
    this.model = model;

    this.moduleManager = new ModuleManager(this.agentId, this.agents, [
      core,
      goals,
      notes,
      messaging,
      filesystem,
      web,
    ]);

    this.actionHandler = new ActionHandler(this.agents, this.moduleManager);

    const store = new JsonStore<Event[]>(new FileStore([this.agentId]));
    // We have to leave room for the agent's next action, which is of unknown size
    const compressionThreshold = Math.round(
      contextWindowSize[this.model] * 0.75
    );

    this.memory = new Memory(
      this.agentId,
      this.moduleManager,
      store,
      compressionThreshold,
      this.model
    );

    const agentMessage: AgentMessage = {
      agentId,
      type: "subscribe",
    };

    if (process?.send) process.send(agentMessage);

    process.on("message", (message: ControlMessage) => {
      if (message.type === "appendMemory") {
        this.memory.append({
          type: "message",
          message: message.controlMessage,
        });
      }
    });
  }

  public async takeAction(): Promise<void> {
    try {
      let events = await this.memory.retrieve();

      // Do not act again if the last event was a decision
      if (last(events)?.type === "decision") return;

      const actionText = await makeDecision(events, this.model);

      console.log("actionText", actionText);
      // Reassign events in case summarization occurred
      events = await this.memory.append({
        type: "decision",
        actionText,
      });

      const result = parseAction(this.moduleManager.actions, actionText);

      if (result.type === "error") {
        const agentMessage: AgentMessage = {
          agentId: this.agentId,
          type: "error",
          agentMessage: result.message,
        };

        if (process?.send) process.send(agentMessage);
      } else {
        await this.actionHandler.handle(this.agentId, result.action);
      }
    } catch (e) {
      console.error(
        `${agentName(
          this.agentId
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

process.on("message", (message: ControlMessage) => {
  if (message.type === "init") {
    const agentId = message.controlMessage?.id;
    const agents = message.controlMessage?.agents;
    const model = message.controlMessage?.model;
    const agent = new Agent(agentId, agents, model);

    const taskQueue = new TaskQueue();

    taskQueue.runPeriodically(() => agent.takeAction(), actionInterval);

    agent.takeAction();
  }
});
