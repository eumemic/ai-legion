import { memoize } from "lodash";
import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";
import { Memento } from "./memory";
import { Message } from "./message";
import TaskQueue from "./task-queue";
import { agentName, messageSourceName, sleep } from "./util";

const openaiDelay = 10 * 1000;

const taskQueue = new TaskQueue();

type ModelName = "gpt-3.5-turbo" | "gpt-4";

const model: ModelName = "gpt-3.5-turbo";
// const model: ModelName = "gpt-4";

export default function generateText(agentId: string, mementos: Memento[]) {
  const result = taskQueue.run(async () => {
    console.log(
      `Agent ${agentId} reflecting on ${mementos.length} mementos...`
    );
    const t0 = Date.now();
    const result = await openai().createChatCompletion({
      model,
      messages: mementos.map(toOpenAiMessage),
    });
    console.log(
      `Agent ${agentId} decided on an action after ${(
        (Date.now() - t0) /
        1000
      ).toFixed(1)}s`
    );
    return result;
  });

  // avoid rate limits
  if (model === "gpt-4")
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

function toOpenAiMessage(memento: Memento): ChatCompletionRequestMessage {
  if (memento.type === "message") {
    const { source, content } = memento.message;
    const role = source.type === "system" ? "system" : "user";
    return {
      role,
      content,
    };
  } else {
    return {
      role: "assistant",
      content: memento.actionText,
    };
  }
}
