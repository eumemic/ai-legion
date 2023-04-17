"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createChatCompletion = exports.contextWindowSize = exports.GPT_4 = exports.GPT_3_5_TURBO = void 0;
const lodash_1 = require("lodash");
const openai_1 = require("openai");
const task_queue_1 = __importDefault(require("./task-queue"));
const util_1 = require("../utils/util");
exports.GPT_3_5_TURBO = "gpt-3.5-turbo";
exports.GPT_4 = "gpt-4";
exports.contextWindowSize = {
    [exports.GPT_3_5_TURBO]: 4000,
    [exports.GPT_4]: 8000,
};
const GPT4_DELAY = 5 * 1000;
const taskQueue = new task_queue_1.default();
function createChatCompletion(request, options) {
    const task = async () => {
        try {
            const response = await openai().createChatCompletion(request, options);
            return response.data.choices[0].message.content;
        }
        catch (e) {
            const { response } = e;
            switch (response === null || response === void 0 ? void 0 : response.status) {
                case 400:
                    throw Error(`Context window is full.`);
                case 404:
                    throw Error(`Model '${request.model}' is unavailable.`);
                case 429:
                    throw Error(`OpenAI rate limited.`);
                default:
                    throw e;
            }
        }
    };
    // avoid rate limits
    if (request.model === "gpt-4")
        return taskQueue
            .run(task)
            .finally(() => taskQueue.run(() => (0, util_1.sleep)(GPT4_DELAY)));
    else
        return task();
}
exports.createChatCompletion = createChatCompletion;
// lazy load to avoid accessing OPENAI_API_KEY before env has been loaded
const openai = (0, lodash_1.memoize)(() => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey)
        throw Error("OPENAI_API_KEY is not configured!");
    const configuration = new openai_1.Configuration({
        apiKey: process.env.OPENAI_API_KEY,
    });
    return new openai_1.OpenAIApi(configuration);
});
