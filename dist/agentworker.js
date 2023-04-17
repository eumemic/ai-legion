"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const make_decision_1 = __importDefault(require("./make-decision"));
const message_1 = require("./message");
const parse_action_1 = __importDefault(require("./parse-action"));
const task_queue_1 = __importDefault(require("./task-queue"));
const util_1 = require("./util");
let memory;
let actionHandler;
let moduleManager;
let messageBus;
let taskQueue = new task_queue_1.default();
let agentId;
const actionInterval = 10 * 1000;
const agentWorker = (() => {
    function initialize(id, context) {
        agentId = id;
        memory = context.memory;
        actionHandler = context.actionHandler;
        moduleManager = context.moduleManager;
        messageBus = context.messageBus;
        console.log(`Agent ${id} initialized`);
        messageBus.subscribe((message) => {
            if (message.targetAgentIds && !message.targetAgentIds.includes(id))
                return;
            memory.append({ type: 'message', message });
        });
        taskQueue.runPeriodically(() => takeAction(), actionInterval);
    }
    async function takeAction() {
        var _a;
        try {
            let events = await memory.retrieve();
            // Do not act again if the last event was a decision
            if (((_a = (0, lodash_1.last)(events)) === null || _a === void 0 ? void 0 : _a.type) === 'decision')
                return;
            const actionText = await (0, make_decision_1.default)(events);
            // Reassign events in case summarization occurred
            events = await memory.append({
                type: 'decision',
                actionText,
            });
            const result = (0, parse_action_1.default)(moduleManager.actions, actionText);
            if (result.type === 'error') {
                messageBus.send(message_1.messageBuilder.error(agentId, result.message));
            }
            else {
                await actionHandler.handle(agentId, result.action);
            }
        }
        catch (e) {
            console.error(`${(0, util_1.agentName)(agentId)} encountered the following problem while attempting to take action:`);
            console.error(e);
        }
        finally {
            await (0, util_1.sleep)(5000);
        }
    }
    // function handleMessage(from: number, to: number, content: string): void {
    //   console.log(`Agent ${from} to Agent ${to}: ${content}`);
    // }
    return {
        initialize,
    };
})();
