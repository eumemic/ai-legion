import { fromPairs, mapValues, toPairs } from "lodash";
import { ActionDefinition, PartialActionDefinition } from "./action-definition";

export interface Module<S = any, A extends string = string>
  extends ModuleArguments1<S> {
  actions: Record<A, ActionDefinition<S>>;
}

interface ModuleArguments1<S> {
  name: string;
  createState?: (params: ModuleStateArguments) => S;
}

interface ModuleArguments2<S, A extends string> {
  actions: Record<A, PartialActionDefinition<S, string>>;
}

interface ModuleStateArguments {
  agentId: string;
}

export function defineModule<S>(module: ModuleArguments1<S>) {
  return {
    with: <A extends string>({
      actions,
    }: ModuleArguments2<S, A>): Module<S, A> => ({
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
    }),
  };
}
