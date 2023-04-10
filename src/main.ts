import dotenv from "dotenv";
import ActionHandler from "./action-handler";
import { ActionDictionary } from "./action/action-dictionary";
import { allActionDefinitions } from "./action/definitions";
import { Agent } from "./agent";
import { startConsole } from "./console";
import { InMemoryMessageBus } from "./in-memory-message-bus";
import { Memory } from "./memory";
import { MessageBus } from "./message-bus";
import { model, numberOfAgents } from "./parameters";
import { FileStore } from "./store/file-store";
import { contextWindowSize } from "./openai";

dotenv.config();

const agentIds = Array.from({ length: numberOfAgents + 1 }, (_, i) => `${i}`);

const actionDictionary = new ActionDictionary(allActionDefinitions);
const messageBus: MessageBus = new InMemoryMessageBus();
const actionHandler = new ActionHandler(agentIds, messageBus, actionDictionary);

main();

async function main() {
  startConsole(agentIds, messageBus);

  for (const id of agentIds.slice(1)) {
    const store = new FileStore([id]);
    // We have to leave room for the agent's next action, which is of unknown size
    const compressionThreshold = Math.round(contextWindowSize[model] * 0.75);
    const memory = new Memory(id, store, compressionThreshold);
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
