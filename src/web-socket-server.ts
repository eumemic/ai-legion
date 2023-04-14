// WebSocketServer.ts
import WebSocket from 'ws';
import { MessageBus } from './message-bus';

export class WebSocketServer {
  private wss: WebSocket.Server;

  constructor(private messageBus: MessageBus, port: number) {
    this.wss = new WebSocket.Server({ port });

    this.messageBus.subscribe((message) => {
      this.wss.clients.forEach((client: WebSocket) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      });
    });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('WebSocket client connected');
      ws.on('message', (message: string) => {
        console.log('Received: %s', message);
      });
      ws.on('close', () => {
        console.log('WebSocket client disconnected');
      });
    });
  }
}
