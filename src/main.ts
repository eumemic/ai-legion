import { Agent } from "./agent";
import { EventBus } from "./event-bus";
import { InMemoryEventBus } from "./in-memory-event-bus";
import { InMemoryMemory } from "./in-memory-memory";
import { Memory } from "./memory";
import dotenv from "dotenv";
import ActionHandler from "./action-handler";

dotenv.config();

const numberOfAgents = 1;
const pollingInterval = 10000;

const agentIds = Array.from({ length: numberOfAgents }, (_, i) => `${i + 1}`);

const eventBus: EventBus = new InMemoryEventBus();
const memory: Memory = new InMemoryMemory();
const actionHandler = new ActionHandler();

const agents: Agent[] = agentIds.map((id) => new Agent(id, eventBus, memory));

main();

// Set up the event loop to trigger heartbeats and handle other events
async function main() {
  for (const agent of agents) {
    eventBus.subscribe(async (event) => {
      if (event.targetAgentIds && !event.targetAgentIds.includes(agent.id))
        return;

      console.log(
        `agent ${agent.id} received event: ${JSON.stringify(event, null, 2)}`
      );

      const action = await agent.handleEvent(event);
      if (action) actionHandler.handle(action);
    });
  }

  while (true) {
    eventBus.publish({ payload: { type: "heartbeat" } });
    await new Promise((resolve) => setTimeout(resolve, pollingInterval));
  }
}
