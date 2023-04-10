import Ajv from "ajv";
import actionDictionary from "../schema/action-dictionary.json";
import eventDictionary from "../schema/event-dictionary.json";
import { Action } from "./action-types";
import { Event } from "./event-types";

export const parseEvent = parserFor<Event>("event", eventDictionary);
export const parseAction = parserFor<Action>("action", actionDictionary);

function parserFor<T>(name: string, schema: object) {
  const validate = new Ajv().compile(schema);
  return (jsonString: string): T | undefined => {
    let obj: T;

    try {
      obj = JSON.parse(jsonString);
    } catch (e) {
      console.error(`Error parsing ${jsonString}`, e);
      return;
    }

    if (!validate(obj)) {
      console.error(
        `Unrecognized ${name}: ${jsonString}\n\nValidation errors: ${JSON.stringify(
          validate.errors
        )}`
      );
      return;
    }
    return obj;
  };
}
