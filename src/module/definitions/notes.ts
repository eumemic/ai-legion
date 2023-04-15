import { defineModule } from "../define-module";
import { messageBuilder } from "../../message";
import { Store } from "../../interfaces/store";
import FileStore from "../../store/factories/file-store";

export default defineModule<Store>({
  name: "notes",
  createState: ({ agentId }) => new FileStore([agentId, "notes"]),
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
      async execute({
        parameters: { title, content },
        context: { agentId, state },
        sendMessage,
      }) {
        await state.set(title, content);
        sendMessage(
          messageBuilder.ok(
            agentId,
            `Note "${title}" has been written successfully.`
          )
        );
      },
    },

    viewNote: {
      description: "Display the content of a note.",
      parameters: {
        title: {
          description: "The title of the note to view",
        },
      },
      async execute({
        parameters: { title },
        context: { agentId, state },
        sendMessage,
      }) {
        const content = await state.get(title);
        if (content) {
          sendMessage(
            messageBuilder.ok(agentId, `Content of "${title}":\n\n${content}`)
          );
        } else {
          sendMessage(
            messageBuilder.error(agentId, `Note "${title}" not found.`)
          );
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
      async execute({
        parameters: { title },
        context: { agentId, state },
        sendMessage,
      }) {
        if (await state.delete(title)) {
          sendMessage(messageBuilder.ok(agentId, `Deleted note "${title}".`));
        } else {
          sendMessage(
            messageBuilder.error(agentId, `Note "${title}" not found.`)
          );
        }
      },
    },
  },
});
