import Ajv from "ajv";
import eventSchema from "../schema/event.json";
import actionSchema from "../schema/action.json";
import { Action } from "./action";
import { Event } from "./event";

export const parseEvent = parserFor<Event>("event", eventSchema);
export const parseAction = parserFor<Action>("action", actionSchema);

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
