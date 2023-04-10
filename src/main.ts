import { Agent } from "./agent";
import { EventLog } from "./event-log";
import { InMemoryEventLog } from "./in-memory-event-log";
import { InMemoryMemory } from "./in-memory-memory";
import { Memory } from "./memory";
import dotenv from "dotenv";

dotenv.config();

const numberOfAgents = 1;
const pollingInterval = 10000;

const agentIds = Array.from({ length: numberOfAgents }, (_, i) => `${i + 1}`);

const eventLog: EventLog = new InMemoryEventLog();
const memory: Memory = new InMemoryMemory();

const agents: Agent[] = agentIds.map((id) => new Agent(id, eventLog, memory));

// Set up the event loop to trigger heartbeats and handle other events
async function main() {
  while (true) {
    for (const agent of agents) {
      const action = await agent.handleEvent({ type: "heartbeat" });
      console.log(
        `action received from agent ${agent.id}: ${JSON.stringify(
          action,
          null,
          2
        )}`
      );
    }
    await new Promise((resolve) => setTimeout(resolve, pollingInterval));
  }
}

main();
