import Mercury from "@postlight/mercury-parser";
import { google } from "googleapis";
import { defineModule } from "../define-module";
import { messageBuilder } from "../../message";

const customsearch = google.customsearch("v1");

export default defineModule({
  name: "web",
}).with({
  actions: {
    searchWeb: {
      description: "Search the web.",
      parameters: {
        searchString: {
          description: "The string to search for",
        },
      },
      async execute({
        parameters: { searchString },
        context: { agentId },
        sendMessage,
      }) {
        const { data } = await customsearch.cse.list({
          q: searchString,
          cx: "e6c81ccb847b94ae1",
          key: process.env.GOOGLE_API_KEY,
        });

        if (!data.items) {
          return sendMessage(
            messageBuilder.ok(agentId, "Search returned no results.")
          );
        }

        sendMessage(
          messageBuilder.ok(
            agentId,
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
        context: { agentId },
        sendMessage,
      }) {
        try {
          const extractedData = await Mercury.parse(url);

          const result: any = extractedData;
          if (result.error) throw Error(result.message);

          sendMessage(
            messageBuilder.ok(
              agentId,
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
              agentId,
              `Error extracting content from ${url}: ${e.message}`
            )
          );
        }
      },
    },
  },
});
