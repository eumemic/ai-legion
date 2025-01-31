import {
  GPT_3_5_TURBO,
  GPT_4,
  GPT_4O,
  GPT_O1_PREVIEW,
  GPT_O3_MINI,
  Model,
} from "./openai";

const args = process.argv.slice(2); // Remove the first two elements (Node.js executable and script path)

export const numberOfAgents = args.length > 0 ? parseInt(args[0]) : 1;
console.log(`Number of agents: ${numberOfAgents}`);

const modelText = args.length > 1 ? args[1] : "gpt-3.5-turbo";
export let model: Model;
switch (modelText) {
  case GPT_3_5_TURBO:
  case GPT_4:
  case GPT_4O:
  case GPT_O1_PREVIEW:
  case GPT_O3_MINI:
    model = modelText;
    break;
  default:
    throw Error(`Unrecognized OpenAI model: '${modelText}'`);
}
console.log(`Model: ${model}`);
