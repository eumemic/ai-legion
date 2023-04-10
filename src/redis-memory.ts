import { createClient, RedisClientType } from "redis";
import { Memory } from "./memory";
import { Message } from "./message";

export class RedisMemory implements Memory {
  private client: RedisClientType;

  constructor(private agentId: string) {
    this.client = createClient();
  }

  async append(memento: Message) {
    const messages = await this.retrieve();
    messages.push(memento);
    await this.client.set(this.agentId, JSON.stringify(messages));
    return messages;
  }

  async retrieve(): Promise<Message[]> {
    const messagesJson = await this.client.get(this.agentId);
    return messagesJson ? JSON.parse(messagesJson) : [];
  }
}
