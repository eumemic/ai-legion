import { Memento, Memory } from "./memory";

export class InMemoryMemory implements Memory {
  constructor() {}

  private mementos: Memento[] = [];

  async append(memento: Memento): Promise<Memento[]> {
    this.mementos.push(memento);
    return this.mementos;
  }

  async retrieve(): Promise<Memento[]> {
    return this.mementos;
  }
}
