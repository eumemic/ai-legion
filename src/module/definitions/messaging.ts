import { defineModule } from "../define-module";
import { messageBuilder } from "../../message";
import { agentName } from "../../util";

export default defineModule({
  name: "messaging",
}).with({
  actions: {
    queryAgentRegistry: {
      description: "Ask who the other agents are that you can talk to",
      async execute({ context: { agentId, allAgentIds }, sendMessage }) {
        sendMessage(
          messageBuilder.ok(
            agentId,
            `These are the agents in the system:\n\n${allAgentIds
              .map((id) => `${agentName(id)} [agentId=${id}]`)
              .join("\n")}`
          )
        );
      },
    },

    sendMessage: {
      description: "Send a message to another agent",
      parameters: {
        targetAgentId: {
          description: "The target agent's ID",
        },
        message: {
          description: "The content of the message",
        },
      },
      async execute({
        parameters: { targetAgentId, message },
        context: { agentId, allAgentIds },
        sendMessage,
      }) {
        if (agentId === targetAgentId) {
          return sendMessage(
            messageBuilder.error(
              agentId,
              "You can't send a message to yourself. Use the `writeNote` action if you want to make notes for yourself."
            )
          );
        }

        if (allAgentIds.includes(targetAgentId)) {
          sendMessage(
            messageBuilder.agentToAgent(agentId, [targetAgentId], message)
          );
        } else {
          sendMessage(
            messageBuilder.error(
              agentId,
              `You tried to send your message to an invalid targetAgentId (${JSON.stringify(
                targetAgentId
              )}). You can use the 'queryAgentRegistry' action to see a list of available agents and their agent IDs.`
            )
          );
        }
      },
    },
  },
});
