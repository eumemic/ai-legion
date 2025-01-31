export interface ChatCompletionRequestMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CreateChatCompletionRequest {
  model: string;
  messages: ChatCompletionRequestMessage[];
  temperature?: number;
}
