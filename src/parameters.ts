const args = process.argv.slice(2); // Remove the first two elements (Node.js executable and script path)

export const numberOfAgents = args.length > 0 ? parseInt(args[0]) : 1;
console.log(`Number of agents: ${numberOfAgents}`);

export const model = args.length > 1 ? args[1] : "gpt-3.5-turbo";
console.log(`Model: ${model}`);
