import { ChatCompletionRequestMessage } from "openai";
import { Event } from "./memory";
import { createChatCompletion } from "./openai";
import { model } from "./parameters";
import TaskQueue from "./task-queue";
import { agentName, messageSourceName, sleep } from "./util";

const openaiDelay = 10 * 1000;

const taskQueue = new TaskQueue();

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
export function toOpenAiMessage(event: Event): ChatCompletionRequestMessage {
  switch (event.type) {
    case "message": {
      const { type: messageType, source, content } = event.message;
      const role = source.type === "system" ? "system" : "user";
      let header: string;
      switch (messageType) {
        case "spontaneous":
        case "ok":
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
    }
    case "decision":
      return {
        role: "assistant",
        content: event.decision.actionText,
      };
    case "summary": {
      const { summary } = event;
      const summarizedContent = `Several events are omitted here to free up space in your context window, summarized as follows:\n\n${summary}`;
      return {
        role: "system",
        content: summarizedContent,
      };
    }
  }
}
