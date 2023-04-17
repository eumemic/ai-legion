"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const define_module_1 = require("../define-module");
const message_1 = require("../../message");
const file_store_1 = __importDefault(require("../../store/file-store"));
const json_store_1 = __importDefault(require("../../store/json-store"));
const KEY = "goals";
exports.default = (0, define_module_1.defineModule)({
    name: "goals",
    createState: ({ agentId }) => new json_store_1.default(new file_store_1.default([agentId])),
}).with({
    async pinnedMessage({ state }) {
        const goals = (await state.get(KEY)) || [];
        const currentGloals = goals.length
            ? `This is your current goal list:\n\n${goals
                .map(({ text, complete }, index) => `${index + 1}) "${text}" [${complete ? "COMPLETE" : "PENDING"}]`)
                .join("\n")}`
            : "You have no goals currently.";
        return `
You are responsible for maintaining your list of goals, based on higher-level objectives which will be given to you. Whenever you start doing something, first add a goal. Whenever you finish doing something, mark it complete. This list of goals will always be pinned to the top of your context and won't be summarized away. Goals should be medium-term (requiring several actions to complete) and concrete. Do not invent goals out of nothing, they should encapsulate instructions that have been given to you.

${currentGloals}
`.trim();
    },
    actions: {
        addGoal: {
            description: "Add a new goal at the end of your goals list.",
            parameters: {
                goal: {
                    description: "A summary of what you want to achieve (keep this relatively short but information dense)",
                },
            },
            async execute({ parameters: { goal }, context: { agentId, state }, sendMessage, }) {
                const goals = (await state.get(KEY)) || [];
                await state.set(KEY, [...goals, { text: goal, complete: false }]);
                sendMessage(message_1.messageBuilder.ok(agentId, "Goal added."));
            },
        },
        completeGoal: {
            description: "Mark a goal as complete.",
            parameters: {
                goalNumber: {
                    description: "The number of the goal you want to mark as complete",
                },
            },
            async execute({ parameters: { goalNumber }, context: { agentId, state }, sendMessage, }) {
                const idx = parseInt(goalNumber) - 1;
                const goals = (await state.get(KEY)) || [];
                if (isNaN(idx) || idx < 0 || idx >= goals.length)
                    return sendMessage(message_1.messageBuilder.error(agentId, `Invalid goal index: ${goalNumber}`));
                await state.set(KEY, [
                    ...goals.slice(0, idx),
                    { ...goals[idx], complete: true },
                    ...goals.slice(idx + 1),
                ]);
                sendMessage(message_1.messageBuilder.ok(agentId, "Goal marked complete."));
            },
        },
    },
});
