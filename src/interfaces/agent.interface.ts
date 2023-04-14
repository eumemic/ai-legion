import { IMessage } from "./message.interface";

export interface IAgentMessage {
  agentId: string;
  type: string;
  agentMessage?: IMessage | string;
  data?: any;
}
