import { Event, MessageEvent } from "./event";
import { EventLog } from "./event-log";
import { Memory } from "./memory";

import eventSchema from "../schema/event.json";
import { validateEvent } from "./schema-validators";

export class Agent {
  constructor(
    private agentId: string,
    private eventLog: EventLog,
    private memory: Memory
  ) {}

  async handleEvent(event: Event) {
    const isValid = validateEvent(event);
    console.log(
      `Agent ${this.agentId} received ${
        isValid ? "valid" : "invalid"
      } event: ${JSON.stringify(event)}`
    );
    if (!isValid) {
      console.log(`Validation errors: ${validateEvent.errors}`);
    }
  }
}
