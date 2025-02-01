import { AxiosError } from "axios";
import { memoize } from "lodash";
import OpenAI from "openai";
import { CreateChatCompletionRequest } from "./types";

// Import model configuration from the JSON file.
// This object maps model identifiers to their context window sizes.
import modelRegistry from "../model-registry.json";

// Export the model configuration and derive the Model type from its keys.
export const contextWindowSize = modelRegistry;
export type Model = keyof typeof modelRegistry;

export async function createChatCompletion(
  request: CreateChatCompletionRequest
): Promise<string> {
  try {
    const response = await openai().chat.completions.create(request);
    const { content } = response.choices[0].message;
    if (!content) throw new Error("Empty completion content.");
    return content;
  } catch (e) {
    const { response } = e as AxiosError;
    switch (response?.status) {
      case 400:
        throw new Error("Context window is full.");
      case 404:
        throw new Error(`Model '${request.model}' is unavailable.`);
      case 429:
        throw new Error("OpenAI rate limited.");
      default:
        throw e;
    }
  }
}

// Lazy-load the OpenAI API client to delay API key access until runtime.
const openai = memoize(() => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured!");
  return new OpenAI({ apiKey });
});

export { modelRegistry };
