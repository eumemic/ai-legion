import { Memory } from "./memory";
import { Event } from "./event";
import { Action } from "./action";

export class InMemoryMemory implements Memory {
  private memoryStore: Map<string, Array<Event | Action>> = new Map();

  async saveEvent(event: Event): Promise<void> {
    const agentId = event.type === "message" ? event.toId : undefined;
    if (agentId) {
      this.saveToAgentMemory(agentId, event);
    }
  }

  async saveAction(agentId: string, action: Action): Promise<void> {
    this.saveToAgentMemory(agentId, action);
  }

  async getMemory(agentId: string): Promise<Array<Event | Action>> {
    return this.memoryStore.get(agentId) || [];
  }

  private saveToAgentMemory(agentId: string, data: Event | Action): void {
    const currentMemory = this.memoryStore.get(agentId) || [];
    currentMemory.push(data);
    this.memoryStore.set(agentId, currentMemory);
  }
}
