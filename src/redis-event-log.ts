import { createClient, RedisClientType } from "redis";
import { Event } from "./event-types";
import { EventLog } from "./event-log";

export class RedisEventLog implements EventLog {
  private publisher: RedisClientType;
  private subscriber: RedisClientType;
  private channel = "eventChannel";

  constructor() {
    this.publisher = createClient();
    this.subscriber = createClient();
  }

  subscribe(listener: (event: Event) => Promise<void>): void {
    this.subscriber.on("message", (channel, message) => {
      if (channel === this.channel) {
        const event: Event = JSON.parse(message);
        listener(event);
      }
    });
    this.subscriber.subscribe(this.channel, () => {});
  }

  unsubscribe(listener: (event: Event) => Promise<void>): void {
    this.subscriber.removeListener("message", listener);
    this.subscriber.unsubscribe(this.channel, () => {});
  }

  publish(event: Event): void {
    const message = JSON.stringify(event);
    this.publisher.publish(this.channel, message);
  }
}
