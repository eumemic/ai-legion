"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startConsole = void 0;
const readline_1 = __importDefault(require("readline"));
const message_1 = require("./message");
const AGENT_ID = "0";
const rl = readline_1.default.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "$ ",
});
function startConsole(agentIds, messageBus) {
    messageBus.subscribe((message) => {
        if (message.targetAgentIds && !message.targetAgentIds.includes(AGENT_ID))
            return;
        console.log(`\n${message.content}\n`);
        rl.prompt();
    });
    rl.on("line", (input) => {
        const colonIndex = -1; //input.indexOf(":");
        let targetAgentIds;
        let content;
        if (colonIndex >= 0) {
            targetAgentIds = [input.substring(0, colonIndex)];
            content = input.substring(colonIndex + 1);
        }
        else {
            targetAgentIds = agentIds.filter((id) => id !== AGENT_ID);
            content = input;
        }
        if (content)
            messageBus.send(message_1.messageBuilder.agentToAgent(AGENT_ID, targetAgentIds, content));
        rl.prompt();
    });
    // Display the initial prompt
    rl.prompt();
}
exports.startConsole = startConsole;
