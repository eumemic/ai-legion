import { EventEmitter } from "events";
import { IMessageBus } from "../interfaces/messageBus";
import { IMessage } from "../interfaces/message";

export class InMemoryMessageBus extends EventEmitter implements IMessageBus {
  subscribe(listener: (message: IMessage) => void): void {
    this.addListener("message", listener);
  }

  unsubscribe(listener: (message: IMessage) => void): void {
    this.removeListener("message", listener);
  }

  send(message: IMessage): void {
    this.emit("message", message);
  }
}
