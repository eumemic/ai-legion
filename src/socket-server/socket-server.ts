import { createServer } from "http";
import { Server as IOServer, Socket } from "socket.io";
import { MessageBus } from "../message-bus";
import { messageBuilder } from "../message";
import { generateObject } from "../tests/utils/generateRandomMessage";
import { test } from "../parameters";
import { CommandMessage, commandMessageReducer } from "./command-reducer";
import { CommandActions } from "./command-actions";

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

  const commandActions = CommandActions();

  io.on("connection", (socket: Socket) => {
    console.log("A user connected");
    let testStream: any;

    function generateObjectEveryTwoSeconds(): void {
      //console.log(generateObject());
      socket.emit("message", generateObject());
      testStream = setTimeout(generateObjectEveryTwoSeconds, 2000);
    }

    if (test) {
      generateObjectEveryTwoSeconds();
    }

    messageBus.subscribe((message) => {
      socket.emit("message", { ...message, activeAgents: agentIds });
    });

    socket.on("message", (message) => {
      switch (message.type) {
        case "state":
          //stateMessageReducer(message.content);
          break;

        case "command":
          commandMessageReducer(message.content, commandActions);
          break;

        case "message":
          messageBus.send(
            messageBuilder.agentToAgent(
              AGENT_ID,
              message.agentIds || agentIds,
              message.content
            )
          );
          break;
      }
    });

    socket.on("disconnect", () => {
      if (test) testStream && clearTimeout(testStream);
      console.log("A user disconnected");
    });
  });

  httpServer.listen(port, () => {
    console.log(`Socket.IO server is listening on port ${port}`);
  });
}

export default webSocketServer;
