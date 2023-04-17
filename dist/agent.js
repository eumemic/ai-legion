"use strict";
// agent.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const action_handler_agent_1 = __importDefault(require("./action-handler_agent"));
const make_decision_1 = __importDefault(require("./make-decision"));
const memory_1 = require("./memory");
const core_1 = __importDefault(require("./module/definitions/core"));
const filesystem_1 = __importDefault(require("./module/definitions/filesystem"));
const goals_1 = __importDefault(require("./module/definitions/goals"));
const messaging_1 = __importDefault(require("./module/definitions/messaging"));
const notes_1 = __importDefault(require("./module/definitions/notes"));
const web_1 = __importDefault(require("./module/definitions/web"));
const module_manager_1 = require("./module/module-manager");
const openai_1 = require("./services/openai");
const parse_action_1 = __importDefault(require("./utils/parse-action"));
const file_store_1 = __importDefault(require("./store/file-store"));
const json_store_1 = __importDefault(require("./store/json-store"));
const task_queue_1 = __importDefault(require("./services/task-queue"));
const util_1 = require("./utils/util");
const ACTION_INTERVAL = 10 * 1000;
class Agent {
    constructor(agentId, agents, model) {
        this.agentId = agentId;
        this.agents = agents;
        this.model = model;
        this.moduleManager = new module_manager_1.ModuleManager(this.agentId, this.agents, [
            core_1.default,
            goals_1.default,
            notes_1.default,
            messaging_1.default,
            filesystem_1.default,
            web_1.default,
        ]);
        this.actionHandler = new action_handler_agent_1.default(this.agents, this.moduleManager);
        const store = new json_store_1.default(new file_store_1.default([this.agentId]));
        // We have to leave room for the agent's next action, which is of unknown size
        const compressionThreshold = Math.round(openai_1.contextWindowSize[this.model] * 0.75);
        this.memory = new memory_1.Memory(this.agentId, this.moduleManager, store, compressionThreshold, this.model);
        const agentMessage = {
            agentId,
            type: "subscribe",
        };
        if (process === null || process === void 0 ? void 0 : process.send)
            process.send(agentMessage);
        process.on("message", (message) => {
            if (message.type === "appendMemory") {
                this.memory.append({
                    type: "message",
                    message: message.controlMessage,
                });
            }
        });
    }
    async takeAction() {
        var _a;
        try {
            let events = await this.memory.retrieve();
            // Do not act again if the last event was a decision
            if (((_a = (0, lodash_1.last)(events)) === null || _a === void 0 ? void 0 : _a.type) === "decision")
                return;
            const actionText = await (0, make_decision_1.default)(events, this.model);
            console.log("actionText", actionText);
            // Reassign events in case summarization occurred
            events = await this.memory.append({
                type: "decision",
                actionText,
            });
            const result = (0, parse_action_1.default)(this.moduleManager.actions, actionText);
            if (result.type === "error") {
                const agentMessage = {
                    agentId: this.agentId,
                    type: "error",
                    agentMessage: result.message,
                };
                if (process === null || process === void 0 ? void 0 : process.send)
                    process.send(agentMessage);
            }
            else {
                await this.actionHandler.handle(this.agentId, result.action);
            }
        }
        catch (e) {
            console.error(`${(0, util_1.agentName)(this.agentId)} encountered the following problem while attempting to take action:`);
            console.error(e);
        }
        finally {
            await (0, util_1.sleep)(5000);
        }
    }
}
process.on("message", (message) => {
    var _a, _b, _c;
    if (message.type === "init") {
        const agentId = (_a = message.controlMessage) === null || _a === void 0 ? void 0 : _a.id;
        const agents = (_b = message.controlMessage) === null || _b === void 0 ? void 0 : _b.agents;
        const model = (_c = message.controlMessage) === null || _c === void 0 ? void 0 : _c.model;
        const agent = new Agent(agentId, agents, model);
        const taskQueue = new task_queue_1.default();
        taskQueue.runPeriodically(() => agent.takeAction(), ACTION_INTERVAL);
        agent.takeAction();
    }
});
