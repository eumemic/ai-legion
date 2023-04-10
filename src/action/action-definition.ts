import { mapValues } from "lodash";
import { Message } from "../message";
import { ActionDictionary } from "./action-dictionary";

export interface ActionDefinition<P extends string = string>
  extends PartialActionDefinition<P> {
  parameters: Record<P, ParameterDefinition>;
  handle: ActionHandler<P>;
}

export interface PartialActionDefinition<P extends string = never> {
  name: string;
  description: string;
  parameters?: Record<P, PartialParameterDefinition>;
}

export interface ParameterDefinition
  extends Required<PartialParameterDefinition> {}

export interface PartialParameterDefinition {
  description: string;
  optional?: boolean;
}

export type ActionHandler<P extends string = string> = (
  inputs: ActionHandlerInputs<P>
) => Promise<void>;

export interface ActionHandlerInputs<P extends string = string> {
  parameters: Record<P, string>;
  context: ActionContext;
  sendMessage: (message: Message) => void;
}

export interface ActionContext {
  sourceAgentId: string;
  allAgentIds: string[];
  actionDictionary: ActionDictionary;
}

export function defineAction<P extends string = string>({
  name,
  description,
  parameters = {} as Record<P, PartialParameterDefinition>,
}: PartialActionDefinition<P>) {
  return {
    withHandler: (
      handle: ActionDefinition<P>["handle"]
    ): ActionDefinition<P> => ({
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
