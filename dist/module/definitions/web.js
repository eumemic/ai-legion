"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPageSummary = exports.getSearchResults = void 0;
const googleapis_1 = require("googleapis");
const puppeteer_1 = __importDefault(require("puppeteer"));
const turndown_1 = __importDefault(require("turndown"));
const message_1 = require("../../message");
const openai_1 = require("../../services/openai");
const parameters_1 = require("../../parameters");
const util_1 = require("../../utils/util");
const define_module_1 = require("../define-module");
exports.default = (0, define_module_1.defineModule)({
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
            async execute({ parameters: { searchString }, context: { agentId }, sendMessage, }) {
                const items = await getSearchResults(searchString);
                if (!items) {
                    return sendMessage(message_1.messageBuilder.ok(agentId, "Search returned no results."));
                }
                sendMessage(message_1.messageBuilder.ok(agentId, `Search results:\n\n${items
                    .map((item) => `- Title: "${item.title}"\n  URL: ${item.link}`)
                    .join("\n\n")}`));
            },
        },
        readPage: {
            description: "View a markdown summary of a web page.",
            parameters: {
                url: {
                    description: "The URL of the web page to read",
                },
            },
            async execute({ parameters: { url }, context: { agentId }, sendMessage, }) {
                try {
                    const maxCompletionTokens = openai_1.contextWindowSize[parameters_1.model] / 4;
                    // console.log({ maxCompletionTokens });
                    const pageSummary = await getPageSummary(parameters_1.model, maxCompletionTokens, url);
                    sendMessage(message_1.messageBuilder.ok(agentId, `Here is a summarized markdown version of the page, in a series of summarized chunks:\n\n${pageSummary}`));
                }
                catch (e) {
                    sendMessage(message_1.messageBuilder.error(agentId, `Error extracting content from ${url}: ${e.message}`));
                }
            },
        },
    },
});
async function getSearchResults(searchString) {
    const { data } = await googleapis_1.google.customsearch("v1").cse.list({
        q: searchString,
        cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
        key: process.env.GOOGLE_API_KEY,
    });
    return data.items;
}
exports.getSearchResults = getSearchResults;
async function getPageSummary(model, maxSummaryTokens, url) {
    const maxCompletionTokens = Math.round(openai_1.contextWindowSize[model] * 0.9);
    console.log("Initializing...");
    const browser = await puppeteer_1.default.launch();
    const page = await browser.newPage();
    const turndownService = new turndown_1.default().addRule("remove-extraneous-tags", {
        filter: ["style", "script", "img"],
        replacement: () => "",
    });
    console.log(`Reading page at ${url}...`);
    await page.goto(url);
    const htmlContent = await page.content();
    // console.log(htmlContent);
    console.log(`HTML tokens: ${(0, util_1.countTokens)(htmlContent)}`);
    turndownService.remove(["style", "script"]);
    const markdownContent = turndownService
        .turndown(htmlContent)
        .replace(/\\_/g, "_");
    const markdownTokens = (0, util_1.countTokens)(markdownContent);
    console.log(`Markdown tokens: ${markdownTokens}`);
    const chunks = [];
    let currentChunkLines = [];
    let currentChunkTokens = 0;
    for (const line of markdownContent.split("\n")) {
        const lineTokens = (0, util_1.countTokens)(line);
        if (currentChunkTokens + lineTokens > maxCompletionTokens) {
            chunks.push(currentChunkLines.join("\n"));
            currentChunkLines = [];
            currentChunkTokens = 0;
        }
        currentChunkLines.push(line);
        currentChunkTokens += lineTokens;
    }
    let lastChunk = currentChunkLines.join("\n");
    if ((0, util_1.countTokens)(lastChunk) > maxCompletionTokens) {
        const characterLimit = Math.round(maxCompletionTokens * util_1.AVG_CHARACTERS_PER_TOKEN);
        console.log(`Truncating final chunk at ${characterLimit} characters:\n\n${lastChunk}`);
        lastChunk = lastChunk.substring(0, characterLimit);
    }
    chunks.push(lastChunk);
    // console.log(
    //   chunks
    //     .map((chunk) => `CHUNK (${countTokens(chunk)}):\n\n${chunk}\n\n`)
    //     .join("")
    // );
    console.log(`Total chunks: ${chunks.length} (${Math.round(markdownTokens / chunks.length)} tokens per chunk)`);
    const maxChunkSummaryTokens = Math.round(maxSummaryTokens / chunks.length);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const maxChunkSummaryWords = Math.round(maxChunkSummaryTokens * util_1.AVG_WORDS_PER_TOKEN);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const maxChunkSummaryCharacters = Math.round(maxChunkSummaryTokens * util_1.AVG_CHARACTERS_PER_TOKEN);
    // const summaryLimitText = `${maxChunkSummaryWords} words`;
    const chunkSummaryLimitText = `${maxChunkSummaryCharacters} characters`;
    console.log(`Max tokens per chunk summary: ${maxChunkSummaryTokens} (${chunkSummaryLimitText})`);
    console.log("Summarizing chunks...");
    const summarizedChunks = await Promise.all(chunks.map(async (chunk) => (0, openai_1.createChatCompletion)({
        model,
        messages: [
            {
                role: "user",
                content: `Modify the following markdown excerpt only as much as necessary to bring it under a maximum of ${chunkSummaryLimitText}, preserving the most essential information. In particular, try to preserve links (example: \`[my special link](https://foo.bar/baz/)\`). Write this in the same voice as the original text; do not speak in the voice of someone who is describing it to someone else. For instance, don't use phrases like "The article talks about...". Excerpt to summarize follows:\n\n=============\n\n${chunk}`,
            },
        ],
    })));
    const summary = summarizedChunks
        .map((chunk) => `=== SUMMARIZED CHUNK (${(0, util_1.countTokens)(chunk)} tokens) ===\n\n${chunk}\n\n`)
        .join("");
    // console.log(`Summary:\n\n${summary}\n`);
    console.log(`Summary tokens: ${(0, util_1.countTokens)(summary)}`);
    await browser.close();
    return summary;
}
exports.getPageSummary = getPageSummary;
