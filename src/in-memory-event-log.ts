import { EventEmitter } from "events";
import { Event } from "./event";
import { EventLog } from "./event-log";

export class InMemoryEventLog implements EventLog {
  private emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter();
  }

  subscribe(listener: (event: Event) => void): void {
    this.emitter.on("event", listener);
  }

  unsubscribe(listener: (event: Event) => void): void {
    this.emitter.off("event", listener);
  }

  publish(event: Event): void {
    this.emitter.emit("event", event);
  }
}
