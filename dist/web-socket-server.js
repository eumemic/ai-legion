"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketServer = void 0;
// WebSocketServer.ts
const ws_1 = __importDefault(require("ws"));
class WebSocketServer {
    constructor(messageBus, port) {
        this.messageBus = messageBus;
        this.wss = new ws_1.default.Server({ port });
        this.messageBus.subscribe((message) => {
            this.wss.clients.forEach((client) => {
                if (client.readyState === ws_1.default.OPEN) {
                    client.send(JSON.stringify(message));
                }
            });
        });
        this.wss.on("connection", (ws) => {
            console.log("WebSocket client connected");
            ws.on("message", (message) => {
                console.log("Received: %s", message);
            });
            ws.on("close", () => {
                console.log("WebSocket client disconnected");
            });
        });
    }
}
exports.WebSocketServer = WebSocketServer;
