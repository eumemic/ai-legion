import { Memory } from "./memory";
import { Message } from "./message";
import { agentName } from "./util";

export class InMemoryMemory implements Memory {
  private messages: Message[] = [];

  constructor(...preloadedMessages: Message[]) {
    this.messages.push(...preloadedMessages);
    // this.messages.forEach(printMessage);
  }

  async append(message: Message): Promise<Message[]> {
    printMessage(message);
    this.messages.push(message);
    return this.messages;
  }

  async retrieve(): Promise<Message[]> {
    return this.messages;
  }
}

function printMessage(message: Message) {
  console.log(
    `${agentName(message.sourceAgentId)} -> ${
      message.targetAgentIds?.map(agentName).join(",") || "all agents"
    }:\n\n${message.openaiMessage.content.trim()}\n\n=============\n`
  );
}
