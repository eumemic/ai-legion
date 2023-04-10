import { fromPairs, mapValues, toPairs } from "lodash";
import { PartialActionDefinition } from "./action-definition";
import { ModuleInputs1, ModuleInputs2, Module } from ".";

export function defineModule<S>(inputs1: ModuleInputs1<S>) {
  return {
    with: <A extends string>({
      actions,
      ...inputs2
    }: ModuleInputs2<S, A>): Module<S, A> => ({
      ...inputs1,
      ...inputs2,
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
