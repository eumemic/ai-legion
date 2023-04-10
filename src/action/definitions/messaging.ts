import { messageBuilder } from "../../message";
import { agentName } from "../../util";
import { defineActionModule } from "../action-module";

export default defineActionModule({
  name: "messaging",
}).withActions({
  "query-agent-registry": {
    description: "Ask who the other agents are that you can talk to",
    async handle({ context: { sourceAgentId, allAgentIds }, sendMessage }) {
      sendMessage(
        messageBuilder.standard(
          sourceAgentId,
          `These are the agents in the system:\n\n${allAgentIds
            .map((id) => `${agentName(id)} [agentId=${id}]`)
            .join("\n")}`
        )
      );
    },
  },

  "send-message": {
    description: "Send a message to another agent",
    parameters: {
      targetAgentId: {
        description: "The target agent's ID",
      },
      message: {
        description: "The content of the message",
      },
    },
    async handle({
      parameters: { targetAgentId, message },
      context: { sourceAgentId, allAgentIds },
      sendMessage,
    }) {
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
    },
  },
});
