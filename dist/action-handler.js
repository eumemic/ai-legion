"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ActionHandler {
    constructor(agentIds, messageBus, moduleManager) {
        this.agentIds = agentIds;
        this.messageBus = messageBus;
        this.moduleManager = moduleManager;
    }
    async handle(agentId, { actionDef, parameters }) {
        actionDef.execute({
            context: this.moduleManager.getModuleForAction(actionDef.name).context,
            parameters,
            sendMessage: (message) => this.messageBus.send(message),
        });
    }
}
exports.default = ActionHandler;
