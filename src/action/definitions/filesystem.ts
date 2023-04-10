import { readdir, readFile, writeFile, stat, unlink, rename } from "fs/promises";
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

      try {
        const files = await readdir(path);
        const filesWithStatsPromises = files.map(async (file) => {
          const stats = await stat(joinPath(path, file));
          return `${file} ${stats.isDirectory() ? "[directory]" : "[file]"}`;
        });
        const filesWithStats = await Promise.all(filesWithStatsPromises);
        sendMessage(
          messageBuilder.standard(
            sourceAgentId,
            `Here are the contents of ${path}:\n${filesWithStats.join("\n")}`
          )
        );
      } catch (err) {
        sendMessage(messageBuilder.error(sourceAgentId, JSON.stringify(err)));
      }
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

      try {
        const data = await readFile(path, "utf8");
        sendMessage(
          messageBuilder.standard(
            sourceAgentId,
            `Contents of ${path}:\n\n${data}`
          )
        );
      } catch (err) {
        sendMessage(messageBuilder.error(sourceAgentId, JSON.stringify(err)));
      }
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

      try {
        await writeFile(path, newContent, "utf8");
        sendMessage(
          messageBuilder.standard(sourceAgentId, `Wrote to ${path}.`)
        );
      } catch (err) {
        sendMessage(messageBuilder.error(sourceAgentId, JSON.stringify(err)));
      }
    }
  ),

  defineAction({
    name: "move-file",
    description: "Move a file to a new location",
    parameters: {
      sourcePath: {
        description: "The original path of the file",
      },
      destinationPath: {
        description: "The new path for the file",
      },
    },
  }).withHandler(
    async ({
      parameters: { sourcePath, destinationPath },
      context: { sourceAgentId },
      sendMessage,
    }) => {
      if (!checkPath(sourceAgentId, sourcePath, sendMessage)) return;
      if (!checkPath(sourceAgentId, destinationPath, sendMessage)) return;

      try {
        await rename(sourcePath, destinationPath);
        sendMessage(
          messageBuilder.standard(sourceAgentId, `Moved ${sourcePath} to ${destinationPath}.`)
        );
      } catch (err) {
        sendMessage(messageBuilder.error(sourceAgentId, JSON.stringify(err)));
      }
    }
  ),

  defineAction({
    name: "delete-file",
    description: "Delete a file",
    parameters: {
      path: {
        description: "The path of the file to delete",
      },
    },
  }).withHandler(
    async ({
      parameters: { path },
      context: { sourceAgentId },
      sendMessage,
    }) => {
      if (!checkPath(sourceAgentId, path, sendMessage)) return;

      try {
        await unlink(path);
        sendMessage(
          messageBuilder.standard(sourceAgentId, `Deleted ${path}.`)
        );
      } catch (err) {
        sendMessage(messageBuilder.error(sourceAgentId, JSON.stringify(err)));
      }
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