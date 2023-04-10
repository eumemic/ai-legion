import { Memory } from "./memory";
import { Message } from "./message";

export class InMemoryMemory implements Memory {
  private messages: Message[] = [];

  constructor(...preloadedMessages: Message[]) {
    this.messages.push(...preloadedMessages);
    // this.messages.forEach(printMessage);
  }

  async append(message: Message): Promise<Message[]> {
    if (message.messageType !== "heartbeat") printMessage(message);
    this.messages.push(message);
    return this.messages;
  }

  async retrieve(): Promise<Message[]> {
    return this.messages;
  }
}

function printMessage(message: Message) {
  console.log(
    `Agent ${
      message.sourceAgentId
    } (${message.openaiMessage.role.toUpperCase()}):\n\n${message.openaiMessage.content.trim()}\n\n========\n`
  );
}
