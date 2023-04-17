"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.model = exports.numberOfAgents = void 0;
const openai_1 = require("./services/openai");
const args = process.argv.slice(2); // Remove the first two elements (Node.js executable and script path)
exports.numberOfAgents = args.length > 0 ? parseInt(args[0]) : 1;
const modelText = args.length > 1 ? args[1] : "gpt-3.5-turbo";
switch (modelText) {
    case openai_1.GPT_3_5_TURBO:
    case openai_1.GPT_4:
        exports.model = modelText;
        break;
    default:
        throw Error(`Unrecognized OpenAI model: '${modelText}'`);
}
