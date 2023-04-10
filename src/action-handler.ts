import { Action } from "./action-types";
import { singleTargetMessage } from "./message";
import { MessageBus } from "./message-bus";

export default class ActionHandler {
  constructor(private messageBus: MessageBus) {}

  async handle(agentId: string, { payload }: Action) {
    switch (payload.type) {
      case "query-agent-registry":
        this.messageBus.send(
          singleTargetMessage(
            agentId,
            `These are the agents in the system, in the format of [name]: [agentId]:\n\nControl: 0\nAgent 1: 1`
          )
        );
        break;
      case "send-message":
        if (payload.targetAgentId === "0") {
          this.messageBus.send(
            singleTargetMessage(
              agentId,
              `Thanks for your message, I will forward it to my human counterpart and then get back to you with their response.`
            )
          );
        } else {
          this.messageBus.send(
            singleTargetMessage(
              agentId,
              `You tried to send your message to an invalid targetAgentId (${payload.targetAgentId}). You can use the 'query-agent-registry' command to see a list of available agents and their agent IDs.`
            )
          );
        }
        break;
    }
  }
}
