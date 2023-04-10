import { ModuleDefinition } from ".";

export class ModuleInstance<S = void, A extends string = string> {
  private _state: S | undefined;

  constructor(
    private agentId: string,
    public moduleDef: ModuleDefinition<S, A>
  ) {}

  get state(): S | undefined {
    if (!this.moduleDef.createState) return undefined;

    this._state = this.moduleDef.createState({ agentId: this.agentId });

    return this._state;
  }
}
