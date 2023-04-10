import { google } from "googleapis";
import puppeteer from "puppeteer";
import TurndownService from "turndown";
import { messageBuilder } from "../../message";
import { GPT_3_5_TURBO, createChatCompletion } from "../../openai";
import {
  AVG_CHARACTERS_PER_TOKEN,
  AVG_WORDS_PER_TOKEN,
  countTokens,
} from "../../util";
import { defineModule } from "../define-module";

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
      description: "View a markdown summary of a web page.",
      parameters: {
        url: {
          description: "The URL of the web page to read",
        },
      },
      async execute({
        parameters: { url },
        context: { agentId },
        sendMessage,
      }) {
        try {
          const pageSummary = await getPageSummary(GPT_3_5_TURBO, 2000, url);

          sendMessage(
            messageBuilder.ok(
              agentId,
              `Here is a summarized markdown version of the page:\n\n${pageSummary}`
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

export async function getPageSummary(
  model: string,
  maxCompletionTokens: number,
  url: string
) {
  console.log("Initializing...");

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const turndownService = new TurndownService().remove(["style", "script"]);

  console.log("Reading page...");

  await page.goto(url);

  const htmlContent = await page.content();
  console.log(`HTML tokens: ${countTokens(htmlContent)}`);

  turndownService.remove(["style", "script"]);
  const markdownContent = turndownService
    .turndown(htmlContent)
    .replace(/\\_/g, "_");

  const markdownTokens = countTokens(markdownContent);
  console.log(`Markdown tokens: ${markdownTokens}`);

  const chunks: string[] = [];
  let currentChunkLines: string[] = [];
  let currentChunkTokens = 0;
  for (const line of markdownContent.split("\n")) {
    currentChunkLines.push(line);
    currentChunkTokens += countTokens(line);
    if (currentChunkTokens > maxCompletionTokens) {
      chunks.push(currentChunkLines.join("\n"));
      currentChunkLines = [];
      currentChunkTokens = 0;
    }
  }
  chunks.push(currentChunkLines.join("\n"));

  // console.log(
  //   chunks
  //     .map((chunk) => `CHUNK (${countTokens(chunk)}):\n\n${chunk}\n\n`)
  //     .join("")
  // );
  console.log(
    `Total chunks: ${chunks.length} (${Math.round(
      markdownTokens / chunks.length
    )} tokens per chunk)`
  );

  const maxSummaryTokens = Math.round(maxCompletionTokens / chunks.length);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const maxSummaryWords = Math.round(maxSummaryTokens * AVG_WORDS_PER_TOKEN);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const maxSummaryCharacters = Math.round(
    maxSummaryTokens * AVG_CHARACTERS_PER_TOKEN
  );

  // const summaryLimitText = `${maxSummaryWords} words`;
  const summaryLimitText = `${maxSummaryCharacters} characters`;

  console.log(`Max summary tokens: ${maxSummaryTokens} (${summaryLimitText})`);
  console.log("Summarizing chunks...");

  const summarizedChunks = await Promise.all(
    chunks.map(async (chunk) => {
      const {
        choices: [{ message }],
      } = await createChatCompletion({
        model,
        messages: [
          {
            role: "user",
            content: `Modify the following markdown excerpt only as much as necessary to bring it under a maximum of ${summaryLimitText}, preserving the most essential information. In particular, try to preserve links (example: \`[my special link](https://foo.bar/baz/)\`). Write this in the same voice as the original text; do not speak in the voice of someone who is describing it to someone else. For instance, don't use phrases like "The article talks about...". Excerpt to summarize follows:\n\n=============\n\n${chunk}`,
          },
        ],
      });

      return message?.content || "";
    })
  );

  // console.log(
  //   summarizedChunks
  //     .map(
  //       (chunk) =>
  //         `=== SUMMARIZED CHUNK (${countTokens(chunk)}) ===\n\n${chunk}\n\n`
  //     )
  //     .join("")
  // );

  const summary = summarizedChunks.join("\n");

  console.log(`Summary:\n\n${summary}\n`);

  console.log(`Summary tokens: ${countTokens(summary)}`);

  await browser.close();

  return summary;
}
