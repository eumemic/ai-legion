import { google } from 'googleapis';
import puppeteer from 'puppeteer';
import TurndownService from 'turndown';
import { messageBuilder } from '../../message';
import { Model, contextWindowSize, createChatCompletion } from '../../openai';
import { model } from '../../parameters';
import {
  AVG_CHARACTERS_PER_TOKEN,
  AVG_WORDS_PER_TOKEN,
  countTokens
} from '../../util';
import { defineModule } from '../define-module';

export default defineModule({
  name: 'web'
}).with({
  actions: {
    searchWeb: {
      description: 'Search the web.',
      parameters: {
        searchString: {
          description: 'The string to search for'
        }
      },
      async execute({
        parameters: { searchString },
        context: { agentId },
        sendMessage
      }) {
        const items = await getSearchResults(searchString);

        if (!items) {
          return sendMessage(
            messageBuilder.ok(agentId, 'Search returned no results.')
          );
        }

        sendMessage(
          messageBuilder.ok(
            agentId,
            `Search results:\n\n${items
              .map((item) => `- Title: "${item.title}"\n  URL: ${item.link}`)
              .join('\n\n')}`
          )
        );
      }
    },

    readPage: {
      description: 'View a markdown summary of a web page.',
      parameters: {
        url: {
          description: 'The URL of the web page to read'
        }
      },
      async execute({
        parameters: { url },
        context: { agentId },
        sendMessage
      }) {
        try {
          const maxCompletionTokens = contextWindowSize[model] / 4;
          // console.log({ maxCompletionTokens });
          const pageSummary = await getPageSummary(
            model,
            maxCompletionTokens,
            url
          );

          sendMessage(
            messageBuilder.ok(
              agentId,
              `Here is a summarized markdown version of the page, in a series of summarized chunks:\n\n${pageSummary}`
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
      }
    }
  }
});

export async function getSearchResults(searchString: string) {
  const { data } = await google.customsearch('v1').cse.list({
    q: searchString,
    cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
    key: process.env.GOOGLE_API_KEY
  });
  return data.items;
}

export async function getPageSummary(
  model: Model,
  maxSummaryTokens: number,
  url: string
) {
  const maxCompletionTokens = Math.round(contextWindowSize[model] * 0.9);

  console.log('Initializing...');

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const turndownService = new TurndownService().addRule(
    'remove-extraneous-tags',
    {
      filter: ['style', 'script', 'img'],
      replacement: () => ''
    }
  );
  console.log(`Reading page at ${url}...`);

  await page.goto(url);

  const htmlContent = await page.content();
  // console.log(htmlContent);
  console.log(`HTML tokens: ${countTokens(htmlContent)}`);

  turndownService.remove(['style', 'script']);
  const markdownContent = turndownService
    .turndown(htmlContent)
    .replace(/\\_/g, '_');

  const markdownTokens = countTokens(markdownContent);
  console.log(`Markdown tokens: ${markdownTokens}`);

  const chunks: string[] = [];
  let currentChunkLines: string[] = [];
  let currentChunkTokens = 0;
  for (const line of markdownContent.split('\n')) {
    const lineTokens = countTokens(line);
    if (currentChunkTokens + lineTokens > maxCompletionTokens) {
      chunks.push(currentChunkLines.join('\n'));
      currentChunkLines = [];
      currentChunkTokens = 0;
    }
    currentChunkLines.push(line);
    currentChunkTokens += lineTokens;
  }

  let lastChunk = currentChunkLines.join('\n');
  if (countTokens(lastChunk) > maxCompletionTokens) {
    const characterLimit = Math.round(
      maxCompletionTokens * AVG_CHARACTERS_PER_TOKEN
    );
    console.log(
      `Truncating final chunk at ${characterLimit} characters:\n\n${lastChunk}`
    );
    lastChunk = lastChunk.substring(0, characterLimit);
  }
  chunks.push(lastChunk);

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

  const maxChunkSummaryTokens = Math.round(maxSummaryTokens / chunks.length);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const maxChunkSummaryWords = Math.round(
    maxChunkSummaryTokens * AVG_WORDS_PER_TOKEN
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const maxChunkSummaryCharacters = Math.round(
    maxChunkSummaryTokens * AVG_CHARACTERS_PER_TOKEN
  );

  // const summaryLimitText = `${maxChunkSummaryWords} words`;
  const chunkSummaryLimitText = `${maxChunkSummaryCharacters} characters`;

  console.log(
    `Max tokens per chunk summary: ${maxChunkSummaryTokens} (${chunkSummaryLimitText})`
  );
  console.log('Summarizing chunks...');

  const summarizedChunks = await Promise.all(
    chunks.map(async (chunk) =>
      createChatCompletion({
        model,
        messages: [
          {
            role: 'user',
            content: `Modify the following markdown excerpt only as much as necessary to bring it under a maximum of ${chunkSummaryLimitText}, preserving the most essential information. In particular, try to preserve links (example: \`[my special link](https://foo.bar/baz/)\`). Write this in the same voice as the original text; do not speak in the voice of someone who is describing it to someone else. For instance, don't use phrases like "The article talks about...". Excerpt to summarize follows:\n\n=============\n\n${chunk}`
          }
        ]
      })
    )
  );

  const summary = summarizedChunks
    .map(
      (chunk) =>
        `=== SUMMARIZED CHUNK (${countTokens(
          chunk
        )} tokens) ===\n\n${chunk}\n\n`
    )
    .join('');

  // console.log(`Summary:\n\n${summary}\n`);

  console.log(`Summary tokens: ${countTokens(summary)}`);

  await browser.close();

  return summary;
}
