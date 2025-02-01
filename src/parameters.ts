import { modelRegistry, Model } from "./openai";

const args = process.argv.slice(2); // Remove the first two elements (Node.js executable and script path)

export const numberOfAgents = args.length > 0 ? parseInt(args[0]) : 1;
console.log(`Number of agents: ${numberOfAgents}`);

const modelText = args.length > 1 ? args[1] : "gpt-3.5-turbo";

if (!(modelText in modelRegistry))
  throw Error(`Unrecognized OpenAI model: '${modelText}'`);

export const model: Model = modelText as Model;

console.log(`Model: ${model}`);
