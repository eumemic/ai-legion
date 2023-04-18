import { createServer, Server as HttpServer } from "http";
import { Server as IOServer, Socket } from "socket.io";
import { MessageBus } from "./message-bus";
import { messageBuilder } from "./message";
import { generateObject } from "./tests/utils/generateRandomMessage";

const AGENT_ID = "0";

function webSocketServer(
  messageBus: MessageBus,
  port: number,
  agentIds: string[]
): void {
  const httpServer = createServer();
  const io = new IOServer(httpServer, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log("A user connected");

    let testStream: any;
    function generateObjectEveryTwoSeconds(): void {
      console.log(generateObject());
      socket.emit("message", generateObject());
      testStream = setTimeout(generateObjectEveryTwoSeconds, 2000);
    }

    // Test function to generate content
    //generateObjectEveryTwoSeconds();

    messageBus.subscribe((message) => {
      socket.emit("message", { ...message, activeAgents: agentIds });
    });

    socket.on("message", (msg: string) => {
      messageBus.send(messageBuilder.agentToAgent(AGENT_ID, agentIds, msg));
    });

    socket.on("disconnect", () => {
      testStream && clearTimeout(testStream);
      console.log("A user disconnected");
    });
  });

  httpServer.listen(port, () => {
    console.log(`Socket.IO server is listening on port ${port}`);
  });
}

export default webSocketServer;
