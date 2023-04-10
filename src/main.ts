import dotenv from "dotenv";
import ActionHandler from "./action-handler";
import { Agent } from "./agent";
import { startConsole } from "./console";
import { InMemoryMemory } from "./in-memory-memory";
import { InMemoryMessageBus } from "./in-memory-message-bus";
import { Memory } from "./memory";
import { messageBuilder } from "./message";
import { MessageBus } from "./message-bus";
import { agentName } from "./util";

dotenv.config();

const numberOfAgents = 2;

const agentIds = Array.from({ length: numberOfAgents }, (_, i) => `${i}`);

const messageBus: MessageBus = new InMemoryMessageBus();
const actionHandler = new ActionHandler(agentIds, messageBus);

main();

async function main() {
  startConsole(agentIds, messageBus);

  for (const id of agentIds.slice(1)) {
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
            comment: "Nothing to do at this time.",
          },
          null,
          2
        )
      ),
      messageBuilder.generic(
        id,
        `Hello ${agentName(
          id
        )}, this is Control. Perfect, that is a correctly formatted response!`
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
            comment: "Seeking to network with other agents.",
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
  }
}
