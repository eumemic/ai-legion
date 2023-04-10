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

const numberOfAgents = 3;

const agentIds = Array.from({ length: numberOfAgents }, (_, i) => `${i}`);

const messageBus: MessageBus = new InMemoryMessageBus();
const actionHandler = new ActionHandler(agentIds, messageBus);

main();

async function main() {
  startConsole(agentIds, messageBus);

  for (const id of agentIds.slice(1)) {
    const memory: Memory = new InMemoryMemory(
      messageBuilder.primer(id),
      messageBuilder.generic(
        id,
        `this is your first task. using the actions at your disposal, familiarize yourselves with the codebase. discuss with the other agent(s), comparing notes about how you think things work. once you feel like you understand it at a high level, one of you should write up a README.md file in the root directory summarizing the project.`
      ),
      messageBuilder.agentResponse(id, "help"),
      messageBuilder.listAllActions(id)
    );
    const agent = new Agent(id, memory, messageBus, actionHandler);
    await agent.start();
  }
}
