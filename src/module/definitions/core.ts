import { messageBuilder } from "../../message";
import { defineModule } from "../define-module";
import { getUsageText } from "../util";

export default defineModule({
  name: "core",
}).with({
  actions: {
    noop: {
      description: "Do nothing",
      async execute() {},
    },

    help: {
      description:
        "Get help on a specific action and the parameters it expects.",
      parameters: {
        aboutAction: {
          description: "The name of an action to get help on",
        },
      },
      async execute({
        parameters: { aboutAction },
        context: { sourceAgentId, moduleManager: moduleManager },
        sendMessage,
      }) {
        const actionDef = moduleManager.getActionDefinition(aboutAction);
        if (!actionDef) {
          sendMessage(
            messageBuilder.error(
              sourceAgentId,
              `Unknown action \`${aboutAction}\`. Please refer to the list of available actions given in section 2 of the primer.`
            )
          );
        } else {
          sendMessage(
            messageBuilder.ok(sourceAgentId, getUsageText(actionDef))
          );
        }
      },
    },
  },
});
