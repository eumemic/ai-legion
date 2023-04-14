import { fork, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { last } from 'lodash';
import makeDecision from './make-decision';
import { messageBuilder } from './message';
import parseAction from './parse-action';
import { agentName, sleep } from './util';
import ActionHandler from './action-handler';
import { Event, Memory } from './memory';
import { MessageBus } from './message-bus';
import core from './module/definitions/core';
import filesystem from './module/definitions/filesystem';
import goals from './module/definitions/goals';
import messaging from './module/definitions/messaging';
import notes from './module/definitions/notes';
import web from './module/definitions/web';
import { ModuleManager } from './module/module-manager';
import { contextWindowSize } from './openai';
import { model } from './parameters';
import FileStore from './store/file-store';
import JsonStore from './store/json-store';
import path from 'path';

interface Agent {
  id: string;
  process: ChildProcess;
  memory: Memory;
  messageBus: MessageBus;
  moduleManager: ModuleManager;
  actionHandler: ActionHandler;
}

interface AgentMessage {
  agentId: string;
  type: string;
  data?: any;
}

export class Control {
  private agents: Agent[] = [];

  constructor(agentIds: string[], private messageBus: MessageBus) {
    for (const id of agentIds.slice(1)) {
      const agentModulePath = path.join(__dirname, 'agent');

      const agentProcess = fork(agentModulePath);
      const moduleManager = new ModuleManager(id, agentIds, [
        core,
        goals,
        notes,
        messaging,
        filesystem,
        web
      ]);

      const actionHandler = new ActionHandler(
        agentIds,
        messageBus,
        moduleManager
      );

      const store = new JsonStore<Event[]>(new FileStore([id]));
      // We have to leave room for the agent's next action, which is of unknown size
      const compressionThreshold = Math.round(contextWindowSize[model] * 0.75);
      const memory = new Memory(id, moduleManager, store, compressionThreshold);

      agentProcess.on('message', (message: AgentMessage) => {
        if (message.agentId === id) {
          if (message.type === 'takeAction') {
            this.takeAction(message.agentId);
          }
        }
      });

      this.messageBus.subscribe((message) => {
        if (message.targetAgentIds && !message.targetAgentIds.includes(id))
          return;
        memory.append({ type: 'message', message });
      });

      this.agents.push({
        id,
        process: agentProcess,
        memory,
        messageBus,
        moduleManager,
        actionHandler
      });

      agentProcess.send({
        type: 'init',
        id
      });
    }
  }

  public async takeAction(agentId: string): Promise<void> {
    const agent = this.agents.find((a) => a.id === agentId);

    if (agent) {
      try {
        let events = await agent.memory.retrieve();

        // Do not act again if the last event was a decision
        if (last(events)?.type === 'decision') return;

        const actionText = await makeDecision(events);
        console.log('actionText', actionText);
        // Reassign events in case summarization occurred
        events = await agent.memory.append({
          type: 'decision',
          actionText
        });

        const result = parseAction(agent.moduleManager.actions, actionText);

        if (result.type === 'error') {
          agent.messageBus.send(messageBuilder.error(agent.id, result.message));
        } else {
          await agent.actionHandler.handle(agent.id, result.action);
        }
      } catch (e) {
        console.error(
          `${agentName(
            agent.id
          )} encountered the following problem while attempting to take action:`
        );
        console.error(e);
      } finally {
        await sleep(5000);
      }
    }
  }
}
