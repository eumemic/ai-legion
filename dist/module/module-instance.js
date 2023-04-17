"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModuleInstance = void 0;
class ModuleInstance {
    constructor(moduleManager, moduleDef) {
        this.moduleManager = moduleManager;
        this.moduleDef = moduleDef;
    }
    get state() {
        if (!this.moduleDef.createState)
            return undefined;
        this._state = this.moduleDef.createState({
            agentId: this.moduleManager.agentId,
        });
        return this._state;
    }
    get context() {
        return {
            agentId: this.moduleManager.agentId,
            allAgentIds: this.moduleManager.allAgentIds,
            actionDictionary: this.moduleManager.actions,
            state: this.state,
        };
    }
}
exports.ModuleInstance = ModuleInstance;
