import { Decision } from "../make-decision";
import { Message } from "../message";
export { Memory } from "./memory";

export type Memento = MessageMemento | DecisionMemento;

export interface MessageMemento {
  type: "message";
  message: Message;
}

export interface DecisionMemento {
  type: "decision";
  agentId: string;
  decision: Decision;
}

export function messageMemento(message: Message): Memento {
  return { type: "message", message };
}

export function decisionMemento(agentId: string, decision: Decision): Memento {
  return { type: "decision", agentId, decision };
}
