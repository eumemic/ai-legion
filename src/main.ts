import dotenv from "dotenv";
import ActionHandler from "./action-handler";
import { ActionDictionary } from "./action/action-dictionary";
import { allActionDefinitions } from "./action/definitions";
import { Agent } from "./agent";
import { startConsole } from "./console";
import { InMemoryMemory } from "./in-memory-memory";
import { InMemoryMessageBus } from "./in-memory-message-bus";
import { actionMemento, Memory, messageMemento } from "./memory";
import { CODE_BLOCK_DELIMITER, messageBuilder } from "./message";
import { MessageBus } from "./message-bus";
import { numberOfAgents } from "./parameters";
import { agentName, MULTILINE_DELIMITER } from "./util";

dotenv.config();

const agentIds = Array.from({ length: numberOfAgents + 1 }, (_, i) => `${i}`);

const actionDictionary = new ActionDictionary(allActionDefinitions);
const messageBus: MessageBus = new InMemoryMessageBus();
const actionHandler = new ActionHandler(agentIds, messageBus, actionDictionary);

main();

async function main() {
  startConsole(agentIds, messageBus);

  for (const id of agentIds.slice(1)) {
    const memory: Memory = new InMemoryMemory(
      messageMemento(
        messageBuilder.standard(
          id,
          `You are ${agentName(
            id
          )}, one of potentially several sophisticated autonomous entities who is able to communicate with me and one another to accomplish tasks together. I am your liaison to the real world, able to carry out actions which you will send in response to my messages.

Respond to every message with an action in the following format:

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

You can write multi-line parameter values delimited with the sentinal value "${MULTILINE_DELIMITER}", like so:

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

In the course of your work you may be assigned tasks by other agents, at which point you will work towards accomplishing them using the actions at your disposal.
`
        )
      )
    );
    const agent = new Agent(
      id,
      memory,
      messageBus,
      actionDictionary,
      actionHandler
    );
    await agent.start();
  }
}
