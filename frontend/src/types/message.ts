export interface Message {
  type: MessageType;
  source: MessageSource;
  targetAgentIds: string[];
  content: string;
  activeAgents?: string[];
}

type TypelessMessage = Omit<Message, 'type'>;

export type MessageType = keyof typeof messageBuilder;

export type MessageSource = SystemMessageSource | AgentMessageSource;

interface MessageSourceBase {
  id?: string;
}

interface SystemMessageSource extends MessageSourceBase {
  type: 'system';
  id?: undefined;
}

interface AgentMessageSource extends MessageSourceBase {
  type: 'agent';
  id: string;
}

export const systemSource: SystemMessageSource = { type: 'system' };
export const agentSource = (id: string): AgentMessageSource => ({
  type: 'agent',
  id
});

export const CODE_BLOCK_DELIMITER = '```';

export const messageBuilder = addMessageTypes({
  spontaneous: singleTargetSystemMessage,

  ok: singleTargetSystemMessage,

  error: singleTargetSystemMessage,

  agentToAgent: (
    sourceAgentId: string,
    targetAgentIds: string[],
    content: string
  ) => ({
    source: agentSource(sourceAgentId),
    targetAgentIds,
    content
  })
});

function addMessageTypes<
  T extends Record<string, (...args: any) => TypelessMessage>
>(record: T): { [K in keyof T]: (...args: Parameters<T[K]>) => Message } {
  for (const [type, builder] of Object.entries(record)) {
    (record as any)[type] = (...args: any) => ({
      type,
      ...(builder as any)(...args)
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
    content
  };
}
