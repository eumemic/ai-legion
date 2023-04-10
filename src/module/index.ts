import { Message } from "../message";
import { ActionDefinition, PartialActionDefinition } from "./action-definition";

export interface ModuleDefinition<S = any, A extends string = string>
  extends ModuleDefinitionInputs1<S> {
  pinnedMessage?: (context: ModuleContext<S>) => Promise<Message | undefined>;
  actions: Record<A, ActionDefinition<S>>;
}

export interface ModuleDefinitionInputs1<S> {
  name: string;
  createState?: (params: ModuleStateInputs) => S;
}

export interface ModuleDefinitionInputs2<S, A extends string> {
  pinnedMessage?: (context: ModuleContext<S>) => Promise<Message | undefined>;
  actions: Record<A, PartialActionDefinition<S, string>>;
}

export interface ModuleStateInputs {
  agentId: string;
}

export interface ModuleContext<S> {
  sourceAgentId: string;
  allAgentIds: string[];
  actionDictionary: Map<string, ActionDefinition>;
  state: S;
}
