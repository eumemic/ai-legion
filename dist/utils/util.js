"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.countTokens = exports.AVG_CHARACTERS_PER_TOKEN = exports.AVG_WORDS_PER_TOKEN = exports.MULTILINE_DELIMITER = exports.agentName = exports.messageSourceName = exports.sleepUntil = exports.sleep = void 0;
const gpt_3_encoder_1 = require("gpt-3-encoder");
function sleep(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
exports.sleep = sleep;
function sleepUntil(condition) {
    return new Promise((resolve) => {
        if (condition())
            return resolve();
        const interval = setInterval(() => {
            if (condition()) {
                clearInterval(interval);
                resolve();
            }
        }, 1000);
    });
}
exports.sleepUntil = sleepUntil;
function messageSourceName(source) {
    return source.type === "system" ? "System" : agentName(source.id);
}
exports.messageSourceName = messageSourceName;
function agentName(agentId) {
    return `${agentId === "0" ? "Control" : `Agent ${agentId}`}`;
}
exports.agentName = agentName;
exports.MULTILINE_DELIMITER = `% ${"ff9d7713-0bb0-40d4-823c-5a66de48761b"}`;
exports.AVG_WORDS_PER_TOKEN = 0.75;
exports.AVG_CHARACTERS_PER_TOKEN = 4;
function countTokens(text) {
    return (0, gpt_3_encoder_1.encode)(text).length;
}
exports.countTokens = countTokens;
