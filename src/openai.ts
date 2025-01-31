import { AxiosError } from "axios";
import { memoize } from "lodash";
import OpenAI from "openai";
import { CreateChatCompletionRequest } from "./types";

export const GPT_3_5_TURBO = "gpt-3.5-turbo";
export const GPT_4 = "gpt-4";
export const GPT_4O = "gpt-4o";
export const GPT_O1_PREVIEW = "o1-preview";
export const GPT_O3_MINI = "o3-mini";

export const contextWindowSize = {
  [GPT_3_5_TURBO]: 4000,
  [GPT_4]: 8000,
  [GPT_4O]: 128000,
  [GPT_O1_PREVIEW]: 200000,
  [GPT_O3_MINI]: 200000,
};

export type Model =
  | typeof GPT_3_5_TURBO
  | typeof GPT_4
  | typeof GPT_4O
  | typeof GPT_O1_PREVIEW
  | typeof GPT_O3_MINI;

export async function createChatCompletion(
  request: CreateChatCompletionRequest
): Promise<string> {
  try {
    const response = await openai().chat.completions.create(request);
    const { content } = response.choices[0].message;
    if (!content) throw Error(`Empty completion content.`);
    return content;
  } catch (e) {
    const { response } = e as AxiosError;
    switch (response?.status) {
      case 400:
        throw Error(`Context window is full.`);
      case 404:
        throw Error(`Model '${request.model}' is unavailable.`);
      case 429:
        throw Error(`OpenAI rate limited.`);
      default:
        throw e;
    }
  }
}

// lazy load to avoid accessing OPENAI_API_KEY before env has been loaded
const openai = memoize(() => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw Error("OPENAI_API_KEY is not configured!");

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
});
