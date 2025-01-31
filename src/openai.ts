import { AxiosError, AxiosRequestConfig } from "axios";
import { memoize } from "lodash";
import { Configuration, OpenAIApi } from "openai";
import { CreateChatCompletionRequest } from "./types";

export const GPT_3_5_TURBO = "gpt-3.5-turbo";
export const GPT_4 = "gpt-4";
export const GPT_4O = "gpt-4o";

export const contextWindowSize = {
  [GPT_3_5_TURBO]: 4000,
  [GPT_4]: 8000,
  [GPT_4O]: 128000,
};

export type Model = typeof GPT_3_5_TURBO | typeof GPT_4 | typeof GPT_4O;

export async function createChatCompletion(
  request: CreateChatCompletionRequest,
  options?: AxiosRequestConfig
): Promise<string> {
  try {
    const response = await openai().createChatCompletion(request, options);
    return response.data.choices[0].message!.content;
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

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  return new OpenAIApi(configuration);
});
