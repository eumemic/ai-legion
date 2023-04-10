import { Message } from "./message";

export interface MessageBus {
  subscribe(listener: (message: Message) => Promise<void>): void;
  unsubscribe(listener: (message: Message) => Promise<void>): void;
  send(message: Message): void;
}
