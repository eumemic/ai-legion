import { Message } from "../message";
import { ActionDefinition, PartialActionDefinition } from "./action-definition";

export interface ModuleDefinition<S = any, A extends string = string>
  extends ModuleDefinitionInputs1<S> {
  actions: Record<A, ActionDefinition<S>>;
}

export interface ModuleDefinitionInputs1<S> {
  name: string;
  createState?: (params: ModuleStateInputs) => S;
}

export interface ModuleDefinitionInputs2<S, A extends string> {
  pinnedMessage?: (context: ModuleContext<S>) => Message;
  actions: Record<A, PartialActionDefinition<S, string>>;
}

export interface ModuleStateInputs {
  agentId: string;
}

export interface ModuleContext<S> {
  sourceAgentId: string;
  allAgentIds: string[];
  getActionDefinition: (name: string) => ActionDefinition | undefined;
  state: S;
}
