import { google } from "googleapis";
import { messageBuilder } from "../../message";
import { defineActionModule } from "../action-module";

const customsearch = google.customsearch("v1");

export default defineActionModule({
  name: "web",
}).withActions({
  searchWeb: {
    description: "Search the web.",
    parameters: {
      searchString: {
        description: "The string to search for",
      },
    },
    async execute({
      parameters: { searchString },
      context: { sourceAgentId },
      sendMessage,
    }) {
      const { data } = await customsearch.cse.list({
        q: searchString,
        cx: "e6c81ccb847b94ae1",
        key: process.env.GOOGLE_API_KEY,
      });

      if (!data.items) {
        return sendMessage(
          messageBuilder.ok(sourceAgentId, "Search returned no results.")
        );
      }

      sendMessage(
        messageBuilder.ok(
          sourceAgentId,
          `Search results:\n\n${data.items
            .map((item) => `- Title: "${item.title}"\n  URL: ${item.link}`)
            .join("\n\n")}`
        )
      );
    },
  },
});
