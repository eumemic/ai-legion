import { EventEmitter } from "events";
import { Event } from "./event-types";
import { EventLog } from "./event-log";

export class InMemoryEventLog implements EventLog {
  private emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter();
  }

  subscribe(listener: (event: Event) => Promise<void>): void {
    this.emitter.on("event", listener);
  }

  unsubscribe(listener: (event: Event) => Promise<void>): void {
    this.emitter.off("event", listener);
  }

  publish(event: Event): void {
    this.emitter.emit("event", event);
  }
}
