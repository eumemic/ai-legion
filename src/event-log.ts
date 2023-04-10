import { Event } from "./event-types";

export interface EventLog {
  subscribe(listener: (event: Event) => Promise<void>): void;
  unsubscribe(listener: (event: Event) => Promise<void>): void;
  publish(event: Event): void;
}
