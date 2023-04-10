import { createClient, RedisClientType } from "redis";
import { Memento, MemoryStorage } from ".";

export class RedisMemoryStorage implements MemoryStorage {
  private client: RedisClientType;

  constructor(private agentId: string) {
    this.client = createClient();
  }

  async append(memento: Memento) {
    const mementos = await this.retrieve();
    mementos.push(memento);
    await this.client.set(this.agentId, JSON.stringify(mementos));
    return mementos;
  }

  async retrieve(): Promise<Memento[]> {
    const mementosJson = await this.client.get(this.agentId);
    return mementosJson ? JSON.parse(mementosJson) : [];
  }
}
