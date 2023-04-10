import { ChatCompletionRequestMessage } from "openai";
import { Memory } from "./memory";

export class InMemoryMemory implements Memory {
  constructor() {}

  private messages: ChatCompletionRequestMessage[] = [];

  async append(
    message: ChatCompletionRequestMessage
  ): Promise<ChatCompletionRequestMessage[]> {
    console.log(JSON.stringify(message, null, 2));
    this.messages.push(message);
    return this.messages;
  }

  async retrieve(): Promise<ChatCompletionRequestMessage[]> {
    return this.messages;
  }
}
