import { Action } from "./action-types";
import { Message, messageBuilder } from "./message";
import { MessageBus } from "./message-bus";
import { agentName } from "./util";
import { readdir, readFile, writeFile, statSync } from "fs";
import { resolve as resolvePath, join as joinPath } from "path";

export default class ActionHandler {
  constructor(private agentIds: string[], private messageBus: MessageBus) {}

  async handle(agentId: string, action: Action) {
    switch (action.name) {
      // case "no-op":
      //   this.messageBus.send(
      //     messageBuilder.generic(
      //       agentId,
      //       `Are you sure there isn't anything you'd like to do? Maybe you should reach out and network with one of the other agents.`
      //     )
      //   );
      //   break;
      case "query-agent-registry":
        this.messageBus.send(messageBuilder.listAgents(agentId, this.agentIds));
        break;
      case "view-action-dictionary":
        this.messageBus.send(messageBuilder.showActionDictionary(agentId));
        break;
      case "send-message":
        const { targetAgentId } = action;
        // if (targetAgentId === "0")
        //   this.messageBus.send(
        //     messageBuilder.generic(
        //       agentId,
        //       `Thanks for your message, I will forward it to my human counterpart and then get back to you with their response.`
        //     )
        //   );
        // else
        if (this.agentIds.includes(action.targetAgentId))
          this.messageBus.send(
            messageBuilder.agentToAgent(
              agentId,
              [targetAgentId],
              action.message
            )
          );
        else
          this.messageBus.send(
            messageBuilder.generic(
              agentId,
              `You tried to send your message to an invalid targetAgentId (${JSON.stringify(
                action.targetAgentId
              )}). You can use the 'query-agent-registry' action to see a list of available agents and their agent IDs.`
            )
          );
        break;
      case "list-directory":
        if (!this.checkPath(agentId, action.path)) break;
        readdir(action.path, (err, files) => {
          if (err) {
            this.messageBus.send(
              messageBuilder.generic(agentId, JSON.stringify(err))
            );
          } else {
            this.messageBus.send(
              messageBuilder.generic(
                agentId,
                `Here are the contents of ${action.path}:\n${files
                  .map((file) => {
                    const stats = statSync(joinPath(action.path, file));
                    return `${file} ${
                      stats.isDirectory() ? "[directory]" : "[file]"
                    }`;
                  })
                  .join("\n")}`
              )
            );
          }
        });
        break;
      case "read-file":
        if (!this.checkPath(agentId, action.path)) break;
        readFile(action.path, "utf8", (err, data) => {
          // If there's an error, log it and exit
          if (err) {
            this.messageBus.send(
              messageBuilder.generic(agentId, JSON.stringify(err))
            );
          } else {
            this.messageBus.send(
              messageBuilder.generic(
                agentId,
                `Contents of ${action.path}:\n${data}`
              )
            );
          }
        });
        break;
      case "write-file":
        if (!this.checkPath(agentId, action.path)) break;
        writeFile(action.path, action.newContent, "utf8", (err) => {
          if (err) {
            this.messageBus.send(
              messageBuilder.generic(agentId, JSON.stringify(err))
            );
          } else {
            this.messageBus.send(
              messageBuilder.generic(agentId, `Wrote to ${action.path}.`)
            );
          }
        });
        break;
    }
  }

  checkPath(agentId: string, path: string) {
    const currentDirectory = process.cwd();
    const resolvedPath = resolvePath(path);
    if (!resolvedPath.startsWith(currentDirectory)) {
      this.messageBus.send(
        messageBuilder.generic(
          agentId,
          "Invalid path; must be within the current directory."
        )
      );
      return false;
    }
    if (
      resolvedPath.includes(".git") ||
      resolvedPath.includes("node_modules")
    ) {
      this.messageBus.send(
        messageBuilder.generic(agentId, "That path is off-limits!")
      );
      return false;
    }
    return true;
  }
}
