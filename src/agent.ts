// agent.ts

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

    if (typeof process !== 'undefined' && process.send) {
      if (process) process.send(agentMessage);
    }
  }
}

process.on('message', (message: Message) => {
  if (message.type === 'init') {
    const agentId = message.id;

    const agent = new Agent(agentId);

    const agentMessage: AgentMessage = {
      agentId,
      type: 'subscribed'
    };

    if (typeof process !== 'undefined' && process.send) {
      if (process) process.send(agentMessage);
    }

    const taskQueue = new TaskQueue();

    // Act on messages periodically
    taskQueue.runPeriodically(() => agent.callTakeAction(), ACTION_INTERVAL);

    agent.callTakeAction();
  }
});
