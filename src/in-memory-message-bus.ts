import { EventEmitter } from "events";
import { MessageBus } from "./message-bus";
import { Message } from "./message";

export class InMemoryMessageBus implements MessageBus {
  private emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter();
  }

  subscribe(listener: (message: Message) => Promise<void>): void {
    this.emitter.on("message", listener);
  }

  unsubscribe(listener: (message: Message) => Promise<void>): void {
    this.emitter.off("message", listener);
  }

  send(message: Message): void {
    this.emitter.emit("message", message);
  }
}
