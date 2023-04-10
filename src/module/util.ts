import { CODE_BLOCK_DELIMITER } from "../message";
import { ActionDefinition } from "./action-definition";

export function getUsageText(actionDef: ActionDefinition): string {
  return `Usage:

${CODE_BLOCK_DELIMITER}
${actionDef.name}
thoughts: <reasoning behind this action> (optional)${Object.entries(
    actionDef.parameters
  )
    .map(([name, { description }]) =>
      name === "name"
        ? undefined
        : `\n${name}: <${description.toLowerCase()}>${
            actionDef.parameters[name].optional ? " (optional)" : ""
          }`
    )
    .filter(Boolean)
    .join("")}
${CODE_BLOCK_DELIMITER}`;
}
