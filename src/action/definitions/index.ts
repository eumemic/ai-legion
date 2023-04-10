import { ActionDefinition } from "../action-definition";
import { ActionModule } from "../action-module";
import coreModule from "./core";
import filesystemModule from "./filesystem";
import noteModule from "./note";

const allActionModules: ActionModule[] = [
  coreModule,
  filesystemModule,
  noteModule,
];

export const allActionDefinitions: ActionDefinition[] =
  allActionModules.flatMap((module) => module.actions);

const actionToModule: Record<string, ActionModule> = {};
for (const module of allActionModules) {
  for (const actionDef of module.actions) {
    actionToModule[actionDef.name] = module;
  }
}

const agentIdAndModuleToState = new Map<`${string}-${string}`, any>();
export function getActionState(agentId: string, actionName: string) {
  const module = actionToModule[actionName];
  if (!module.createState) return undefined;

  const key = `${agentId}-${module.name}` as const;
  let state = agentIdAndModuleToState.get(key);
  if (state === undefined)
    agentIdAndModuleToState.set(key, (state = module.createState({ agentId })));

  return state;
}
