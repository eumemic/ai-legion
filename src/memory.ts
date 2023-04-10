import { Message } from "./message";

export type Memento = MessageMemento | ActionMemento;

export interface MessageMemento {
  type: "message";
  message: Message;
}

export interface ActionMemento {
  type: "action";
  agentId: string;
  actionText: string;
}

export interface Memory {
  append(memento: Memento): Promise<Memento[]>;
  retrieve(): Promise<Memento[]>;
}

export function messageMemento(message: Message): Memento {
  return { type: "message", message };
}

export function actionMemento(agentId: string, actionText: string): Memento {
  return { type: "action", agentId, actionText };
}
