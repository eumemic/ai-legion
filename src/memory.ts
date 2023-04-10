import { Event } from "./event";
import { Action } from "./action";

export type Memento = EventMemento | ActionMemento;

export interface EventMemento {
  type: "event";
  event: Event;
}

export interface ActionMemento {
  type: "action";
  action: Action;
}

export interface Memory {
  append(event: Memento): Promise<void>;
  retrieve(): Promise<Memento[]>;
}
