import { fromPairs, mapValues, toPairs } from "lodash";
import { ActionDefinition, PartialActionDefinition } from "./action-definition";

export interface ActionModuleParameters {
  agentId: string;
}

export interface ActionModule<S = any, A extends string = string> {
  name: string;
  createState?: (params: ActionModuleParameters) => S;
  actions: Record<A, ActionDefinition<S>>;
}

export function defineActionModule<S>(
  module: Omit<ActionModule<S>, "actions">
) {
  return {
    withActions: <A extends string>(
      actions: Record<A, PartialActionDefinition<S, string>>
    ): ActionModule<S, A> => {
      return {
        ...module,
        actions: fromPairs(
          toPairs<PartialActionDefinition<S, string>>(actions).map(
            ([name, { parameters = {}, ...definition }]) => [
              name,
              {
                name,
                parameters: mapValues(parameters, (parameter) => ({
                  optional: false,
                  ...parameter,
                })),
                ...definition,
              },
            ]
          )
        ) as any,
      };
    },
  };
}
