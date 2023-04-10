import { ActionDefinition, PartialActionDefinition } from "./action-definition";
import { Message } from "../message";
import { ActionDictionary } from "./action-dictionary";

export interface Module<S = any, A extends string = string>
  extends ModuleInputs1<S> {
  actions: Record<A, ActionDefinition<S>>;
}

export interface ModuleInputs1<S> {
  name: string;
  createState?: (params: ModuleStateInputs) => S;
}

export interface ModuleInputs2<S, A extends string> {
  pinnedMessage?: (context: Context<S>) => Message;
  actions: Record<A, PartialActionDefinition<S, string>>;
}

export interface ModuleStateInputs {
  agentId: string;
}

export interface Context<S> {
  sourceAgentId: string;
  allAgentIds: string[];
  actionDictionary: ActionDictionary;
  state: S;
}
