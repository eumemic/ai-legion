import { ChatCompletionRequestMessage } from "openai";
import { Memory } from "./memory";

export class InMemoryMemory implements Memory {
  constructor() {}

  private messages: ChatCompletionRequestMessage[] = [];

  async append(
    message: ChatCompletionRequestMessage
  ): Promise<ChatCompletionRequestMessage[]> {
    console.log(
      `${message.role.toUpperCase()}:\n\n${message.content.trim()}\n\n========\n`
    );
    this.messages.push(message);
    return this.messages;
  }

  async retrieve(): Promise<ChatCompletionRequestMessage[]> {
    return this.messages;
  }
}
