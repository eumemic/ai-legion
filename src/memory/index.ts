import { Decision } from "../make-decision";
import { Message } from "../message";
export { Memory } from "./memory";

export type Memento = MessageMemento | DecisionMemento;

export interface MessageMemento {
  type: "message";
  message: Message;
}

export interface DecisionMemento {
  type: "action";
  agentId: string;
  decision: Decision;
}

export interface MemoryStorage {
  append(memento: Memento): Promise<Memento[]>;
  retrieve(): Promise<Memento[]>;
}

export function messageMemento(message: Message): Memento {
  return { type: "message", message };
}

export function decisionMemento(agentId: string, decision: Decision): Memento {
  return { type: "action", agentId, decision };
}
