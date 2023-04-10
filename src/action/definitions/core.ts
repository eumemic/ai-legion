import { defineAction } from "../action-definition";
import { CODE_BLOCK_DELIMITER, messageBuilder } from "../../message";
import { agentName } from "../../util";
import { getUsageText } from "../util";
import { defineActionModule } from "../action-module";

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

    defineAction({
      name: "query-agent-registry",
      description: "Ask who the other agents are that you can talk to",
    }).withHandler(
      async ({ context: { sourceAgentId, allAgentIds }, sendMessage }) => {
        sendMessage(
          messageBuilder.standard(
            sourceAgentId,
            `These are the agents in the system:\n\n${allAgentIds
              .map((id) => `${agentName(id)} [agentId=${id}]`)
              .join("\n")}`
          )
        );
      }
    ),

    defineAction({
      name: "send-message",
      description: "Send a message to another agent",
      parameters: {
        targetAgentId: {
          description: "The target agent's ID",
        },
        message: {
          description: "The content of the message",
        },
      },
    }).withHandler(
      async ({
        parameters: { targetAgentId, message },
        context: { sourceAgentId, allAgentIds },
        sendMessage,
      }) => {
        if (allAgentIds.includes(targetAgentId)) {
          sendMessage(
            messageBuilder.agentToAgent(sourceAgentId, [targetAgentId], message)
          );
        } else {
          sendMessage(
            messageBuilder.error(
              sourceAgentId,
              `You tried to send your message to an invalid targetAgentId (${JSON.stringify(
                targetAgentId
              )}). You can use the 'query-agent-registry' action to see a list of available agents and their agent IDs.`
            )
          );
        }
      }
    ),
  ],
});
