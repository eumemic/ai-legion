import { IMessage } from "../interfaces/message.interface";
export { Memory } from "./memory";

export type Event = MessageEvent | DecisionEvent;

export interface MessageEvent {
  type: "message";
  message: IMessage;
}

export interface DecisionEvent {
  type: "decision";
  actionText: string;
}
