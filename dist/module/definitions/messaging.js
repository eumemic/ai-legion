"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const define_module_1 = require("../define-module");
const message_1 = require("../../message");
const util_1 = require("../../utils/util");
exports.default = (0, define_module_1.defineModule)({
    name: "messaging",
}).with({
    actions: {
        queryAgentRegistry: {
            description: "Ask who the other agents are that you can talk to",
            async execute({ context: { agentId, allAgentIds }, sendMessage }) {
                sendMessage(message_1.messageBuilder.ok(agentId, `These are the agents in the system:\n\n${allAgentIds
                    .map((id) => `${(0, util_1.agentName)(id)} [agentId=${id}]`)
                    .join("\n")}`));
            },
        },
        sendMessage: {
            description: "Send a message to another agent",
            parameters: {
                targetAgentId: {
                    description: "The target agent's ID",
                },
                message: {
                    description: "The content of the message",
                },
            },
            async execute({ parameters: { targetAgentId, message }, context: { agentId, allAgentIds }, sendMessage, }) {
                if (agentId === targetAgentId) {
                    return sendMessage(message_1.messageBuilder.error(agentId, "You can't send a message to yourself. Use the `writeNote` action if you want to make notes for yourself."));
                }
                if (allAgentIds.includes(targetAgentId)) {
                    sendMessage(message_1.messageBuilder.agentToAgent(agentId, [targetAgentId], message));
                }
                else {
                    sendMessage(message_1.messageBuilder.error(agentId, `You tried to send your message to an invalid targetAgentId (${JSON.stringify(targetAgentId)}). You can use the 'queryAgentRegistry' action to see a list of available agents and their agent IDs.`));
                }
            },
        },
    },
});
