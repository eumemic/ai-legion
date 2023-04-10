import { defineAction } from "../action-definition";
import { messageBuilder } from "../../message";

export default [
  defineAction({
    name: "no-op",
    description: "Do nothing",
  }).withHandler(async () => {}),
  defineAction({
    name: "help",
    description: "Get help on a specific action, or list all available actions",
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
          messageBuilder.listAllActions(sourceAgentId, actionDictionary)
        );
      } else {
        sendMessage(
          messageBuilder.helpOnAction(
            sourceAgentId,
            aboutAction,
            actionDictionary
          )
        );
      }
    }
  ),
  defineAction({
    name: "query-agent-registry",
    description: "Ask who the other agents are that I can talk to",
  }).withHandler(
    async ({ context: { sourceAgentId, allAgentIds }, sendMessage }) => {
      sendMessage(messageBuilder.listAgents(sourceAgentId, allAgentIds));
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
];
