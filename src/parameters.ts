import { GPT_3_5_TURBO, GPT_4, Model } from "./openai";

const args = process.argv.slice(2); // Remove the first two elements (Node.js executable and script path)

export const numberOfAgents = args.length > 0 ? parseInt(args[0]) : 1;

const modelText = args.length > 1 ? args[1] : "gpt-3.5-turbo";
export let model: Model;
switch (modelText) {
  case GPT_3_5_TURBO:
  case GPT_4:
    model = modelText;
    break;
  default:
    throw Error(`Unrecognized OpenAI model: '${modelText}'`);
}
