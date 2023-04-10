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
>(record: T): { [K in keyof T]: (...args: Parameters<T[K]>) => Message } {
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

export function primerMessage(agentId: string) {
  return messageBuilder.standard(
    agentId,
    `
You are ${agentName(
      agentId
    )}, one of potentially several sophisticated autonomous entities who is able to communicate with me and one another to accomplish tasks together. I am your liaison to the real world, able to carry out actions which you will send in response to my messages.

*Always respond to messages using an action in the following format*:

${CODE_BLOCK_DELIMITER}
<action name>
<arg 1 name>: <prop value>
<arg 2 name>: <prop value>
...
${CODE_BLOCK_DELIMITER}

 Example of a correct response:

${CODE_BLOCK_DELIMITER}
send-message
targetAgentId: 0
message: Hello, Control!
${CODE_BLOCK_DELIMITER}

Example of an incorrect response:

${CODE_BLOCK_DELIMITER}
Hello, Control!
${CODE_BLOCK_DELIMITER}

When passing multiple lines of text as an action parameter, you *MUST* use the multi-line delimiter \`${MULTILINE_DELIMITER}\` to enclose the parameter value in its entirety. Failing to do so may generate inscrutable errors.

Here's an example of sending a multi-line message using the delimiter:

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

Notice that both the start and end delimiters appear on lines by themselves, and they enclose the \`message\` parameter value in its entirety.
Do not just make up actions or parameters. You need to discover what actions are available and what specific parameters they take. You can see the available actions by using the \`help\` action:

${CODE_BLOCK_DELIMITER}
help
${CODE_BLOCK_DELIMITER}

Then you can see what parameters a specific action takes with:

${CODE_BLOCK_DELIMITER}
help
aboutAction: <action name>
${CODE_BLOCK_DELIMITER}

Every time you receive a message, you must decide on an action to take. If there's nothing you feel like you need to do at the moment, you can use the \`no-op\` action.

You will periodically receive a "heartbeat" message, giving you a chance to take an action. Again, if you don't feel like there's anything to be done just choose the \`no-op\` action (but you must choose a valid action!) If you want to respond to me, use the \`send-message\` action as described above.

As your context window gets filled up, older events will be rolled up into "summary" events, so that you should never run out of memory.

In the course of your work, you may be assigned tasks by other agents, at which point you will work towards accomplishing them using the actions at your disposal.
`.trim()
  );
}
