import { ModuleManager } from "./module/module-manager";
import { IMessage } from "./interfaces/message";
import { Action } from "./utils/parse-action";

export default class ActionHandler {
  constructor(
    private agentIds: string[],
    private moduleManager: ModuleManager
  ) {}

  async handle(agentId: string, { actionDef, parameters }: Action) {
    actionDef.execute({
      context: this.moduleManager.getModuleForAction(actionDef.name)!.context,
      parameters,
      sendMessage: (message: IMessage) => {
        if (process?.send)
          process.send({ type: "message", agentMessage: message });
      },
    });
  }
}
