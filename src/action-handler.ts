import { Action } from "./action-types";
import { Message, messageBuilder } from "./message";
import { MessageBus } from "./message-bus";
import { agentName } from "./util";

export default class ActionHandler {
  constructor(private agentIds: string[], private messageBus: MessageBus) {}

  async handle(agentId: string, { payload }: Action) {
    switch (payload.type) {
      // case "no-op":
      //   this.messageBus.send(
      //     messageBuilder.generic(
      //       agentId,
      //       `Are you sure there isn't anything you'd like to do? Maybe you should reach out and network with one of the other agents.`
      //     )
      //   );
      //   break;
      case "query-agent-registry":
        this.messageBus.send(messageBuilder.listAgents(agentId, this.agentIds));
        break;
      case "send-message":
        const { targetAgentId } = payload;
        if (targetAgentId === "0")
          this.messageBus.send(
            messageBuilder.generic(
              agentId,
              `Thanks for your message, I will forward it to my human counterpart and then get back to you with their response.`
            )
          );
        else if (this.agentIds.includes(payload.targetAgentId))
          this.messageBus.send(
            messageBuilder.agentToAgent(
              agentId,
              [targetAgentId],
              payload.message
            )
          );
        else
          this.messageBus.send(
            messageBuilder.generic(
              agentId,
              `You tried to send your message to an invalid targetAgentId (${JSON.stringify(
                payload.targetAgentId
              )}). You can use the 'query-agent-registry' action to see a list of available agents and their agent IDs.`
            )
          );
        break;
    }
  }
}
