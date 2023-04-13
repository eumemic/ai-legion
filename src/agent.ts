// agent.ts

import { parentPort } from 'worker_threads';
import TaskQueue from './task-queue';

const ACTION_INTERVAL = 10 * 1000;

interface Message {
  type: string;
  id: string;
  memoryFunction: string;
}

interface AgentMessage {
  agentId: string;
  type: string;
  data?: any;
}

class Agent {
  private agentId: string;

  constructor(agentId: string) {
    this.agentId = agentId;
  }

  public async callTakeAction(): Promise<void> {
    const agentMessage: AgentMessage = {
      agentId: this.agentId,
      type: 'takeAction'
    };
    parentPort?.postMessage(agentMessage);
  }
}

if (!parentPort) {
  throw new Error('Agent must be run as a worker thread');
}

parentPort.on('message', (message: Message) => {
  if (message.type === 'init' && parentPort) {
    const agentId = message.id;

    const agent = new Agent(agentId);

    const agentMessage: AgentMessage = {
      agentId,
      type: 'subscribed'
    };

    parentPort.postMessage(agentMessage);
    const taskQueue = new TaskQueue();

    // Act on messages periodically
    taskQueue.runPeriodically(() => agent.callTakeAction(), ACTION_INTERVAL);

    agent.callTakeAction();
  }
});
