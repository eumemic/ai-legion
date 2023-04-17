"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ActionHandler {
    constructor(agentIds, moduleManager) {
        this.agentIds = agentIds;
        this.moduleManager = moduleManager;
    }
    async handle(agentId, { actionDef, parameters }) {
        actionDef.execute({
            context: this.moduleManager.getModuleForAction(actionDef.name).context,
            parameters,
            sendMessage: (message) => {
                if (process === null || process === void 0 ? void 0 : process.send)
                    process.send({ type: "message", agentMessage: message });
            },
        });
    }
}
exports.default = ActionHandler;
