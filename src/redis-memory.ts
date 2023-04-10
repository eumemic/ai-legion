import { ChatCompletionRequestMessage } from "openai";
import { RedisClientType, createClient } from "redis";
import { Memory } from "./memory";

export class RedisMemory implements Memory {
  private client: RedisClientType;

  constructor(private agentId: string) {
    this.client = createClient();
  }

  async append(memento: ChatCompletionRequestMessage) {
    const messages = await this.retrieve();
    messages.push(memento);
    await this.client.set(this.agentId, JSON.stringify(messages));
    return messages;
  }

  async retrieve(): Promise<ChatCompletionRequestMessage[]> {
    const messagesJson = await this.client.get(this.agentId);
    return messagesJson ? JSON.parse(messagesJson) : [];
  }
}
