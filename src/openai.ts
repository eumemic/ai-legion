import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";
import { memoize } from "lodash";
import { Message } from "./message";
import { sleep, sleepUntil } from "./util";

let isGenerating = false;
export default async function generateText(messages: Message[]) {
  await sleepUntil(() => {
    if (!isGenerating) {
      isGenerating = true;
      return true;
    }
    return false;
  });
  try {
    return openai().createChatCompletion({
      model: "gpt-3.5-turbo",
      // model: "gpt-4",
      messages: messages.map((m) => m.openaiMessage),
    });
  } finally {
    await sleep(5000); // avoid rate limits
    isGenerating = false;
  }
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
