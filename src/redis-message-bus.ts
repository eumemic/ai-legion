import { createClient, RedisClientType } from "redis";
import { MessageBus } from "./message-bus";
import { Message } from "./message";

export class RedisMessageBus implements MessageBus {
  private publisher: RedisClientType;
  private subscriber: RedisClientType;
  private channel = "messages";

  constructor() {
    this.publisher = createClient();
    this.subscriber = createClient();
  }

  subscribe(listener: (message: Message) => void): void {
    this.subscriber.on("message", (channel, message) => {
      if (channel === this.channel) {
        listener(JSON.parse(message));
      }
    });
    this.subscriber.subscribe(this.channel, () => {});
  }

  unsubscribe(listener: (message: Message) => void): void {
    this.subscriber.removeListener("message", listener);
    this.subscriber.unsubscribe(this.channel, () => {});
  }

  send(message: Message): void {
    this.publisher.publish(this.channel, JSON.stringify(message));
  }
}
