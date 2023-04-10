import { RedisClientType, createClient } from "redis";
import { Memento, Memory } from "./memory";

export class RedisMemory implements Memory {
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
    const memoryJSON = await this.client.get(this.agentId);
    return memoryJSON ? JSON.parse(memoryJSON) : [];
  }
}
