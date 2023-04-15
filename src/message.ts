import { IMessage } from "./interfaces/message";
import {
  IAgentMessageSource,
  ISystemMessageSource,
} from "./interfaces/messageSource";

type TypelessMessage = Omit<IMessage, "type">;

export const systemSource: ISystemMessageSource = { type: "system" };
export const agentSource = (id: string): IAgentMessageSource => ({
  type: "agent",
  id,
});

export const CODE_BLOCK_DELIMITER = "```";

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
    content,
  }),
});

function addMessageTypes<
  T extends Record<string, (...args: any) => TypelessMessage>
>(record: T): { [K in keyof T]: (...args: Parameters<T[K]>) => IMessage } {
  for (const [type, builder] of Object.entries(record)) {
    (record as any)[type] = (...args: any) => ({
      type,
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
