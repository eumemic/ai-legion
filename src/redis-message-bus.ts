import { createClient, RedisClientType } from "redis";
import { MessageBus, Message } from "./message-bus";

export class RedisMessageBus implements MessageBus {
  private publisher: RedisClientType;
  private subscriber: RedisClientType;
  private channel = "messages";

  constructor() {
    this.publisher = createClient();
    this.subscriber = createClient();
  }

  subscribe(listener: (message: Message) => Promise<void>): void {
    this.subscriber.on("message", (channel, message) => {
      if (channel === this.channel) {
        listener(JSON.parse(message));
      }
    });
    this.subscriber.subscribe(this.channel, () => {});
  }

  unsubscribe(listener: (message: Message) => Promise<void>): void {
    this.subscriber.removeListener("message", listener);
    this.subscriber.unsubscribe(this.channel, () => {});
  }

  publish(message: Message): void {
    this.publisher.publish(this.channel, JSON.stringify(message));
  }
}
