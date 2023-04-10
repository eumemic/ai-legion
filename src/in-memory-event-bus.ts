import { EventEmitter } from "events";
import { Event } from "./event-types";
import { EventBus } from "./event-bus";

export class InMemoryEventBus implements EventBus {
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
