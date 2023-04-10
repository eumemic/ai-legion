import { memoize } from "lodash";
import { Configuration, OpenAIApi } from "openai";
import { Message } from "./message";
import TaskQueue from "./task-queue";
import { sleep } from "./util";

const openaiDelay = 10 * 1000;

const taskQueue = new TaskQueue();

export default function generateText(agentId: string, messages: Message[]) {
  const result = taskQueue.run(async () => {
    // console.log(`Agent ${agentId} reflecting on ${messages.length} messages`);
    const result = await openai().createChatCompletion({
      model: "gpt-3.5-turbo",
      // model: "gpt-4",
      messages: messages.map((m) => m.openaiMessage),
    });
    // console.log(`Agent ${agentId} arrived at a response`);
    return result;
  });

  // avoid rate limits
  result.finally(() => taskQueue.run(() => sleep(openaiDelay)));

  return result;
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
