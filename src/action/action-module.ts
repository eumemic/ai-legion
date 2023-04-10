import { ActionDefinition } from "./action-definition";

export interface ActionModuleParameters {
  agentId: string;
}

export interface ActionModule<S = any> {
  name: string;
  createState?: (params: ActionModuleParameters) => S;
  actions: ActionDefinition<S>[];
}

export function defineActionModule<S>(
  module: ActionModule<S>
): ActionModule<S> {
  return module;
}
