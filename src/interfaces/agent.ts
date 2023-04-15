import { IMessage } from "./message";

export interface IAgentMessage {
  agentId: string;
  type: string;
  agentMessage?: IMessage | string;
  data?: any;
}
