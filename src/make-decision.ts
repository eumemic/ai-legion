import { memoize } from "lodash";
import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";
import { Event } from "./memory";
import { Model, createChatCompletion } from "./openai";
import TaskQueue from "./task-queue";
import { agentName, messageSourceName, sleep } from "./util";
import { model } from "./parameters";

const openaiDelay = 10 * 1000;

const taskQueue = new TaskQueue();

const enumerateEventsInSummaries = false;

export interface Decision {
  actionText: string;
}

export default function makeDecision(
  agentId: string,
  events: Event[]
): Promise<Decision> {
  const name = agentName(agentId);
  const decisionPromise = taskQueue.run(async (): Promise<Decision> => {
    console.log(`${name} reflecting on ${events.length} events...`);
    const t0 = Date.now();

    const data = await createChatCompletion({
      model,
      messages: events.map(toOpenAiMessage),
    });

    console.log(
      `${name} arrived at a decision after ${((Date.now() - t0) / 1000).toFixed(
        1
      )}s`
    );

    const actionText = data.choices[0].message!.content;

    return { actionText };
  });

  // avoid rate limits
  if (model === "gpt-4")
    decisionPromise.finally(() => taskQueue.run(() => sleep(openaiDelay)));

  return decisionPromise;
}

// lazy load to avoid accessing OPENAI_API_KEY before env has been loaded
const openai = memoize(() => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw Error("OPENAI_API_KEY is not configured!");

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  return new OpenAIApi(configuration);
});

export function toOpenAiMessage(event: Event): ChatCompletionRequestMessage {
  switch (event.type) {
    case "message":
      let { type: messageType, source, content } = event.message;
      const role = source.type === "system" ? "system" : "user";
      let header: string;
      switch (messageType) {
        case "standard":
        case "agentToAgent":
          header = `MESSAGE FROM ${messageSourceName(source).toUpperCase()}`;
          break;
        case "error":
          header = "ERROR";
          break;
      }
      return {
        role,
        content: `--- ${header} ---\n\n${content}`,
      };
    case "decision":
      return {
        role: "assistant",
        content: event.decision.actionText,
      };
    case "summary":
      const { summary, summarizedEvents } = event;
      const summarizedContent = `
${
  summarizedEvents.length
} events are abridged here to free up real estate in your context window.

SUMMARY: ${summary}

${
  enumerateEventsInSummaries
    ? `EVENTS:
${summarizedEvents
  .map((event, index) => `${index + 1}) ${summarize(event)}`)
  .join("\n")}`
    : ""
}
`.trim();
      // console.log(`summarized content:\n${summarizedContent}`);
      return {
        role: "system",
        content: summarizedContent,
      };
  }
}

export function summarize(event: Event) {
  let header: string;
  let content: string;
  switch (event.type) {
    case "message":
      const { message } = event;
      switch (message.type) {
        case "standard":
        case "agentToAgent":
          header = `MESSAGE FROM ${messageSourceName(
            message.source
          ).toUpperCase()}`;
          break;
        case "error":
          header = "ERROR";
          break;
      }
      content = message.content;
      break;
    case "decision":
      header = "ACTION";
      content = event.decision.actionText;
      break;
    case "summary":
      header = `SUMMARY (${event.summarizedEvents.length} EVENTS)`;
      content = event.summary;
      break;
  }
  return `${header}\n\n${truncate(content)}\n`;
}

function truncate(text: string) {
  const limit = 50;
  const lines = text.split("\n");
  const firstLine = lines[0];
  if (firstLine.length > limit) return `${text.substring(0, limit)}...`;
  if (lines.length > 1) return `${firstLine}\n...`;
  return text;
}
