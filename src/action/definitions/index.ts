import { keyBy } from "lodash";
import { ActionDefinition } from "../action-definition";
import { ActionModule } from "../action-module";
import coreModule from "./core";
import filesystemModule from "./filesystem";
import messagingModule from "./messaging";
import notesModule from "./notes";

const allActionModules: ActionModule[] = [
  coreModule,
  messagingModule,
  filesystemModule,
  notesModule,
];

export const allActionDefinitions: ActionDefinition[] =
  allActionModules.flatMap((module) => module.actions);

export const actionDefLookup: Record<string, ActionDefinition> = keyBy(
  allActionDefinitions,
  (actionDef) => actionDef.name
);

export function getActionDefinition(name: string): ActionDefinition {
  return actionDefLookup[name];
}

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
