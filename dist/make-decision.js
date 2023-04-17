"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toOpenAiMessage = void 0;
const openai_1 = require("./services/openai");
const task_queue_1 = __importDefault(require("./services/task-queue"));
const util_1 = require("./utils/util");
const openaiDelay = 10 * 1000;
const taskQueue = new task_queue_1.default();
function makeDecision(events, model) {
    const decisionPromise = taskQueue.run(async () => {
        console.log(`Reflecting on ${events.length} events...`);
        const t0 = Date.now();
        const messages = events.map(toOpenAiMessage);
        // console.log(JSON.stringify(messages, null, 2));
        const temperature = 0.0;
        const responseContent = await (0, openai_1.createChatCompletion)({
            model,
            messages,
            temperature,
        });
        console.log(`Arrived at a decision after ${((Date.now() - t0) / 1000).toFixed(1)}s`);
        return responseContent;
    });
    // avoid rate limits
    if (model === "gpt-4")
        decisionPromise.finally(() => taskQueue.run(() => (0, util_1.sleep)(openaiDelay)));
    return decisionPromise;
}
exports.default = makeDecision;
// lazy load to avoid accessing OPENAI_API_KEY before env has been loaded
function toOpenAiMessage(event) {
    switch (event.type) {
        case "message": {
            const { type: messageType, source, content } = event.message;
            const role = source.type === "system" ? "system" : "user";
            let header;
            switch (messageType) {
                case "spontaneous":
                case "ok":
                    header = "";
                    break;
                case "agentToAgent":
                    header = `--- MESSAGE FROM ${(0, util_1.messageSourceName)(source).toUpperCase()} ---\n\n`;
                    break;
                case "error":
                    header = "--- ERROR ---\n\n";
                    break;
            }
            return {
                role,
                content: `${header}${content}`,
            };
        }
        case "decision":
            return {
                role: "assistant",
                content: event.actionText,
            };
    }
}
exports.toOpenAiMessage = toOpenAiMessage;
