import { messageBuilder } from "../../message";
import { defineAction } from "../action-definition";
import { defineActionModule } from "../action-module";
import { getUsageText } from "../util";

export default defineActionModule({
  name: "core",
  actions: [
    defineAction({
      name: "no-op",
      description: "Do nothing",
    }).withHandler(async () => {}),

    defineAction({
      name: "help",
      description:
        "Get help on a specific action and the parameters it expects.",
      parameters: {
        aboutAction: {
          description: "The name of an action to get help on",
        },
      },
    }).withHandler(
      async ({
        parameters: { aboutAction },
        context: { sourceAgentId, actionDictionary },
        sendMessage,
      }) => {
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
      }
    ),
  ],
});
