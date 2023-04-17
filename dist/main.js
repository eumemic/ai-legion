"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const console_1 = require("./console");
const in_memory_message_bus_1 = require("./services/in-memory-message-bus");
const parameters_1 = require("./parameters");
const web_socket_server_1 = require("./web-socket-server");
const control_1 = require("./control");
dotenv_1.default.config();
const agentIds = Array.from({ length: parameters_1.numberOfAgents + 1 }, (_, i) => `${i}`);
const messageBus = new in_memory_message_bus_1.InMemoryMessageBus();
console.log(`Number of agents: ${parameters_1.numberOfAgents}`);
console.log(`Model: ${parameters_1.model}`);
async function main() {
    const webSocketServer = new web_socket_server_1.WebSocketServer(messageBus, 8080);
    (0, console_1.startConsole)(agentIds, messageBus);
    const control = new control_1.Control(parameters_1.model, agentIds, messageBus);
}
