import Ajv from "ajv";
import actionDictionary from "../schema/action-dictionary.json";
import { Action } from "./action-types";

export const parseAction = parserFor<Action>("action", actionDictionary);

type ParseResult<T> =
  | { type: "success"; value: T }
  | { type: "error"; message: string };

function parserFor<T>(name: string, schema: object) {
  const validate = new Ajv().compile(schema);
  return (jsonString: string): ParseResult<T> => {
    let result: T;

    try {
      result = JSON.parse(jsonString);
    } catch (e) {
      return {
        type: "error",
        message: `Error parsing ${jsonString}: ${e}`,
      };
    }

    if (!validate(result)) {
      return {
        type: "error",
        message: `Unrecognized ${name}: ${jsonString}\n\nValidation errors: ${JSON.stringify(
          validate.errors
        )}`,
      };
    }

    return { type: "success", value: result };
  };
}
