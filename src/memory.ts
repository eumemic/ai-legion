import { ChatCompletionRequestMessage } from "openai";

export interface Memory {
  append(
    message: ChatCompletionRequestMessage
  ): Promise<ChatCompletionRequestMessage[]>;
  retrieve(): Promise<ChatCompletionRequestMessage[]>;
}
