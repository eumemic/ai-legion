import { Agent } from "./agent";
import { MessageBus } from "./message-bus";
import { InMemoryMessageBus } from "./in-memory-message-bus";
import { InMemoryMemory } from "./in-memory-memory";
import { Memory } from "./memory";
import dotenv from "dotenv";
import ActionHandler from "./action-handler";

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

      // console.log(
      //   `${agent.id} received message: ${JSON.stringify(message, null, 2)}`
      // );

      const action = await agent.receive(message);
      if (action) actionHandler.handle(action);
    });
  }

  while (true) {
    messageBus.send({ content: "heartbeat" });
    await new Promise((resolve) => setTimeout(resolve, pollingInterval));
  }
}
