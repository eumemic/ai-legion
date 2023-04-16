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
      context: this.moduleManager.getModuleForAction(actionDef.name)!.context,
      parameters,
      sendMessage: (message) => this.messageBus.send(message),
    });
  }
}
