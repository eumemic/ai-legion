import { Event } from "./event-types";
import { Action } from "./action-types";

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
  append(event: Memento): Promise<Memento[]>;
  retrieve(): Promise<Memento[]>;
}
