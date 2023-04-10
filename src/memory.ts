import { Message } from "./message";

export interface Memory {
  append(message: Message): Promise<Message[]>;
  retrieve(): Promise<Message[]>;
}
