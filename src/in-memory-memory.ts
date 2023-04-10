import { Memento, Memory } from "./memory";
import { Event } from "./event";
import { Action } from "./action";

export class InMemoryMemory implements Memory {
  constructor() {}

  private mementos: Memento[] = [];

  async append(memento: Memento): Promise<void> {
    this.mementos.push(memento);
  }

  async retrieve(): Promise<Memento[]> {
    return this.mementos;
  }
}
