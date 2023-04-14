import { encode } from "gpt-3-encoder";
import { IMessageSource } from "../interfaces/messageSource.interface";

export function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function sleepUntil(condition: () => boolean): Promise<void> {
  return new Promise((resolve) => {
    if (condition()) return resolve();
    const interval = setInterval(() => {
      if (condition()) {
        clearInterval(interval);
        resolve();
      }
    }, 1000);
  });
}

export function messageSourceName(source: IMessageSource) {
  return source.type === "system" ? "System" : agentName(source.id);
}

export function agentName(agentId: string) {
  return `${agentId === "0" ? "Control" : `Agent ${agentId}`}`;
}

export const MULTILINE_DELIMITER = `% ${"ff9d7713-0bb0-40d4-823c-5a66de48761b"}`;

export const AVG_WORDS_PER_TOKEN = 0.75;
export const AVG_CHARACTERS_PER_TOKEN = 4;

export function countTokens(text: string) {
  return encode(text).length;
}
