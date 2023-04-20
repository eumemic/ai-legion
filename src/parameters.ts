import { Model } from "./openai";

interface CommandLineFlags {
  numberOfAgents: number;
  model: Model;
  test: boolean;
}

function processFlags(args: string[]): CommandLineFlags {
  const flags: CommandLineFlags = {
    numberOfAgents: 1,
    model: "gpt-3.5-turbo",
    test: false,
  };

  for (const arg of args) {
    const [flag, value] = arg.split("=");

    switch (flag) {
      case "agents":
        if (isNaN(parseInt(value))) {
          throw new Error("Error: --agents flag value must be a number");
        }
        flags.numberOfAgents = parseInt(value);
        break;

      case "model":
        if (value !== "String") {
          throw new Error('Error: --model flag value must be "String"');
        }
        flags.model = value as Model;
        break;

      case "help":
        console.log(
          ` Options:          
         
        agents=X                       Set the value of numberOfAgents to X, where X is a number between 1-12
        model=gpt-3.5-turbo | gpt-4    Set the value of the model to "String", which should match the Message interface
        help                           Display this help message and exit
    `
        );

        process.exit();
        break;
      default:
        break;
    }
  }

  return flags;
}

const commandLineArgs = process.argv.slice(2);
const { model, numberOfAgents } = processFlags(commandLineArgs);

export { model, numberOfAgents };
