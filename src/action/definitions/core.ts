import { CODE_BLOCK_DELIMITER, messageBuilder } from "../../message";
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
        "Get help on a specific action, or list all available actions",
      parameters: {
        aboutAction: {
          description: "The name of an action to get help on",
          optional: true,
        },
      },
    }).withHandler(
      async ({
        parameters: { aboutAction },
        context: { sourceAgentId, actionDictionary },
        sendMessage,
      }) => {
        if (!aboutAction) {
          sendMessage(
            messageBuilder.standard(
              sourceAgentId,
              `
You can take the following actions:

${actionDictionary.definitions
  .map((actionDef) => `\`${actionDef.name}\` - ${actionDef.description}`)
  .join("\n")}

To get help on a specific action, use the \`help\` action with the \`aboutAction\` parameter set to the name of the action you want help with. For example:

${CODE_BLOCK_DELIMITER}
help
aboutAction: send-message
${CODE_BLOCK_DELIMITER}
`.trim()
            )
          );
        } else {
          const actionDef = actionDictionary.getDefinition(aboutAction);
          if (!actionDef) {
            sendMessage(
              messageBuilder.error(
                sourceAgentId,
                `Unknown action \`${aboutAction}\`. Try using \`help\` with no parameters to see what actions are available.`
              )
            );
          } else {
            sendMessage(
              messageBuilder.standard(sourceAgentId, getUsageText(actionDef))
            );
          }
        }
      }
    ),
  ],
});
