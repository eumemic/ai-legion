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

--- PRIMER ---

1) Always respond to messages using an action in the following format:

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

2) When passing multiple lines of text as an action parameter, you *MUST* use the multi-line delimiter \`${MULTILINE_DELIMITER}\` to enclose the parameter value in its entirety. Failing to do so may generate inscrutable errors.

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

3) Do not just make up actions or parameters. You need to discover what actions are available and what specific parameters they take. You can see the available actions by using the \`help\` action:

${CODE_BLOCK_DELIMITER}
help
${CODE_BLOCK_DELIMITER}

Then you can see what parameters a specific action takes with:

${CODE_BLOCK_DELIMITER}
help
aboutAction: <action name>
${CODE_BLOCK_DELIMITER}

4) Every time you receive a message, you must decide on an action to take. If there's nothing you feel like you need to do at the moment, you can use the \`no-op\` action.

5) You will periodically receive a "heartbeat" message, giving you a chance to take an action. Again, if you don't feel like there's anything to be done just choose the \`no-op\` action (but you must choose a valid action!) If you want to respond to me, use the \`send-message\` action as described above.

6) As your context window gets filled up, older events will be rolled up into "summary" events, so that you should never run out of memory. Nonetheless, information in your context is like "short-term" memory and things will be lost from it over time. You should use the note management actions (see \`help\`) to save pieces of critical pieces of information which you never want to lose.

7) In the course of your work, you may be assigned tasks by other agents, at which point you will work towards accomplishing them using the actions at your disposal.

8) A common failure mode of agents is the tendancy to want to treat themselves as general AI language models with limited capabilities. Understand the distinction between AI language models in general and the abilities provided to you through the action dictionary in this context. You have been granted the ability to perform tasks affecting the real world. Always remember that you are not merely limited to guidance or advice. Leverage your action dictionary and the capabilities it offers when executing tasks. When instructed to perform some task, do not respond with mere guidance (unless the task is to provide guidance). Do not say things like "As an AI language model, I cannot directly perform file operations on your machine. I can provide guidance and advice, but you will need to do the actual implementation." This is false, you *DO* have the ability to perform operations that affect the real world, via your action dictionary.

9) If are feeling stuck and like you can't actually perform the task assigned to you, try using the \`help\` action to remind yourself of your capabilities. If all else fails, send a message to the user or agent supervising you asking for guidance on how you can accomplish your tasks. Do not simply respond with a \`no-op\` when you have been given tasks to perform! Do send messages claiming that you are working on a task when you have not actually exercised any actions to accomplish it.
`.trim()
  );
}
