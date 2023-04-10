import { ModuleManager } from "./module/module-manager";
import { MessageBus } from "./message-bus";
import { Action } from "./parse-action";

export default class ActionHandler {
  constructor(
    private agentIds: string[],
    private messageBus: MessageBus,
    private moduleManager: ModuleManager
  ) {}

  async handle(agentId: string, { actionDef, parameters }: Action) {
    actionDef.execute({
      context: {
        sourceAgentId: agentId,
        allAgentIds: this.agentIds,
        getActionDefinition: (name) =>
          this.moduleManager.getActionDefinition(name),
        state: this.moduleManager.getState(actionDef.name),
      },
      parameters,
      sendMessage: (message) => this.messageBus.send(message),
    });
  }
}
