import { Message } from "./message";

export interface MessageBus {
  subscribe(listener: (message: Message) => void): void;
  unsubscribe(listener: (message: Message) => void): void;
  send(message: Message): void;
}
