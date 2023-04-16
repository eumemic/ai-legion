import { createClient, RedisClientType } from "redis";
import { IMessageBus } from "../interfaces/message-bus";
import { IMessage } from "../interfaces/message";

export class RedisMessageBus implements IMessageBus {
  private publisher: RedisClientType;
  private subscriber: RedisClientType;
  private channel = "messages";

  constructor() {
    this.publisher = createClient();
    this.subscriber = createClient();
  }

  subscribe(listener: (message: IMessage) => void): void {
    this.subscriber.on("message", (channel, message) => {
      if (channel === this.channel) {
        listener(JSON.parse(message));
      }
    });
    this.subscriber.subscribe(this.channel, () => {});
  }

  unsubscribe(listener: (message: IMessage) => void): void {
    this.subscriber.removeListener("message", listener);
    this.subscriber.unsubscribe(this.channel, () => {});
  }

  send(message: IMessage): void {
    this.publisher.publish(this.channel, JSON.stringify(message));
  }
}
