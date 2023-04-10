import { Memory } from "./memory";
import { Message } from "./message";

export class InMemoryMemory implements Memory {
  constructor() {}

  private messages: Message[] = [];

  async append(message: Message): Promise<Message[]> {
    console.log(
      `Agent ${
        message.sourceAgentId
      }:\n\n${message.openaiMessage.content.trim()}\n\n========\n`
    );
    this.messages.push(message);
    return this.messages;
  }

  async retrieve(): Promise<Message[]> {
    return this.messages;
  }
}
