import { ModuleDefinition } from ".";
import { ActionDefinition } from "./action-definition";

export class ModuleManager {
  actionDefinitions: ActionDefinition[];
  private actionToModule: Map<string, ModuleDefinition>;
  private moduleToState: Map<string, any>;

  constructor(private agentId: string, moduleDefinitions: ModuleDefinition[]) {
    this.actionDefinitions = moduleDefinitions.flatMap((module) =>
      Object.values(module.actions)
    );

    this.actionToModule = new Map();
    for (const moduleDef of moduleDefinitions) {
      for (const actionDef of Object.values(moduleDef.actions)) {
        this.actionToModule.set(actionDef.name, moduleDef);
      }
    }

    this.moduleToState = new Map<string, any>();
  }

  getActionDefinition(name: string): ActionDefinition | undefined {
    return this.actionToModule.get(name)?.actions[name];
  }

  getState(actionName: string) {
    const module = this.actionToModule.get(actionName);
    if (!module) throw Error(`module not found for action: ${actionName}`);

    if (!module.createState) return undefined;

    let state = this.moduleToState.get(module.name);
    if (state === undefined)
      this.moduleToState.set(
        module.name,
        (state = module.createState({ agentId: this.agentId }))
      );

    return state;
  }
}
