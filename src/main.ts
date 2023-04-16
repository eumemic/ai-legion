import dotenv from "dotenv";
import { startConsole } from "./console";
import { InMemoryMessageBus } from "services/in-memory-message-bus";
import { IMessageBus } from "interfaces/message-bus";

import { Control } from "./control";
import { webSocketServer } from "services/web-socket-server";
import { applicationStore } from "store/application";
import { openAImodel } from "interfaces/open-ai-model";

dotenv.config();

const [numAgents, modelString] = process.argv.slice(2);

const messageBus: IMessageBus = new InMemoryMessageBus();

(async function () {
  await applicationStore.connect();

  await applicationStore.set("numberOfAgents", Number(numAgents));

  if (modelString)
    await applicationStore.set("modelType", modelString as openAImodel);

  const model = await applicationStore.get("modelType");
  const numberOfAgents = await applicationStore.get("numberOfAgents");

  console.log(`Number of agents: ${numberOfAgents}`);
  console.log(`Model: ${model}`);

  const agentIds = Array.from({ length: numberOfAgents + 1 }, (_, i) => `${i}`);

  await applicationStore.set("agents", agentIds);

  webSocketServer(messageBus, 8080);
  startConsole(agentIds, messageBus);

  const control = new Control(messageBus);
})();
