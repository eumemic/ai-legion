import { RedisClientType, createClient } from "redis";
import { Memory } from "./memory";
import { Event } from "./event";
import { Action } from "./action";

export class RedisMemory implements Memory {
  private client: RedisClientType;

  constructor() {
    this.client = createClient();
  }

  async saveEvent(event: Event): Promise<void> {
    const agentId = event.type === "message" ? event.toId : undefined;
    if (agentId) {
      await this.saveToAgentMemory(agentId, event);
    }
  }

  async saveAction(agentId: string, action: Action): Promise<void> {
    await this.saveToAgentMemory(agentId, action);
  }

  async getMemory(agentId: string): Promise<Array<Event | Action>> {
    const memoryJSON = await this.client.get(agentId);
    return memoryJSON ? JSON.parse(memoryJSON) : [];
  }

  private async saveToAgentMemory(
    agentId: string,
    data: Event | Action
  ): Promise<void> {
    const currentMemory = await this.getMemory(agentId);
    currentMemory.push(data);
    await this.client.set(agentId, JSON.stringify(currentMemory));
  }
}
