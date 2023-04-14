import { messageBuilder } from "../message";
import { IMessageSource } from "./messageSource.interface";

export type MessageType = keyof typeof messageBuilder;

export interface IMessage {
  type: MessageType;
  source: IMessageSource;
  targetAgentIds: string[];
  content: string;
}
