import { Decision } from "../make-decision";
import { Message } from "../message";
export { Memory } from "./memory";

export type Event = MessageEvent | DecisionEvent;

export interface MessageEvent {
  type: "message";
  message: Message;
}

export interface DecisionEvent {
  type: "decision";
  decision: Decision;
}
