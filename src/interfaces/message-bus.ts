import { IMessage } from "./message";

export interface IMessageBus {
  subscribe(listener: (message: IMessage) => void): void;
  unsubscribe(listener: (message: IMessage) => void): void;
  send(message: IMessage): void;
}
