import dotenv from "dotenv";
import { startConsole } from "./console";
import { InMemoryMessageBus } from "./services/in-memory-message-bus";
import { IMessageBus } from "./interfaces/messageBus.interface";
import { numberOfAgents, model } from "./parameters";
import { Control } from "./control";

dotenv.config();

const agentIds = Array.from({ length: numberOfAgents + 1 }, (_, i) => `${i}`);

const messageBus: IMessageBus = new InMemoryMessageBus();

console.log(`Number of agents: ${numberOfAgents}`);
console.log(`Model: ${model}`);

main();

async function main() {
  startConsole(agentIds, messageBus);
  const control = new Control(model, agentIds, messageBus);
}
