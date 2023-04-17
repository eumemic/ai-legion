"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Control = void 0;
const child_process_1 = require("child_process");
const message_1 = require("./message");
const path_1 = __importDefault(require("path"));
class Control {
    constructor(model, agentIds, messageBus) {
        this.messageBus = messageBus;
        this.agents = [];
        for (const id of agentIds.slice(1)) {
            const agentModulePath = path_1.default.join(__dirname, "agent");
            const agentProcess = (0, child_process_1.fork)(agentModulePath);
            agentProcess.on("message", (message) => {
                switch (message.type) {
                    case "message":
                        if (message.agentMessage)
                            this.messageBus.send(message.agentMessage);
                        break;
                    case "error":
                        if (message.agentMessage)
                            this.messageBus.send(message_1.messageBuilder.error(message.agentId, message.agentMessage));
                        break;
                    default:
                        return;
                }
            });
            this.messageBus.subscribe((message) => {
                if (message.targetAgentIds && !message.targetAgentIds.includes(id))
                    return;
                agentProcess.send({
                    type: "appendMemory",
                    controlMessage: message,
                });
            });
            this.agents.push({
                id,
                process: agentProcess,
            });
            agentProcess.send({
                type: "init",
                controlMessage: { id, agents: agentIds, model },
            });
        }
    }
}
exports.Control = Control;
