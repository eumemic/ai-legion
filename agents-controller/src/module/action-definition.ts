import { ModuleContext } from ".";
import { Message } from "../message";

export interface ActionDefinition<S = void, P extends string = string>
  extends PartialActionDefinition<S, P> {
  name: string;
  parameters: Record<P, ParameterDefinition>;
}

export interface PartialActionDefinition<S = void, P extends string = never> {
  description: string;
  parameters?: Record<P, PartialParameterDefinition>;
  execute: ActionHandler<S, P>;
}

export type ParameterDefinition = Required<PartialParameterDefinition>;

export interface PartialParameterDefinition {
  description: string;
  optional?: boolean;
}

export type ActionHandler<S = void, P extends string = string> = (
  inputs: ActionHandlerInputs<S, P>
) => Promise<void>;

export interface ActionHandlerInputs<S = void, P extends string = string> {
  parameters: Record<P, string>;
  context: ModuleContext<S>;
  sendMessage: (message: Message) => void;
}
export { ModuleContext };
