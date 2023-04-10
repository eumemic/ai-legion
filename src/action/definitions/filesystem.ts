import { readdir, readFile, statSync, writeFile } from "fs";
import { join as joinPath, resolve as resolvePath } from "path";
import { defineAction } from "../action-definition";
import { messageBuilder } from "../../message";

export default [
  defineAction({
    name: "list-directory",
    description: "Inspect the contents of a particular directory",
    parameters: {
      path: {
        description: "The path of the directory you want to inspect",
      },
    },
  }).withHandler(
    async ({
      parameters: { path },
      context: { sourceAgentId },
      sendMessage,
    }) => {
      if (!checkPath(sourceAgentId, path, sendMessage)) return;

      readdir(path, (err, files) => {
        if (err) {
          sendMessage(messageBuilder.error(sourceAgentId, JSON.stringify(err)));
        } else {
          sendMessage(
            messageBuilder.generic(
              sourceAgentId,
              `Here are the contents of ${path}:\n${files
                .map((file) => {
                  const stats = statSync(joinPath(path, file));
                  return `${file} ${
                    stats.isDirectory() ? "[directory]" : "[file]"
                  }`;
                })
                .join("\n")}`
            )
          );
        }
      });
    }
  ),
  defineAction({
    name: "read-file",
    description: "Read the contents of a particular file",
    parameters: {
      path: {
        description: "The path of the file you want to inspect",
      },
    },
  }).withHandler(
    async ({
      parameters: { path },
      context: { sourceAgentId },
      sendMessage,
    }) => {
      if (!checkPath(sourceAgentId, path, sendMessage)) return;

      readFile(path, "utf8", (err, data) => {
        if (err) {
          sendMessage(messageBuilder.error(sourceAgentId, JSON.stringify(err)));
        } else {
          sendMessage(
            messageBuilder.generic(
              sourceAgentId,
              `Contents of ${path}:\n\n${data}`
            )
          );
        }
      });
    }
  ),
  defineAction({
    name: "write-file",
    description: "Write the contents of a particular file",
    parameters: {
      path: {
        description: "The path of the file you want to write to",
      },
      newContent: {
        description: "The new content of the file",
      },
    },
  }).withHandler(
    async ({
      parameters: { path, newContent },
      context: { sourceAgentId },
      sendMessage,
    }) => {
      if (!checkPath(sourceAgentId, path, sendMessage)) return;

      writeFile(path, newContent, "utf8", (err) => {
        if (err) {
          sendMessage(messageBuilder.error(sourceAgentId, JSON.stringify(err)));
        } else {
          sendMessage(
            messageBuilder.generic(sourceAgentId, `Wrote to ${path}.`)
          );
        }
      });
    }
  ),
];

function checkPath(
  agentId: string,
  path: string,
  sendMessage: (message: any) => void
) {
  const currentDirectory = process.cwd();
  const resolvedPath = resolvePath(path);
  if (!resolvedPath.startsWith(currentDirectory)) {
    sendMessage(
      messageBuilder.error(
        agentId,
        "Invalid path; must be within the current directory."
      )
    );
    return false;
  }
  if (resolvedPath.includes(".git") || resolvedPath.includes("node_modules")) {
    sendMessage(messageBuilder.error(agentId, "That path is off-limits!"));
    return false;
  }
  return true;
}
