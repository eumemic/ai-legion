export type Action = SendMessageAction;

export interface SendMessageAction {
  type: "send-message";
  agentId: string;
  message: string;
}
