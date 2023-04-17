"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageBuilder = exports.CODE_BLOCK_DELIMITER = exports.agentSource = exports.systemSource = void 0;
exports.systemSource = { type: "system" };
const agentSource = (id) => ({
    type: "agent",
    id,
});
exports.agentSource = agentSource;
exports.CODE_BLOCK_DELIMITER = "```";
exports.messageBuilder = addMessageTypes({
    spontaneous: singleTargetSystemMessage,
    ok: singleTargetSystemMessage,
    error: singleTargetSystemMessage,
    agentToAgent: (sourceAgentId, targetAgentIds, content) => ({
        source: (0, exports.agentSource)(sourceAgentId),
        targetAgentIds,
        content,
    }),
});
function addMessageTypes(record) {
    for (const [type, builder] of Object.entries(record)) {
        record[type] = (...args) => ({
            type,
            ...builder(...args),
        });
    }
    return record;
}
function singleTargetSystemMessage(agentId, content) {
    return {
        source: exports.systemSource,
        targetAgentIds: [agentId],
        content,
    };
}
