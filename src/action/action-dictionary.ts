import { ActionDefinition } from "./action-definition";

export class ActionDictionary {
  private lookup: Map<string, ActionDefinition>;

  constructor(public definitions: ActionDefinition[]) {
    this.lookup = new Map();
    for (const actionDef of definitions) {
      this.lookup.set(actionDef.name, actionDef);
    }
  }

  getDefinition(name: string): ActionDefinition | undefined {
    return this.lookup.get(name);
  }
}
