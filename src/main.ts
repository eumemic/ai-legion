import dotenv from "dotenv";
import ActionHandler from "./action-handler";
import { ActionDictionary } from "./action/action-dictionary";
import { allActionDefinitions } from "./action/definitions";
import { Agent } from "./agent";
import { startConsole } from "./console";
import { InMemoryMessageBus } from "./in-memory-message-bus";
import { Memory, messageMemento } from "./memory";
import { CODE_BLOCK_DELIMITER, messageBuilder } from "./message";
import { MessageBus } from "./message-bus";
import { numberOfAgents } from "./parameters";
import { agentName, MULTILINE_DELIMITER } from "./util";
import { InMemoryStore } from "./store/in-memory-store";

dotenv.config();

const agentIds = Array.from({ length: numberOfAgents + 1 }, (_, i) => `${i}`);

const actionDictionary = new ActionDictionary(allActionDefinitions);
const messageBus: MessageBus = new InMemoryMessageBus();
const actionHandler = new ActionHandler(agentIds, messageBus, actionDictionary);

main();

async function main() {
  startConsole(agentIds, messageBus);

  const store = new InMemoryStore();

  for (const id of agentIds.slice(1)) {
    const memory = new Memory(id, store);
    const agent = new Agent(
      id,
      memory,
      messageBus,
      actionDictionary,
      actionHandler
    );
    await agent.start();
  }
}
