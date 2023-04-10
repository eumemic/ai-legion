import Ajv from "ajv";
import actionDictionary from "../schema/action-dictionary.json";
import { Action } from "./action-types";
import { getUsageText } from "./message";
import { MULTILINE_DELIMITER } from "./util";

type ParseResult<T> =
  | { type: "success"; value: T }
  | { type: "error"; message: string };

const validate = new Ajv().compile(actionDictionary);

export default function parseAction(text: string): ParseResult<Action> {
  let result: any;

  text = `name: ${text.trim()}`;

  try {
    const jsonText =
      "{" +
      text
        .split(MULTILINE_DELIMITER)
        .map((part) => part.trim())
        .map((part, i) => {
          if (i % 2 === 0) return part;
          const escaped = JSON.stringify(part);
          return escaped.substring(1, escaped.length - 1);
        })
        .join("")
        .split("\n")
        .map((line) => {
          const colonIndex = line.indexOf(":");
          if (colonIndex < 0) throw new Error("line is missing a colon");
          const key = line.substring(0, colonIndex).trim();
          const value = line.substring(colonIndex + 1).trim();
          return `"${key}": "${value}"`;
        })
        .join(",") +
      "}";

    result = JSON.parse(jsonText);
  } catch (e: any) {
    return {
      type: "error",
      message: "Your action could not be parsed.",
    };
  }

  const actionDef = Object.values(actionDictionary.oneOf).find(
    (def) => def.properties.name.const === result.name
  );
  if (!actionDef)
    return {
      type: "error",
      message: `Unknown action \`${result.name}\`, please consult \`help\`.`,
    };

  const missingProps = actionDef.required.filter(
    (propName) => !(propName in result)
  );
  if (missingProps.length) {
    return {
      type: "error",
      message: `Missing required argument${
        missingProps.length > 1 ? "s" : ""
      } ${missingProps.map((p) => `\`${p}\``)}. ${getUsageText(actionDef)}`,
    };
  }

  const extraProps = Object.keys(result).filter(
    (p) => !(p in actionDef.properties)
  );
  if (extraProps.length) {
    return {
      type: "error",
      message: `Extraneous argument${
        extraProps.length > 1 ? "s" : ""
      } ${extraProps.map((p) => `\`${p}\``)}. ${getUsageText(actionDef)}`,
    };
  }

  if (!validate(result)) {
    return {
      type: "error",
      message: "Not a valid action, please consult `help`.",
    };
  }

  return { type: "success", value: result as any };
}
