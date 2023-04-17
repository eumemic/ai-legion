"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModuleManager = void 0;
const module_instance_1 = require("./module-instance");
class ModuleManager {
    constructor(agentId, allAgentIds, moduleDefinitions) {
        this.agentId = agentId;
        this.allAgentIds = allAgentIds;
        this.modules = moduleDefinitions.map((moduleDef) => new module_instance_1.ModuleInstance(this, moduleDef));
        this.actions = moduleDefinitions
            .flatMap((module) => Object.values(module.actions))
            .reduce((map, actionDef) => (map.set(actionDef.name, actionDef), map), new Map());
        this.actionToModule = new Map();
        for (const module of this.modules) {
            for (const actionDef of Object.values(module.moduleDef.actions)) {
                this.actionToModule.set(actionDef.name, module);
            }
        }
    }
    getModuleForAction(name) {
        return this.actionToModule.get(name);
    }
}
exports.ModuleManager = ModuleManager;
