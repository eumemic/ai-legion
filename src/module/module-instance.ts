import { ModuleContext, ModuleDefinition } from ".";
import { ModuleManager } from "./module-manager";

export class ModuleInstance<S = void, A extends string = string> {
  private _state: S | undefined;

  constructor(
    private moduleManager: ModuleManager,
    public moduleDef: ModuleDefinition<S, A>
  ) {}

  get state(): S {
    if (!this.moduleDef.createState) return undefined as S;

    this._state = this.moduleDef.createState({
      agentId: this.moduleManager.agentId,
    });

    return this._state;
  }

  get context(): ModuleContext<S> {
    return {
      sourceAgentId: this.moduleManager.agentId,
      allAgentIds: this.moduleManager.allAgentIds,
      actionDictionary: this.moduleManager.actions,
      state: this.state,
    };
  }
}
