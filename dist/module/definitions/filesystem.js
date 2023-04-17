"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("fs/promises");
const path_1 = require("path");
const define_module_1 = require("../define-module");
const message_1 = require("../../message");
exports.default = (0, define_module_1.defineModule)({
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
            async execute({ parameters: { path }, context: { agentId }, sendMessage, }) {
                if (!checkPath(agentId, path, sendMessage))
                    return;
                try {
                    const files = await (0, promises_1.readdir)(path);
                    const filesWithStatsPromises = files.map(async (file) => {
                        const stats = await (0, promises_1.stat)((0, path_1.join)(path, file));
                        return `${file} ${stats.isDirectory() ? "[directory]" : "[file]"}`;
                    });
                    const filesWithStats = await Promise.all(filesWithStatsPromises);
                    sendMessage(message_1.messageBuilder.ok(agentId, `Here are the contents of ${path}:\n${filesWithStats.join("\n")}`));
                }
                catch (err) {
                    sendMessage(message_1.messageBuilder.error(agentId, JSON.stringify(err)));
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
            async execute({ parameters: { path }, context: { agentId }, sendMessage, }) {
                if (!checkPath(agentId, path, sendMessage))
                    return;
                try {
                    const data = await (0, promises_1.readFile)(path, "utf8");
                    sendMessage(message_1.messageBuilder.ok(agentId, `Contents of ${path}:\n\n${data}`));
                }
                catch (err) {
                    sendMessage(message_1.messageBuilder.error(agentId, JSON.stringify(err)));
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
            async execute({ parameters: { path, content }, context: { agentId }, sendMessage, }) {
                if (!checkPath(agentId, path, sendMessage))
                    return;
                try {
                    await (0, promises_1.writeFile)(path, content, "utf8");
                    sendMessage(message_1.messageBuilder.ok(agentId, `Wrote to ${path}.`));
                }
                catch (err) {
                    sendMessage(message_1.messageBuilder.error(agentId, JSON.stringify(err)));
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
            async execute({ parameters: { sourcePath, destinationPath }, context: { agentId }, sendMessage, }) {
                if (!checkPath(agentId, sourcePath, sendMessage))
                    return;
                if (!checkPath(agentId, destinationPath, sendMessage))
                    return;
                try {
                    await (0, promises_1.rename)(sourcePath, destinationPath);
                    sendMessage(message_1.messageBuilder.ok(agentId, `Moved ${sourcePath} to ${destinationPath}.`));
                }
                catch (err) {
                    sendMessage(message_1.messageBuilder.error(agentId, JSON.stringify(err)));
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
            async execute({ parameters: { path }, context: { agentId }, sendMessage, }) {
                if (!checkPath(agentId, path, sendMessage))
                    return;
                try {
                    await (0, promises_1.unlink)(path);
                    sendMessage(message_1.messageBuilder.ok(agentId, `Deleted ${path}.`));
                }
                catch (err) {
                    sendMessage(message_1.messageBuilder.error(agentId, JSON.stringify(err)));
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
            async execute({ parameters: { path }, context: { agentId }, sendMessage, }) {
                if (!checkPath(agentId, path, sendMessage))
                    return;
                try {
                    await (0, promises_1.mkdir)(path);
                    sendMessage(message_1.messageBuilder.ok(agentId, `Created directory ${path}.`));
                }
                catch (err) {
                    sendMessage(message_1.messageBuilder.error(agentId, JSON.stringify(err)));
                }
            },
        },
    },
});
function checkPath(agentId, path, sendMessage) {
    const currentDirectory = process.cwd();
    const resolvedPath = (0, path_1.resolve)(path);
    if (!resolvedPath.startsWith(currentDirectory)) {
        sendMessage(message_1.messageBuilder.error(agentId, "Invalid path; must be within the current directory."));
        return false;
    }
    if (resolvedPath.includes(".git") || resolvedPath.includes("node_modules")) {
        sendMessage(message_1.messageBuilder.error(agentId, "That path is off-limits!"));
        return false;
    }
    return true;
}
