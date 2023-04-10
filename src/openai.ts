import { memoize } from "lodash";
import { Configuration, OpenAIApi } from "openai";
import { Message } from "./message";
import TaskQueue from "./task-queue";
import { sleep } from "./util";

const taskQueue = new TaskQueue();

export default function generateText(messages: Message[]) {
  return taskQueue.run(async () => {
    console.log(`sending ${messages.length} messages`);
    try {
      const result = await openai().createChatCompletion({
        model: "gpt-3.5-turbo",
        // model: "gpt-4",
        messages: messages.map((m) => m.openaiMessage),
      });
      console.log("received result");
      return result;
    } finally {
      await sleep(5000); // avoid rate limits
    }
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
