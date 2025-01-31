export interface ChatCompletionRequestMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CreateChatCompletionRequest {
  model: string;
  messages: ChatCompletionRequestMessage[];
}
