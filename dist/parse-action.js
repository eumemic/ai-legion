"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const message_1 = require("./message");
const util_1 = require("./module/util");
const util_2 = require("./util");
function parseAction(actionDictionary, text) {
    try {
        text = text.trim();
        if (!/^\S+(?=\n|$)/.test(text.split("\n")[0])) {
            return {
                type: "error",
                message: `
Your action could not be parsed. Remember to always format your entire response as an action, like this:

${message_1.CODE_BLOCK_DELIMITER}
<action name>
<arg 1 name>: <prop value>
<arg 2 name>: <prop value>
...
${message_1.CODE_BLOCK_DELIMITER}
`.trim(),
            };
        }
        text = `name: ${text}`;
        const jsonText = "{" +
            text
                .split(util_2.MULTILINE_DELIMITER)
                .map((part) => part.trim())
                .map((part, i) => {
                if (i % 2 === 0)
                    return part;
                return JSON.stringify(part) + "\n";
            })
                .join("")
                .split("\n")
                .filter(Boolean)
                .map((line) => {
                const colonIndex = line.indexOf(":");
                if (colonIndex < 0)
                    throw new Error(`Your action could not be parsed. Did you fail to wrap the entirety of a multi-line parameter value with the multi-line delimiter (\`${util_2.MULTILINE_DELIMITER}\`)?`);
                const key = line.substring(0, colonIndex).trim();
                let value = line.substring(colonIndex + 1).trim();
                if (!value.startsWith('"') || !value.endsWith('"'))
                    value = JSON.stringify(value);
                return `"${key}": ${value}`;
            })
                .join(",") +
            "}";
        const { name, thoughts, ...parameters } = JSON.parse(jsonText);
        const actionDef = actionDictionary.get(name);
        if (!actionDef)
            return {
                type: "error",
                message: `Unknown action \`${name}\`. Please refer to the list of available actions given in the introductory message.`,
            };
        const missingProps = Object.entries(actionDef.parameters)
            .filter(([name, parameterDef]) => !parameterDef.optional && !(name in parameters))
            .map(([name]) => name);
        if (missingProps.length) {
            return {
                type: "error",
                message: `Missing required parameter${missingProps.length > 1 ? "s" : ""} ${missingProps.map((p) => `\`${p}\``)}. ${(0, util_1.getUsageText)(actionDef)}`,
            };
        }
        const extraProps = Object.keys(parameters).filter((p) => !(p in actionDef.parameters));
        if (extraProps.length) {
            return {
                type: "error",
                message: `Extraneous parameter${extraProps.length > 1 ? "s" : ""} ${extraProps.map((p) => `\`${p}\``)}. ${(0, util_1.getUsageText)(actionDef)}`,
            };
        }
        return { type: "success", action: { actionDef, thoughts, parameters } };
    }
    catch (e) {
        return {
            type: "error",
            message: e.message,
        };
    }
}
exports.default = parseAction;
