import Mercury from "@postlight/mercury-parser";
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

  readPage: {
    description:
      "Extract content from a web page while preserving hyperlink details.",
    parameters: {
      url: {
        description: "The URL of the web page to read.",
      },
    },
    async execute({
      parameters: { url },
      context: { sourceAgentId },
      sendMessage,
    }) {
      try {
        const extractedData = await Mercury.parse(url);

        const result: any = extractedData;
        if (result.error) throw Error(result.message);

        sendMessage(
          messageBuilder.ok(
            sourceAgentId,
            `Title: ${extractedData.title || "Unknown"}\n\nAuthor: ${
              extractedData.author || "Unknown"
            }\n\nPublication Date: ${
              extractedData.date_published || "Unknown"
            }\n\nContent:\n\n${extractedData.content}`
          )
        );
      } catch (e: any) {
        sendMessage(
          messageBuilder.error(
            sourceAgentId,
            `Error extracting content from ${url}: ${e.message}`
          )
        );
      }
    },
  },
});
