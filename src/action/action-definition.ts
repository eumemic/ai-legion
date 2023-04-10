import { mapValues } from "lodash";
import { Message } from "../message";
import { ActionDictionary } from "./action-dictionary";

export interface ActionDefinition<S = void, P extends string = string>
  extends PartialActionDefinition<P> {
  parameters: Record<P, ParameterDefinition>;
  handle: ActionHandler<S, P>;
}

export interface PartialActionDefinition<P extends string = never> {
  name: string;
  description: string;
  parameters?: Record<P, PartialParameterDefinition>;
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
  context: ActionContext<S>;
  sendMessage: (message: Message) => void;
}

export interface ActionContext<S> {
  sourceAgentId: string;
  allAgentIds: string[];
  actionDictionary: ActionDictionary;
  state: S;
}

export function defineAction<P extends string = string>({
  name,
  description,
  parameters = {} as Record<P, PartialParameterDefinition>,
}: PartialActionDefinition<P>) {
  return {
    withHandler: <S>(
      handle: ActionDefinition<S, P>["handle"]
    ): ActionDefinition<S, P> => ({
      name,
      description,
      parameters: mapValues(parameters, (parameter) => ({
        optional: false,
        ...parameter,
      })),
      handle,
    }),
  };
}
