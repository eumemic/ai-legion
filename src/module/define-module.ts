import { fromPairs, mapValues, toPairs } from "lodash";
import { PartialActionDefinition } from "./action-definition";
import {
  ModuleDefinitionInputs1,
  ModuleDefinitionInputs2,
  ModuleDefinition,
} from ".";

export function defineModule<S>(inputs1: ModuleDefinitionInputs1<S>) {
  return {
    with: <A extends string>({
      actions,
      ...inputs2
    }: ModuleDefinitionInputs2<S, A>): ModuleDefinition<S, A> => ({
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
