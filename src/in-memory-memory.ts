import { Memento, Memory } from "./memory";

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
