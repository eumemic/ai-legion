import { defineAction } from "../action-definition";
import { messageBuilder } from "../../message";

const notes = new Map();

const actions = [
  defineAction({
    name: "create-or-update-note",
    description:
      "Create a new note if it doesn't exist, or update the content of an existing note. Parameters: title (the title of the note), content (text content of the note).",
    parameters: {
      title: {
        description: "The title of the note",
      },
      content: {
        description: "The content of the note",
      },
    },
  }).withHandler(
    async ({
      parameters: { title, content },
      context: { sourceAgentId },
      sendMessage,
    }) => {
      notes.set(title, content);
      sendMessage(
        messageBuilder.standard(
          sourceAgentId,
          `Note "${title}" has been created or updated successfully.`
        )
      );
    }
  ),

  defineAction({
    name: "view-note",
    description:
      "Display the content of a note. Parameter: title (the title of the note to view).",
    parameters: {
      title: {
        description: "The title of the note to view",
      },
    },
  }).withHandler(
    async ({
      parameters: { title },
      context: { sourceAgentId },
      sendMessage,
    }) => {
      const content = notes.get(title);
      if (content) {
        sendMessage(
          messageBuilder.standard(
            sourceAgentId,
            `Content of "${title}":\n\n${content}`
          )
        );
      } else {
        sendMessage(
          messageBuilder.error(sourceAgentId, `Note "${title}" not found.`)
        );
      }
    }
  ),

  defineAction({
    name: "list-notes",
    description: "List the titles of all existing notes.",
  }).withHandler(async ({ context: { sourceAgentId }, sendMessage }) => {
    const noteTitles = Array.from(notes.keys());
    sendMessage(
      messageBuilder.standard(
        sourceAgentId,
        noteTitles.length
          ? `List of note titles:\n\n${noteTitles
              .map((title) => `- ${title}`)
              .join("\n")}`
          : "Your have no notes currently."
      )
    );
  }),

  defineAction({
    name: "delete-note",
    description:
      "Delete a note. Parameter: title (the title of the note to delete).",
    parameters: {
      title: {
        description: "The title of the note to delete",
      },
    },
  }).withHandler(
    async ({
      parameters: { title },
      context: { sourceAgentId },
      sendMessage,
    }) => {
      if (notes.has(title)) {
        notes.delete(title);
        sendMessage(
          messageBuilder.standard(sourceAgentId, `Deleted note "${title}".`)
        );
      } else {
        sendMessage(
          messageBuilder.error(sourceAgentId, `Note "${title}" not found.`)
        );
      }
    }
  ),
];

export default actions;
