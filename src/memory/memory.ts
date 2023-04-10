import { Memento, MemoryStorage } from ".";

export class Memory implements MemoryStorage {
  constructor(private storage: MemoryStorage) {}

  append(memento: Memento): Promise<Memento[]> {
    return this.storage.append(memento);
  }
  retrieve(): Promise<Memento[]> {
    return this.storage.retrieve();
  }
}
