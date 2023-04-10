import actionDictionary from "../schema/action-dictionary.json";
import { ChatCompletionRequestMessage } from "openai";
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

export const messageBuilder = addMessageTypes({
  primer: singleTargetMessageBuilder(
    (agentId) => `You are ${agentName(
      agentId
    )}, and I am Control. Pleased to meet you. You are one of potentially several sophisticated autonomous entities who is able to communicate with me and one another to accomplish tasks together. I am your liaison to the real world, able to carry out actions which you will send in response to my messages.

Respond to every message I send you with an action in the following format:

${CODE_BLOCK_DELIMITER}
<action name>
<arg 1 name>: <prop value>
<arg 2 name>: <prop value>
...
${CODE_BLOCK_DELIMITER}

For example, this would be considered a valid action:

${CODE_BLOCK_DELIMITER}
send-message
targetAgentId: 0
message: Hello, Control!
${CODE_BLOCK_DELIMITER}

You can write multi-line argument values delimited with the sentinal value "${MULTILINE_DELIMITER}", like so:

${CODE_BLOCK_DELIMITER}
send-message
targetAgentId: 2
message: 
${MULTILINE_DELIMITER}
Hello, this is a multi-line message.
This is a new line.
This is another line.
${MULTILINE_DELIMITER}
${CODE_BLOCK_DELIMITER}

You can see the available actions by using the \`help\` action:

${CODE_BLOCK_DELIMITER}
help
${CODE_BLOCK_DELIMITER}

Every time I send you a message, you must decide on an action to take. If there's nothing you feel like you need to do at the moment, you can use the \`no-op\` action.

I will check in with you periodically with a sort of "heartbeat" message, giving you a chance to take an action. Again, if you don't feel like there's anything to be done just choose the \`no-op\` action (but you must choose a valid action or I won't understand you!) If you want to respond to me, use the \`send-message\` action as described above.

In the course of our work I or other agents may assign you tasks, at which point you will work towards accomplishing them using the actions at your disposal. We are going to build something great together!
`,
    "system"
  ),

  heartbeat: singleTargetMessageBuilder(
    (agentId) =>
      `This is your regularly scheduled heartbeat message. Let me know if there's anything you'd like to do by your choice of action.`
  ),

  listAllActions: singleTargetMessageBuilder(
    (agentId) => `You can take the following actions:

${actionDictionary.oneOf
  .map((action) => action.properties.name.const)
  .join("\n")}

To get help on a specific action, use the \`help\` action with the \`aboutAction\` argument set to the name of the action you want help with. For example:

${CODE_BLOCK_DELIMITER}
help
aboutAction: send-message
${CODE_BLOCK_DELIMITER}
`
  ),

  helpOnAction: (actionId: string, aboutAction: string) =>
    singleTargetMessageBuilder((agentId) => {
      const actionSchema = actionDictionary.oneOf.find(
        (action) => action.properties.name.const === aboutAction
      );
      if (!actionSchema)
        return `I don't know about the action \`${aboutAction}\`. Try using \`help\` with no arguments to see what actions are available.`;
      return `Usage:

${CODE_BLOCK_DELIMITER}
${actionSchema.properties.name.const}
${Object.entries(actionSchema.properties)
  .flatMap(([argName, { description }]) =>
    argName === "name"
      ? []
      : [
          `${argName}: <${description.toLowerCase()}>${
            !actionSchema.required.includes(argName) ? " (optional)" : ""
          }`,
        ]
  )
  .join("\n")}
${CODE_BLOCK_DELIMITER}
`;
    })(actionId),

  noResponseError: singleTargetMessageBuilder(
    (agentId) => `I did not receive any response, could you try again?`
  ),

  malformattedResponseError: singleTargetMessageBuilder(
    (agentId) =>
      `I wasn't able to understand your last message because it wasn't formatted correctly. As a reminder, I cannot understand natural language, only well-formatted actions, per my initial instructions. If you need help, respond with simply:

${CODE_BLOCK_DELIMITER}
help
${CODE_BLOCK_DELIMITER}
`
  ),

  listAgents: (agentId: string, agentIds: string[]) =>
    singleTargetMessageBuilder(
      (agentId) =>
        `Hello ${agentName(
          agentId
        )}, these are the agents in the system:\n\n${agentIds
          .map((id) => `${agentName(id)} [agentId=${id}]`)
          .join("\n")}`
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
