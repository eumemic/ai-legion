import { fork, ChildProcess } from 'child_process';
import { Message, messageBuilder } from './message';
import { MessageBus } from './message-bus';
import path from 'path';
import { AgentMessage } from './agent';

interface Agent {
  id: string;
  process: ChildProcess;
}

export class Control {
  private agents: Agent[] = [];

  constructor(agentIds: string[], private messageBus: MessageBus) {
    for (const id of agentIds.slice(1)) {
      const agentModulePath = path.join(__dirname, 'agent');

      const agentProcess = fork(agentModulePath);

      agentProcess.on('message', (message: AgentMessage) => {
        if (message.agentId === id)
          switch (message.type) {
            case 'message':
              if (message.agentMessage)
                this.messageBus.send(message.agentMessage as Message);
              break;

            case 'error':
              if (message.agentMessage)
                this.messageBus.send(
                  messageBuilder.error(
                    message.agentId,
                    message.agentMessage as string
                  )
                );
              break;
            default:
              return;
          }
      });

      this.messageBus.subscribe((message) => {
        if (message.targetAgentIds && !message.targetAgentIds.includes(id))
          return;
        agentProcess.send({
          type: 'appendMemory',
          controlMessage: message
        });
      });

      this.agents.push({
        id,
        process: agentProcess
      });

      agentProcess.send({
        type: 'init',
        controlMessage: { id, agents: agentIds }
      });
    }
  }
}
