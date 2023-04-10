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

agentIds.forEach(async (id) => {
  const memory: Memory = new InMemoryMemory(
    messageBuilder.primer(id),
    messageBuilder.agentResponse(
      id,
      "Hello Control, it is nice to meet you as well. I understand the Action Dictionary and will respond with Actions in the specified format. Please let me know if there is anything specific you would like me to do at this time."
    ),
    messageBuilder.malformattedResponseError(id)
  );
  const agent = new Agent(id, memory, messageBus, actionHandler);
  await agent.start();
});
