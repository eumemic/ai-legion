import { messageBuilder } from "../../message";
import { Store } from "../../store";
import { FileStore } from "../../store/file-store";
import { defineAction } from "../action-definition";
import { defineActionModule } from "../action-module";

export default defineActionModule<Store>({
  name: "note",
  createState: ({ agentId }) => new FileStore([agentId, "notes"]),
  actions: [
    defineAction({
      name: "create-or-update-note",
      description:
        "Create a new note if it doesn't exist, or update the content of an existing note.",
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
        context: { sourceAgentId, state },
        sendMessage,
      }) => {
        await state.set(title, content);
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
      description: "Display the content of a note.",
      parameters: {
        title: {
          description: "The title of the note to view",
        },
      },
    }).withHandler(
      async ({
        parameters: { title },
        context: { sourceAgentId, state },
        sendMessage,
      }) => {
        const content = await state.get(title);
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
    }).withHandler(
      async ({ context: { sourceAgentId, state }, sendMessage }) => {
        const noteTitles = await state.list();
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
      }
    ),

    defineAction({
      name: "delete-note",
      description: "Delete a note.",
      parameters: {
        title: {
          description: "The title of the note to delete",
        },
      },
    }).withHandler(
      async ({
        parameters: { title },
        context: { sourceAgentId, state },
        sendMessage,
      }) => {
        if (await state.delete(title)) {
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
  ],
});
