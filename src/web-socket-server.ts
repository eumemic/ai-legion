import WebSocket from "ws";
import { MessageBus } from "./message-bus";

export const webSocketServer = (messageBus: MessageBus, port: number) => {
  const wss = new WebSocket.Server({ port });

  messageBus.subscribe((message) => {
    wss.clients.forEach((client: WebSocket) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  });

  wss.on("connection", (ws: WebSocket) => {
    console.log("WebSocket client connected");
    ws.on("message", (message: string) => {
      console.log("Received: %s", message);
    });
    ws.on("close", () => {
      console.log("WebSocket client disconnected");
    });
  });
};
