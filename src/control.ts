import { fork, ChildProcess } from "child_process";
import { IMessage } from "./interfaces/message.interface";
import { messageBuilder } from "./message";
import { IMessageBus } from "./interfaces/messageBus.interface";
import path from "path";
import { IAgentMessage } from "./interfaces/agent.interface";
import { IControlMessage } from "./interfaces/control.interface";

interface Agent {
  id: string;
  process: ChildProcess;
}

export class Control {
  private agents: Agent[] = [];

  constructor(
    model: string,
    agentIds: string[],
    private messageBus: IMessageBus
  ) {
    for (const id of agentIds.slice(1)) {
      const agentModulePath = path.join(__dirname, "agent");

      const agentProcess = fork(agentModulePath);

      agentProcess.on("message", (message: IAgentMessage) => {
        switch (message.type) {
          case "message":
            if (message.agentMessage)
              this.messageBus.send(message.agentMessage as IMessage);
            break;

          case "error":
            if (message.agentMessage)
              this.messageBus.send(
                messageBuilder.error(
                  message.agentId,
                  message.agentMessage as string
                )
              );
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
        } as IControlMessage);
      });

      this.agents.push({
        id,
        process: agentProcess,
      });

      agentProcess.send({
        type: "init",
        controlMessage: { id, agents: agentIds, model },
      } as IControlMessage);
    }
  }
}
