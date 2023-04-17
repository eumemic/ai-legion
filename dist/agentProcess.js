"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentProcess = void 0;
const lodash_1 = require("lodash");
const make_decision_1 = __importDefault(require("./make-decision"));
const message_1 = require("./message");
const parse_action_1 = __importDefault(require("./parse-action"));
const task_queue_1 = __importDefault(require("./task-queue"));
const util_1 = require("./util");
const actionInterval = 10 * 1000;
// const heartbeatInterval = 60 * 1000;
class AgentProcess {
    constructor(id, memory, messageBus, moduleManager, actionHandler) {
        this.id = id;
        this.memory = memory;
        this.messageBus = messageBus;
        this.moduleManager = moduleManager;
        this.actionHandler = actionHandler;
        this.taskQueue = new task_queue_1.default();
    }
    // Start this Agent's event loop
    async start() {
        // Subscribe to messages
        this.messageBus.subscribe((message) => {
            if (message.targetAgentIds && !message.targetAgentIds.includes(this.id))
                return;
            this.memory.append({ type: 'message', message });
        });
        this.taskQueue.runPeriodically(() => this.takeAction(), actionInterval);
    }
    async takeAction() {
        var _a;
        try {
            let events = await this.memory.retrieve();
            // Do not act again if the last event was a decision
            if (((_a = (0, lodash_1.last)(events)) === null || _a === void 0 ? void 0 : _a.type) === 'decision')
                return;
            const actionText = await (0, make_decision_1.default)(events);
            // Reassign events in case summarization occurred
            events = await this.memory.append({
                type: 'decision',
                actionText
            });
            const result = (0, parse_action_1.default)(this.moduleManager.actions, actionText);
            if (result.type === 'error') {
                this.messageBus.send(message_1.messageBuilder.error(this.id, result.message));
            }
            else {
                await this.actionHandler.handle(this.id, result.action);
            }
        }
        catch (e) {
            console.error(`${(0, util_1.agentName)(this.id)} encountered the following problem while attempting to take action:`);
            console.error(e);
        }
        finally {
            await (0, util_1.sleep)(5000);
        }
    }
}
exports.AgentProcess = AgentProcess;
