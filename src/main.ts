import dotenv from 'dotenv';

import { startConsole } from './console';
import { InMemoryMessageBus } from './in-memory-message-bus';

import { MessageBus } from './message-bus';

import { numberOfAgents, model } from './parameters';

import { Control } from './control';

dotenv.config();

const agentIds = Array.from({ length: numberOfAgents + 1 }, (_, i) => `${i}`);

console.log('main', agentIds, numberOfAgents);
const messageBus: MessageBus = new InMemoryMessageBus();

main();

async function main() {
  startConsole(agentIds, messageBus);
  const control = new Control(model, agentIds, messageBus);
}
