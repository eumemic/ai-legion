import { ActionDefinition } from "./action-definition";

export class ModuleManager {
  private actionLookup: Map<string, ActionDefinition>;

  constructor(public definitions: ActionDefinition[]) {
    this.actionLookup = new Map();
    for (const actionDef of definitions) {
      this.actionLookup.set(actionDef.name, actionDef);
    }
  }

  getActionDefinition(name: string): ActionDefinition | undefined {
    return this.actionLookup.get(name);
  }
}
