import dotenv from "dotenv";
import ActionHandler from "./action-handler";
import { Agent } from "./agent";
import { startConsole } from "./console";
import { InMemoryMessageBus } from "./in-memory-message-bus";
import { Event, Memory } from "./memory";
import { MessageBus } from "./message-bus";
import core from "./module/definitions/core";
import filesystem from "./module/definitions/filesystem";
import goals from "./module/definitions/goals";
import messaging from "./module/definitions/messaging";
import notes from "./module/definitions/notes";
import web from "./module/definitions/web";
import { ModuleManager } from "./module/module-manager";
import { contextWindowSize } from "./openai";
import { model, numberOfAgents } from "./parameters";
import FileStore from "./store/file-store";
import JsonStore from "./store/json-store";

dotenv.config();

const agentIds = Array.from({ length: numberOfAgents + 1 }, (_, i) => `${i}`);

const messageBus: MessageBus = new InMemoryMessageBus();

main();

async function main() {
  startConsole(agentIds, messageBus);

  for (const id of agentIds.slice(1)) {
    const moduleManager = new ModuleManager(id, agentIds, [
      core,
      goals,
      notes,
      messaging,
      filesystem,
      web,
    ]);
    const actionHandler = new ActionHandler(
      agentIds,
      messageBus,
      moduleManager
    );

    const store = new JsonStore<Event[]>(new FileStore([id]));
    // We have to leave room for the agent's next action, which is of unknown size
    const compressionThreshold = Math.round(contextWindowSize[model] * 0.75);
    const memory = new Memory(id, moduleManager, store, compressionThreshold);
    const agent = new Agent(
      id,
      memory,
      messageBus,
      moduleManager,
      actionHandler
    );
    await agent.start();
  }
}
