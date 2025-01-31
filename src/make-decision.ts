import { ChatCompletionRequestMessage } from "./types";
import { Event } from "./memory";
import { createChatCompletion } from "./openai";
import { model } from "./parameters";
import { messageSourceName } from "./util";

export default async function makeDecision(events: Event[]): Promise<string> {
  console.log(`Reflecting on ${events.length} events...`);
  const t0 = Date.now();

  const messages = events.map(toOpenAiMessage);

  const responseContent = await createChatCompletion({
    model,
    messages,
  });

  console.log(
    `Arrived at a decision after ${((Date.now() - t0) / 1000).toFixed(1)}s`
  );

  return responseContent;
}

// lazy load to avoid accessing OPENAI_API_KEY before env has been loaded
export function toOpenAiMessage(event: Event): ChatCompletionRequestMessage {
  switch (event.type) {
    case "message": {
      const { type: messageType, source, content } = event.message;
      const role = "user";
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
