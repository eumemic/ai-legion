import dotenv from "dotenv";
import ActionHandler from "./action-handler";
import { Agent } from "./agent";
import { InMemoryMemory } from "./in-memory-memory";
import { InMemoryMessageBus } from "./in-memory-message-bus";
import { Memory } from "./memory";
import { messageBuilder } from "./message";
import { MessageBus } from "./message-bus";

dotenv.config();

const numberOfAgents = 2;

const agentIds = Array.from({ length: numberOfAgents }, (_, i) => `${i + 1}`);

const messageBus: MessageBus = new InMemoryMessageBus();
const actionHandler = new ActionHandler(agentIds, messageBus);

main();

async function main() {
  for (const id of agentIds) {
    const memory: Memory = new InMemoryMemory(
      messageBuilder.primer(id),
      messageBuilder.agentResponse(
        id,
        "Hello Control, it is nice to meet you as well. I understand the Action Dictionary and will respond with Actions in the specified format. Please let me know if there is anything specific you would like me to do at this time."
      ),
      messageBuilder.malformattedResponseError(id),
      messageBuilder.agentResponse(
        id,
        `{
  "payload": {
    "type": "no-op"
  },
  "comment": "There is no immediate action that I need to take in response to the heartbeat message." 
}`
      ),
      messageBuilder.generic(
        id,
        `Hello Agent 1, this is Control. Perfect, that is a correctly formatted response. Now here is your first task: I'd like you to reach out to other agents in the system and brainstorm ideas for how we can generate revenue for the company. We have a starting budget of $100, and want to create a passive income stream as quickly as possible without requiring any manual labor.`
      )
    );
    const agent = new Agent(id, memory, messageBus, actionHandler);
    await agent.start();
    // stagger the starting times of the agents
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}
