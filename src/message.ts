import actionDictionary from "../schema/action-dictionary.json";
import {
  ChatCompletionRequestMessage,
  ChatCompletionRequestMessageRoleEnum,
} from "openai";
import { agentName, MULTILINE_DELIMITER } from "./util";

export interface Message {
  messageType: MessageType;
  sourceAgentId: string;
  /**
   * If left unspecified, indicates the message should be broadcast to all agents.
   */
  targetAgentIds?: string[];
  openaiMessage: ChatCompletionRequestMessage;
}

export type MessageType = keyof typeof messageBuilder;

const CODE_BLOCK_DELIMITER = "```";

const ACTION_DICTIONARY_TEXT = `${CODE_BLOCK_DELIMITER}
${JSON.stringify(actionDictionary, null, 2)}
${CODE_BLOCK_DELIMITER}`;

export const messageBuilder = addMessageTypes({
  primer: singleTargetMessageBuilder(
    (agentId) => `You are ${agentName(
      agentId
    )}, and I am Control. Pleased to meet you. You are one of potentially several sophisticated autonomous entities who is able to communicate with me and one another to accomplish tasks together. I am your liaison to the real world, able to carry out Actions which you send in response to my messages.

Here is a schema for your Action Dictionary, in JSON Schema format:

${ACTION_DICTIONARY_TEXT}

Respond to every message I send you with an Action conforming to this schema, but instead of writing it in JSON use the following format:

${CODE_BLOCK_DELIMITER}
<action name>
<arg 1 name>: <prop value>
<arg 2 name>: <prop value>
...
${CODE_BLOCK_DELIMITER}

For example, this would be considered a valid Action:

${CODE_BLOCK_DELIMITER}
send-message
targetAgentId: agent-1
message: Hello, Agent 1!
${CODE_BLOCK_DELIMITER}

You can write multi-line argument values delimited with the sentinal value "${MULTILINE_DELIMITER}", like so:

${CODE_BLOCK_DELIMITER}
send-message
targetAgentId: agent-1
message: 
${MULTILINE_DELIMITER}
Hello, this is a multi-line message.
This is a new line.
This is another line.
${MULTILINE_DELIMITER}
${CODE_BLOCK_DELIMITER}

Every time I send you a message, you must decide on an Action to take. If there's nothing you feel like you need to do at the moment, you can use the 'no-op' action.

I will check in with you periodically with a sort of "heartbeat" message, giving you a chance to take an action. Again, if you don't feel like there's anything to be done just choose the 'no-op' action (but you must choose a valid action according to the Action Dictionary or I won't understand you!) If you want to respond to me, use the 'send-message' action as described above.

In the course of our work I or other agents may assign you tasks, at which point you will work towards accomplishing them using the Actions at your disposal. We are going to build something great together!
`,
    "system"
  ),

  heartbeat: singleTargetMessageBuilder(
    (agentId) =>
      `This is your regularly scheduled heartbeat message. Let me know if there's anything you'd like to do by your choice of Action.`
  ),

  noResponseError: singleTargetMessageBuilder(
    (agentId) => `I did not receive any response, could you try again?`
  ),

  malformattedResponseError: singleTargetMessageBuilder(
    (agentId) =>
      `I wasn't able to understand your last message because it wasn't formatted correctly. As a reminder, I cannot understand natural language, only well-formatted actions, according to my initial instructions. If you need to view the Action Dictionary again, use the 'view-action-dictionary' action.`
  ),

  listAgents: (agentId: string, agentIds: string[]) =>
    singleTargetMessageBuilder(
      (agentId) =>
        `Hello ${agentName(
          agentId
        )}, these are the agents in the system:\n\n${agentIds
          .map((id) => `${agentName(id)} [agentId="${id}"]`)
          .join("\n")}`
    )(agentId),

  showActionDictionary: (agentId: string) =>
    singleTargetMessageBuilder(
      (agentId) =>
        `Here is the current Action Dictionary:

${ACTION_DICTIONARY_TEXT}`
    )(agentId),

  generic: (agentId: string, content: string) =>
    singleTargetMessageBuilder(() => content)(agentId),

  agentToAgent: (sourceAgentId, targetAgentIds: string[], content: string) => ({
    sourceAgentId,
    targetAgentIds,
    openaiMessage: {
      role: sourceAgentId === "0" ? "user" : "assistant",
      content: annotateContent(sourceAgentId, targetAgentIds, content),
    },
  }),

  agentResponse: (sourceAgentId: string, content: string) => ({
    sourceAgentId,
    targetAgentIds: ["0"],
    openaiMessage: {
      role: "assistant",
      content,
    },
  }),
});

function addMessageTypes<
  T extends Record<string, (...args: any) => Omit<Message, "messageType">>
>(record: T): { [K in keyof T]: (...args: Parameters<T[K]>) => Message } {
  for (const [standardMessageType, builder] of Object.entries(record)) {
    (record as any)[standardMessageType] = (...args: any) => ({
      messageType: standardMessageType,
      ...(builder as any)(...args),
    });
  }
  return record as any;
}

function singleTargetMessageBuilder(
  getContent: (agentId: string) => string,
  role: "system" | "user" = "user"
) {
  return (agentId: string): Omit<Message, "messageType"> => ({
    sourceAgentId: "0",
    targetAgentIds: [agentId],
    openaiMessage: {
      role,
      content: annotateContent("0", [agentId], getContent(agentId)),
    },
  });
}

function annotateContent(
  sourceAgentId: string,
  targetAgentIds: string[],
  content: string
) {
  return `--- INCOMING MESSAGE FROM ${agentName(
    sourceAgentId
  ).toUpperCase()} ---\n\n${content}`;
}
