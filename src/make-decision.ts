import { AxiosError } from "axios";
import { memoize } from "lodash";
import {
  ChatCompletionRequestMessage,
  Configuration,
  CreateCompletionResponseUsage,
  OpenAIApi,
} from "openai";
import { Event } from "./memory";
import { model } from "./parameters";
import TaskQueue from "./task-queue";
import { agentName, sleep } from "./util";

const openaiDelay = 10 * 1000;

const taskQueue = new TaskQueue();

export interface Decision {
  actionText: string;
  precedingTokens: number;
}

export default function makeDecision(
  agentId: string,
  events: Event[]
): Promise<Decision | undefined> {
  const name = agentName(agentId);
  const decisionPromise = taskQueue.run(
    async (): Promise<Decision | undefined> => {
      console.log(`${name} reflecting on ${events.length} events...`);
      const t0 = Date.now();
      try {
        const response = await openai().createChatCompletion({
          model,
          messages: events.map(toOpenAiMessage),
        });

        console.log(
          `${name} arrived at a decision after ${(
            (Date.now() - t0) /
            1000
          ).toFixed(1)}s`
        );

        if (response.status !== 200) {
          console.error(`Non-200 status received: ${response.status}`);
          return;
        }

        const { data } = response;
        const actionText = data.choices[0].message?.content;
        if (!actionText) {
          console.error("no content received");
          return;
        }

        const precedingTokens = data.usage!.prompt_tokens;

        return { actionText, precedingTokens };
      } catch (e: any) {
        const { response }: AxiosError = e;
        switch (response?.status) {
          case 400:
            console.error(`ERROR: ${name}'s context window is full.`);
            break;
          case 429:
            console.error(`ERROR: ${name} was rate limited.`);
            break;
          default:
            console.error(e);
            break;
        }
      }
    }
  );

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
      const { source, content } = event.message;
      const role = source.type === "system" ? "system" : "user";
      return {
        role,
        content,
      };
    case "decision":
      return {
        role: "assistant",
        content: event.decision.actionText,
      };
    case "summary":
      const { summary, summarizedEvents } = event;
      return {
        role: "system",
        content: `
${
  summarizedEvents.length
} events are omitted here to free up real estate in your context window.

SUMMARY: ${summary}

EVENTS:
${summarizedEvents.map(
  (event, index) => `${index + 1}) ${truncate(toOpenAiMessage(event).content)}`
)}
`.trim(),
      };
  }
}

function truncate(text: string) {
  const limit = 100;
  if (text.length < limit) return text;
  return JSON.stringify(text.substring(0, limit) + " ...");
}
