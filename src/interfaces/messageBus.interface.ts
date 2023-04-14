import { IMessage } from "./message.interface";

export interface IMessageBus {
  subscribe(listener: (message: IMessage) => void): void;
  unsubscribe(listener: (message: IMessage) => void): void;
  send(message: IMessage): void;
}
