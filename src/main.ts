import dotenv from "dotenv";
import ActionHandler from "./action-handler";
import { ActionDictionary } from "./action/action-dictionary";
import { allActionDefinitions } from "./action/definitions";
import { Agent } from "./agent";
import { startConsole } from "./console";
import { InMemoryMemory } from "./in-memory-memory";
import { InMemoryMessageBus } from "./in-memory-message-bus";
import { actionMemento, Memory, messageMemento } from "./memory";
import { messageBuilder } from "./message";
import { MessageBus } from "./message-bus";
import { numberOfAgents } from "./parameters";

dotenv.config();

const agentIds = Array.from({ length: numberOfAgents + 1 }, (_, i) => `${i}`);

const actionDictionary = new ActionDictionary(allActionDefinitions);
const messageBus: MessageBus = new InMemoryMessageBus();
const actionHandler = new ActionHandler(agentIds, messageBus, actionDictionary);

main();

async function main() {
  startConsole(agentIds, messageBus);

  for (const id of agentIds.slice(1)) {
    const memory: Memory = new InMemoryMemory(
      messageMemento(messageBuilder.primer(id)),
      // messageMemento(
      //   messageBuilder.generic(
      //     id,
      //     `This is your first task. using the actions at your disposal, familiarize yourself with the codebase. once you feel like you understand it at a high level, write up a README.md summarizing the project.`
      //   )
      // ),
      actionMemento(id, "help"),
      messageMemento(messageBuilder.listAllActions(id, actionDictionary))
    );
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
