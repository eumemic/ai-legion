import readline from "readline";
import { messageBuilder } from "./message";
import { MessageBus } from "./message-bus";

const AGENT_ID = "0";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "$ ",
});

export function startConsole(agentIds: string[], messageBus: MessageBus) {
  messageBus.subscribe((message) => {
    if (message.targetAgentIds && !message.targetAgentIds.includes(AGENT_ID))
      return;
    console.log(`\n${message.openaiMessage.content}\n`);
    rl.prompt();
  });

  // Listen for 'line' events
  rl.on("line", (input) => {
    const colonIndex = input.indexOf(":");
    let targetAgentIds: string[] | undefined;
    let content: string;
    if (colonIndex >= 0) {
      targetAgentIds = [input.substring(0, colonIndex)];
      content = input.substring(colonIndex + 1);
    } else {
      targetAgentIds = undefined;
      content = input;
    }

    if (content)
      messageBus.send(
        messageBuilder.agentToAgent(AGENT_ID, targetAgentIds, content)
      );

    rl.prompt();
  });

  // Display the initial prompt
  rl.prompt();
}
