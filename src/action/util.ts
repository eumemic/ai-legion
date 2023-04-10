import { CODE_BLOCK_DELIMITER } from "../message";
import { ActionDefinition } from "./action-definition";

export function getUsageText(actionDef: ActionDefinition): string {
  return `Usage:

${CODE_BLOCK_DELIMITER}
${actionDef.name}${Object.entries(actionDef.parameters)
    .map(([name, { description }]) =>
      name === "name"
        ? undefined
        : `${name}: <${description.toLowerCase()}>${
            actionDef.parameters[name].optional ? " (optional)" : ""
          }`
    )
    .filter(Boolean)
    .map((part) => `\n${part}`)
    .join("")}
${CODE_BLOCK_DELIMITER}`;
}
