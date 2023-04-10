import { Event } from "./event";

export interface EventLog {
  subscribe(listener: (event: Event) => void): void;
  unsubscribe(listener: (event: Event) => void): void;
  publish(event: Event): void;
}
