import dotenv from "dotenv";
import ActionHandler from "./action-handler";
import { Agent } from "./agent";
import { InMemoryMemory } from "./in-memory-memory";
import { InMemoryMessageBus } from "./in-memory-message-bus";
import { Memory } from "./memory";
import { standardMessages } from "./message";
import { MessageBus } from "./message-bus";

dotenv.config();

const numberOfAgents = 1;

const agentIds = Array.from({ length: numberOfAgents }, (_, i) => `${i + 1}`);

const messageBus: MessageBus = new InMemoryMessageBus();
const actionHandler = new ActionHandler();

agentIds.forEach(async (id) => {
  const memory: Memory = new InMemoryMemory(
    standardMessages.primer(id),
    standardMessages.agentResponse(
      id,
      "Hello Control, it is nice to meet you as well. I understand the Action Dictionary and will respond with Actions in the specified format. Please let me know if there is anything specific you would like me to do at this time."
    ),
    standardMessages.malformattedResponseError(id)
  );
  const agent = new Agent(id, memory, messageBus, actionHandler);
  await agent.start();
});
