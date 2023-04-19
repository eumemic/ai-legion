import { ModuleDefinition } from ".";
import { ActionDefinition } from "./action-definition";
import { ModuleInstance } from "./module-instance";

export class ModuleManager {
  modules: ModuleInstance[];
  actions: Map<string, ActionDefinition>;
  private actionToModule: Map<string, ModuleInstance>;

  constructor(
    public agentId: string,
    public allAgentIds: string[],
    moduleDefinitions: ModuleDefinition[]
  ) {
    this.modules = moduleDefinitions.map(
      (moduleDef) => new ModuleInstance(this, moduleDef)
    );

    this.actions = moduleDefinitions
      .flatMap((module) => Object.values(module.actions))
      .reduce(
        (map, actionDef) => (map.set(actionDef.name, actionDef), map),
        new Map()
      );

    this.actionToModule = new Map();
    for (const module of this.modules) {
      for (const actionDef of Object.values(module.moduleDef.actions)) {
        this.actionToModule.set(actionDef.name, module);
      }
    }
  }

  getModuleForAction(name: string): ModuleInstance | undefined {
    return this.actionToModule.get(name);
  }
}
