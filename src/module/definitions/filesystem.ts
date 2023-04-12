import {
  readFile,
  readdir,
  rename,
  stat,
  unlink,
  writeFile,
  mkdir
} from "fs/promises";
import { join as joinPath, resolve as resolvePath } from "path";
import { defineModule } from "../define-module";
import { messageBuilder } from "../../message";

export default defineModule({
  name: "filesystem",
}).with({
  actions: {
    listDirectory: {
      description: "Inspect the contents of a particular directory",
      parameters: {
        path: {
          description: "The path of the directory you want to inspect",
        },
      },
      async execute({
        parameters: { path },
        context: { agentId },
        sendMessage,
      }) {
        if (!checkPath(agentId, path, sendMessage)) return;

        try {
          const files = await readdir(path);
          const filesWithStatsPromises = files.map(async (file) => {
            const stats = await stat(joinPath(path, file));
            return `${file} ${stats.isDirectory() ? "[directory]" : "[file]"}`;
          });
          const filesWithStats = await Promise.all(filesWithStatsPromises);
          sendMessage(
            messageBuilder.ok(
              agentId,
              `Here are the contents of ${path}:\n${filesWithStats.join("\n")}`
            )
          );
        } catch (err) {
          sendMessage(messageBuilder.error(agentId, JSON.stringify(err)));
        }
      },
    },

    readFile: {
      description: "Read the contents of a particular file",
      parameters: {
        path: {
          description: "The path of the file you want to inspect",
        },
      },
      async execute({
        parameters: { path },
        context: { agentId },
        sendMessage,
      }) {
        if (!checkPath(agentId, path, sendMessage)) return;

        try {
          const data = await readFile(path, "utf8");
          sendMessage(
            messageBuilder.ok(agentId, `Contents of ${path}:\n\n${data}`)
          );
        } catch (err) {
          sendMessage(messageBuilder.error(agentId, JSON.stringify(err)));
        }
      },
    },

    writeFile: {
      description: "Write the contents of a particular file",
      parameters: {
        path: {
          description: "The path of the file you want to write to",
        },
        content: {
          description: "The new content of the file",
        },
      },
      async execute({
        parameters: { path, content },
        context: { agentId },
        sendMessage,
      }) {
        if (!checkPath(agentId, path, sendMessage)) return;

        try {
          await writeFile(path, content, "utf8");
          sendMessage(messageBuilder.ok(agentId, `Wrote to ${path}.`));
        } catch (err) {
          sendMessage(messageBuilder.error(agentId, JSON.stringify(err)));
        }
      },
    },

    moveFile: {
      description: "Move a file to a new location",
      parameters: {
        sourcePath: {
          description: "The original path of the file",
        },
        destinationPath: {
          description: "The new path for the file",
        },
      },
      async execute({
        parameters: { sourcePath, destinationPath },
        context: { agentId },
        sendMessage,
      }) {
        if (!checkPath(agentId, sourcePath, sendMessage)) return;
        if (!checkPath(agentId, destinationPath, sendMessage)) return;

        try {
          await rename(sourcePath, destinationPath);
          sendMessage(
            messageBuilder.ok(
              agentId,
              `Moved ${sourcePath} to ${destinationPath}.`
            )
          );
        } catch (err) {
          sendMessage(messageBuilder.error(agentId, JSON.stringify(err)));
        }
      },
    },

    deleteFile: {
      description: "Delete a file",
      parameters: {
        path: {
          description: "The path of the file to delete",
        },
      },
      async execute({
        parameters: { path },
        context: { agentId },
        sendMessage,
      }) {
        if (!checkPath(agentId, path, sendMessage)) return;

        try {
          await unlink(path);
          sendMessage(messageBuilder.ok(agentId, `Deleted ${path}.`));
        } catch (err) {
          sendMessage(messageBuilder.error(agentId, JSON.stringify(err)));
        }
      },
    },
    createDirectory: {
      description: "Create a new directory",
      parameters: {
        path: {
          description: "The path of the directory to create",
        },
      },
      async execute({
        parameters: { path },
        context: { agentId },
        sendMessage,
      }) {
        if (!checkPath(agentId, path, sendMessage)) return;

        try {
          await mkdir(path);
          sendMessage(messageBuilder.ok(agentId, `Created directory ${path}.`));
        } catch (err) {
          sendMessage(messageBuilder.error(agentId, JSON.stringify(err)));
        }
      },
    },
  },
});

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
