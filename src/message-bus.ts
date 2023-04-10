export interface MessageBus {
  subscribe(listener: (message: Message) => Promise<void>): void;
  unsubscribe(listener: (message: Message) => Promise<void>): void;
  publish(message: Message): void;
}

export interface Message {
  /**
   * If left unspecified, indicates the message should be broadcast to all agents.
   */
  targetAgentIds?: string[];
  content: string;
}
