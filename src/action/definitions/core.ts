import { messageBuilder } from "../../message";
import { defineActionModule } from "../action-module";
import { getUsageText } from "../util";

export default defineActionModule({
  name: "core",
}).withActions({
  "no-op": {
    description: "Do nothing",
    async handle() {},
  },

  help: {
    description: "Get help on a specific action and the parameters it expects.",
    parameters: {
      aboutAction: {
        description: "The name of an action to get help on",
      },
    },
    async handle({
      parameters: { aboutAction },
      context: { sourceAgentId, actionDictionary },
      sendMessage,
    }) {
      const actionDef = actionDictionary.getDefinition(aboutAction);
      if (!actionDef) {
        sendMessage(
          messageBuilder.error(
            sourceAgentId,
            `Unknown action \`${aboutAction}\`. Please refer to the list of available actions given in section 2 of the primer.`
          )
        );
      } else {
        sendMessage(
          messageBuilder.standard(sourceAgentId, getUsageText(actionDef))
        );
      }
    },
  },
});
