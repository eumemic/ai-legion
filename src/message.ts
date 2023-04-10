import { ActionDefinition } from "./action/action-definition";
import { ActionDictionary } from "./action/action-dictionary";
import { agentName, MULTILINE_DELIMITER } from "./util";

export interface Message {
  type: MessageType;
  source: MessageSource;
  targetAgentIds: string[];
  content: string;
}

type TypelessMessage = Omit<Message, "type">;

export type MessageType = keyof typeof messageBuilder;

export type MessageSource = SystemMessageSource | AgentMessageSource;

interface MessageSourceBase {
  id?: string;
}

interface SystemMessageSource extends MessageSourceBase {
  type: "system";
  id?: undefined;
}

interface AgentMessageSource extends MessageSourceBase {
  type: "agent";
  id: string;
}

export const systemSource: SystemMessageSource = { type: "system" };
export const agentSource = (id: string): AgentMessageSource => ({
  type: "agent",
  id,
});

export const CODE_BLOCK_DELIMITER = "```";

export const messageBuilder = addMessageTypes({
  standard: singleTargetSystemMessage,

  error: (agentId: string, content: string) =>
    singleTargetSystemMessage(agentId, `--- ERROR ---\n\n${content}`),

  agentToAgent: (
    sourceAgentId: string,
    targetAgentIds: string[],
    content: string
  ) => ({
    source: agentSource(sourceAgentId),
    targetAgentIds,
    content: `--- INCOMING MESSAGE FROM ${agentName(
      sourceAgentId
    ).toUpperCase()} ---\n\n${content}`,
  }),
});

function addMessageTypes<
  T extends Record<string, (...args: any) => TypelessMessage>
>(record: T): { [K in keyof T]: (...args: Parameters<T[K]>) => Message } {
  for (const [standardMessageType, builder] of Object.entries(record)) {
    (record as any)[standardMessageType] = (...args: any) => ({
      messageType: standardMessageType,
      ...(builder as any)(...args),
    });
  }
  return record as any;
}

function singleTargetSystemMessage(
  agentId: string,
  content: string
): TypelessMessage {
  return {
    source: systemSource,
    targetAgentIds: [agentId],
    content,
  };
}
