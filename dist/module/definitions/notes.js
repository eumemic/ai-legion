"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const define_module_1 = require("../define-module");
const message_1 = require("../../message");
const file_store_1 = __importDefault(require("../../store/file-store"));
exports.default = (0, define_module_1.defineModule)({
    name: "notes",
    createState: ({ agentId }) => new file_store_1.default([agentId, "notes"]),
}).with({
    async pinnedMessage({ state }) {
        const noteTitles = await state.getKeys();
        const currentNotes = noteTitles.length
            ? `Here are your current notes:\n\n${noteTitles
                .map((title) => `- "${title}"`)
                .join("\n")}`
            : "Your have no notes currently.";
        return `
You can manage your notes using the \`writeNote\`, \`viewNote\` and \`deleteNote\` actions. Use notes to keep track of any important information that you come across that may be of longterm interest. Because notes contain content in addition to a title, you can store larger thoughts here which might not fit into the text of a goal. Your notes list will always be pinned to the top of your context and won't be summarized away.

${currentNotes}
`.trim();
    },
    actions: {
        writeNote: {
            description: "Create or update a note which will only be visible to you.",
            parameters: {
                title: {
                    description: "The title of the note",
                },
                content: {
                    description: "The content of the note",
                },
            },
            async execute({ parameters: { title, content }, context: { agentId, state }, sendMessage, }) {
                await state.set(title, content);
                sendMessage(message_1.messageBuilder.ok(agentId, `Note "${title}" has been written successfully.`));
            },
        },
        viewNote: {
            description: "Display the content of a note.",
            parameters: {
                title: {
                    description: "The title of the note to view",
                },
            },
            async execute({ parameters: { title }, context: { agentId, state }, sendMessage, }) {
                const content = await state.get(title);
                if (content) {
                    sendMessage(message_1.messageBuilder.ok(agentId, `Content of "${title}":\n\n${content}`));
                }
                else {
                    sendMessage(message_1.messageBuilder.error(agentId, `Note "${title}" not found.`));
                }
            },
        },
        deleteNote: {
            description: "Delete a note.",
            parameters: {
                title: {
                    description: "The title of the note to delete",
                },
            },
            async execute({ parameters: { title }, context: { agentId, state }, sendMessage, }) {
                if (await state.delete(title)) {
                    sendMessage(message_1.messageBuilder.ok(agentId, `Deleted note "${title}".`));
                }
                else {
                    sendMessage(message_1.messageBuilder.error(agentId, `Note "${title}" not found.`));
                }
            },
        },
    },
});
