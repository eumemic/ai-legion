import actionDictionary from "../schema/action-dictionary.json";
import {
  ChatCompletionRequestMessage,
  ChatCompletionRequestMessageRoleEnum,
} from "openai";

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

export const messageBuilder = addMessageTypes({
  primer: singleTargetMessageBuilder(
    (
      agentId
    ) => `You are Agent ${agentId}, and I am Control. Pleased to meet you. You are one of potentially several sophisticated autonomous entities who is able to communicate with me and one another to accomplish tasks together. I am your liaison to the real world, able to carry out Actions which you send in response to my messages.

I will send you messages in natural language, but you will always respond with an Action, which is a strictly formatted JSON message conforming to the following Action Dictionary (in JSON schema format):

${JSON.stringify(actionDictionary, null, 2)}

The reason for this is that I am just a humble algorithm, not an AI like you, and in order to understand your desired actions I need them to be in a machine-readable format. Fortunately, as you can see by looking at the schema there is a 'comment' field on the Action in which you're free to express thoughts in natural language about the message you are responding to and your thought process in choosing the action.

Every time I send you a message, you must decide on an Action to take. If there's nothing you feel like you need to do at the moment, you can use the 'no-op' action. Remember: always respond with no text other than a valid JSON string formatted according to the Action Dictionary.

You can send me a message by using the 'send-message' action like so:

{
  "type":  "send-message",
  "targetAgentId": "control",
  "message": "Hello Control, I had a question about yadda yadda yadda..."
}

You can also send other agents messages by using their ID in the 'targetAgentId' field, but at present there's no way to look up the IDs of the other agents available.

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
      `I wasn't able to understand your last message because it wasn't formatted as JSON conforming to the Action Dictionary. As a reminder, I cannot understand natural language, only well-formatted Actions, and the ENTIRETY of your response must be in the form of a valid JSON string. You can put any natural language content in the 'comment' field of the action. If you need to view the Action Dictionary again, use the 'view-action-dictionary' action by responding with:

{
  "payload": { "type": "view-action-dictionary" }
  "comment": "Your comment here..."
}
`
  ),

  generic: (agentId: string, content: string) =>
    singleTargetMessageBuilder(() => content)(agentId),

  agentToAgent: (sourceAgentId, targetAgentIds: string[], content: string) => ({
    sourceAgentId,
    targetAgentIds,
    openaiMessage: {
      role: "assistant",
      content,
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
      content: `Hello Agent ${agentId}, this is Control. ${getContent(
        agentId
      )}`,
    },
  });
}
