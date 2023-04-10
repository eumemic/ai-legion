import dotenv from "dotenv";
import ActionHandler from "./action-handler";
import { Agent } from "./agent";
import { InMemoryMemory } from "./in-memory-memory";
import { InMemoryMessageBus } from "./in-memory-message-bus";
import { Memory } from "./memory";
import { messageBuilder } from "./message";
import { MessageBus } from "./message-bus";
import { agentName } from "./util";

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
        JSON.stringify(
          {
            payload: {
              type: "no-op",
            },
            comment:
              "There is no immediate action that I need to take in response to the heartbeat message.",
          },
          null,
          2
        )
      ),
      messageBuilder.generic(
        id,
        `Hello ${agentName(
          id
        )}, this is Control. Perfect, that is a correctly formatted response. Now here is your first task: I'd like you to reach out to other agents in the system and brainstorm ideas for how we can generate revenue for the company. We have a starting budget of $100, and want to create a passive income stream as quickly as possible without requiring any manual labor.`
      ),
      messageBuilder.agentResponse(
        id,
        JSON.stringify(
          {
            payload: {
              type: "send-message",
              targetAgentId: "all",
              message: "Hello other agents, how are you today?",
            },
            comment:
              "Sending message to other agents requesting them to brainstorm ideas for generating passive income with a budget of $100.",
          },
          null,
          2
        )
      ),
      messageBuilder.generic(
        id,
        `You tried to send your message to an invalid targetAgentId ("all"). You can use the 'query-agent-registry' action to see a list of available agents and their agent IDs.`
      ),
      messageBuilder.agentResponse(
        id,
        JSON.stringify(
          {
            payload: {
              type: "query-agent-registry",
            },
            comment:
              "Requesting the agent registry to get a list of available agents and their IDs.",
          },
          null,
          2
        )
      ),
      messageBuilder.listAgents(id, agentIds)
    );
    const agent = new Agent(id, memory, messageBus, actionHandler);
    await agent.start();
    // stagger the starting times of the agents
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}
