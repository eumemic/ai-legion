import { Action } from "./action-types";
import { Message, messageBuilder } from "./message";
import { MessageBus } from "./message-bus";

export default class ActionHandler {
  constructor(private agentIds: string[], private messageBus: MessageBus) {}

  async handle(agentId: string, { payload }: Action) {
    switch (payload.type) {
      case "no-op":
        this.messageBus.send(
          messageBuilder.generic(
            agentId,
            `Are you sure there isn't anything you'd like to do? Maybe you should reach out and network with one of the other agents.`
          )
        );
        break;
      case "query-agent-registry":
        this.messageBus.send(
          messageBuilder.generic(
            agentId,
            `These are the agents in the system, in the format of [name]: [agentId]:\n\n${this.agentIds
              .map((id) => `Agent ${id}: ${id}`)
              .join("\n")}`
          )
        );
        break;
      case "send-message":
        const { targetAgentId } = payload;
        let message: Message;
        if (targetAgentId === "0")
          message = messageBuilder.generic(
            agentId,
            `Thanks for your message, I will forward it to my human counterpart and then get back to you with their response.`
          );
        else if (this.agentIds.includes(payload.targetAgentId))
          message = messageBuilder.agentToAgent(
            agentId,
            [targetAgentId],
            payload.message
          );
        else
          message = messageBuilder.generic(
            agentId,
            `You tried to send your message to an invalid targetAgentId (${payload.targetAgentId}). You can use the 'query-agent-registry' command to see a list of available agents and their agent IDs.`
          );
        this.messageBus.send(message);
        break;
    }
  }
}
