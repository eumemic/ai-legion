import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";
import { memoize } from "lodash";

export default async function generateText(
  messages: ChatCompletionRequestMessage[]
) {
  return openai().createChatCompletion({
    model: "gpt-3.5-turbo",
    // model: "gpt-4",
    messages: messages,
  });
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
