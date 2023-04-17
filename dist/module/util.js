"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsageText = void 0;
const message_1 = require("../message");
function getUsageText(actionDef) {
    return `Usage:

${message_1.CODE_BLOCK_DELIMITER}
${actionDef.name}
thoughts: <reasoning behind this action> (optional)${Object.entries(actionDef.parameters)
        .map(([name, { description }]) => name === "name"
        ? undefined
        : `\n${name}: <${description.toLowerCase()}>${actionDef.parameters[name].optional ? " (optional)" : ""}`)
        .filter(Boolean)
        .join("")}
${message_1.CODE_BLOCK_DELIMITER}`;
}
exports.getUsageText = getUsageText;
