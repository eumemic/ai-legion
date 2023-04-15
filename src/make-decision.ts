import { ChatCompletionRequestMessage } from "openai";
import { Event } from "./memory";
import { createChatCompletion } from "./openai";
import { model } from "./parameters";
import TaskQueue from "./task-queue";
import { messageSourceName, sleep } from "./util";

const openaiDelay = 10 * 1000;

const taskQueue = new TaskQueue();

export default function makeDecision(events: Event[]): Promise<string> {
  const decisionPromise = taskQueue.run(async (): Promise<string> => {
    console.log(`Reflecting on ${events.length} events...`);
    const t0 = Date.now();

    const messages = events.map(toOpenAiMessage);

    // console.log(JSON.stringify(messages, null, 2));
    const temperature = 0.0;

    const responseContent = await createChatCompletion({
      model,
      messages,
      temperature,
    });

    console.log(
      `Arrived at a decision after ${((Date.now() - t0) / 1000).toFixed(1)}s`
    );

    return responseContent;
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
          header = "";
          break;
        case "agentToAgent":
          header = `--- MESSAGE FROM ${messageSourceName(
            source
          ).toUpperCase()} ---\n\n`;
          break;
        case "error":
          header = "--- ERROR ---\n\n";
          break;
      }
      return {
        role,
        content: `${header}${content}`,
      };
    }
    case "decision":
      return {
        role: "assistant",
        content: event.actionText,
      };
  }
}
