import Ajv from "ajv";
import eventSchema from "../schema/event.json";
import actionSchema from "../schema/action.json";

const ajv = new Ajv();

export const validateEvent = ajv.compile(eventSchema);

export const validateAction = ajv.compile(actionSchema);
