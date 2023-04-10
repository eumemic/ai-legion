import { ActionDictionary } from "./module/action-dictionary";
import { getActionState } from "./module/definitions";
import { MessageBus } from "./message-bus";
import { Action } from "./parse-action";

export default class ActionHandler {
  constructor(
    private agentIds: string[],
    private messageBus: MessageBus,
    private actionDictionary: ActionDictionary
  ) {}

  async handle(agentId: string, { actionDef, parameters }: Action) {
    actionDef.execute({
      context: {
        sourceAgentId: agentId,
        allAgentIds: this.agentIds,
        actionDictionary: this.actionDictionary,
        state: getActionState(agentId, actionDef.name),
      },
      parameters,
      sendMessage: (message) => this.messageBus.send(message),
    });
  }
}
