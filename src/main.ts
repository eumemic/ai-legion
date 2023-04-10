import dotenv from "dotenv";
import ActionHandler from "./action-handler";
import { Agent } from "./agent";
import { InMemoryMemory } from "./in-memory-memory";
import { InMemoryMessageBus } from "./in-memory-message-bus";
import { Memory } from "./memory";
import { MessageBus } from "./message-bus";
import { primerMessage } from "./messages";

dotenv.config();

const numberOfAgents = 1;
const pollingInterval = 10000;

const agentIds = Array.from({ length: numberOfAgents }, (_, i) => `${i + 1}`);

const messageBus: MessageBus = new InMemoryMessageBus();
const memory: Memory = new InMemoryMemory();
const actionHandler = new ActionHandler();

const agents: Agent[] = agentIds.map((id) => new Agent(id, messageBus, memory));

main();

// Set up the event loop to forward messages to agents and handle their resulting actions
async function main() {
  for (const agent of agents) {
    messageBus.subscribe(async (message) => {
      if (message.targetAgentIds && !message.targetAgentIds.includes(agent.id))
        return;

      const action = await agent.receive(message);
      if (action) actionHandler.handle(action);
    });

    messageBus.send({ content: primerMessage(agent.id) });
  }

  while (true) {
    await new Promise((resolve) => setTimeout(resolve, pollingInterval));
    messageBus.send({ content: "heartbeat" });
  }
}
