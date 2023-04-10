import Ajv from "ajv";
import { Agent } from "./agent";
import { EventLog } from "./event-log";
import eventSchema from "./event-dictionary.json";
import { InMemoryEventLog } from "./in-memory-event-log";
import { InMemoryMemory } from "./in-memory-memory";
import { Memory } from "./memory";

const ajv = new Ajv({ allowMatchingProperties: true });

const validateEvent = ajv.compile(eventSchema);

const numberOfAgents = 5;
const agentIds = Array.from(
  { length: numberOfAgents },
  (_, i) => `Agent${i + 1}`
);

const eventLog: EventLog = new InMemoryEventLog();
const memory: Memory = new InMemoryMemory();

const agents: Agent[] = agentIds.map((id) => new Agent(id, eventLog, memory));

// Set up the event loop to trigger heartbeats and handle other events
async function main() {
  while (true) {
    for (const agent of agents) {
      const event = { type: "heartbeat" } as const;
      const isValid = validateEvent(event);

      console.log(
        `Event is ${isValid ? "valid" : "invalid"}: ${JSON.stringify(event)}`
      );
      if (!isValid) {
        console.log(validateEvent.errors);
      }

      agent.handleEvent(event);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

main();
