import { Agent } from "./agent";
import { EventLog } from "./event-log";
import { InMemoryEventLog } from "./in-memory-event-log";
import { InMemoryMemory } from "./in-memory-memory";
import { Memory } from "./memory";
import dotenv from "dotenv";
import ActionHandler from "./action-handler";

dotenv.config();

const numberOfAgents = 1;
const pollingInterval = 10000;

const agentIds = Array.from({ length: numberOfAgents }, (_, i) => `${i + 1}`);

const eventLog: EventLog = new InMemoryEventLog();
const memory: Memory = new InMemoryMemory();
const actionHandler = new ActionHandler();

const agents: Agent[] = agentIds.map((id) => new Agent(id, eventLog, memory));

main();

// Set up the event loop to trigger heartbeats and handle other events
async function main() {
  for (const agent of agents) {
    eventLog.subscribe(async (event) => {
      console.log(`processing event: ${JSON.stringify(event, null, 2)}`);
      const action = await agent.handleEvent(event);
      if (action) actionHandler.handle(action);
    });
  }

  while (true) {
    for (const agent of agents) eventLog.publish({ type: "heartbeat" });
    await new Promise((resolve) => setTimeout(resolve, pollingInterval));
  }
}
