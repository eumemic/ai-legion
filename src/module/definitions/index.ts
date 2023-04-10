import { keyBy } from "lodash";
import { ActionDefinition } from "../action-definition";
import { Module } from "../module";
import core from "./core";
import filesystem from "./filesystem";
import messaging from "./messaging";
import notes from "./notes";
import web from "./web";

const allActionModules: Module[] = [core, messaging, filesystem, notes, web];

export const allActionDefinitions: ActionDefinition[] =
  allActionModules.flatMap((module) => Object.values(module.actions));

export const actionDefLookup: Record<string, ActionDefinition> = keyBy(
  allActionDefinitions,
  (actionDef) => actionDef.name
);

export function getActionDefinition(name: string): ActionDefinition {
  return actionDefLookup[name];
}

const actionToModule: Record<string, Module> = {};
for (const module of allActionModules) {
  for (const actionDef of Object.values(module.actions)) {
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
