import { AxiosError } from "axios";
import { memoize } from "lodash";
import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";
import { Memento } from "./memory";
import { model } from "./parameters";
import TaskQueue from "./task-queue";
import { agentName, sleep } from "./util";

const openaiDelay = 10 * 1000;

const taskQueue = new TaskQueue();

export default function makeDecision(agentId: string, mementos: Memento[]) {
  const name = agentName(agentId);
  const result = taskQueue.run(async () => {
    console.log(`${name} reflecting on ${mementos.length} mementos...`);
    const t0 = Date.now();
    try {
      const response = await openai().createChatCompletion({
        model,
        messages: mementos.map(toOpenAiMessage),
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
      console.log({ usage: data.usage?.total_tokens });
      const actionText = data.choices[0].message?.content;
      if (!actionText) console.error("no content received");

      return actionText;
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
