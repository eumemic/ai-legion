import dotenv from "dotenv";
import ActionHandler from "./action-handler";
import { Agent } from "./agent";
import { InMemoryMemory } from "./in-memory-memory";
import { InMemoryMessageBus } from "./in-memory-message-bus";
import { Memory } from "./memory";
import { MessageBus } from "./message-bus";

dotenv.config();

const numberOfAgents = 1;

const agentIds = Array.from({ length: numberOfAgents }, (_, i) => `${i + 1}`);

const messageBus: MessageBus = new InMemoryMessageBus();
const memory: Memory = new InMemoryMemory();
const actionHandler = new ActionHandler();

const agents: Agent[] = agentIds.map(
  (id) => new Agent(id, memory, messageBus, actionHandler)
);

agents.forEach((agent) => agent.start());
