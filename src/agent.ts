import { Event, MessageEvent } from "./event";

export class Agent {
  constructor(private agentId: string, domain: string) {}

  handleEvent(event: Event): void {
    switch (event.type) {
      case "heartbeat":
        this.handleHeartbeat();
        break;
      case "message":
        this.handleMessageEvent(event);
        break;
    }
  }

  handleHeartbeat(): void {
    console.log(`Agent ${this.agentId} received a heartbeat`);
    // Take any necessary action based on the agent's internal state
  }

  handleMessageEvent(event: MessageEvent): void {
    const { fromId, toId, message } = event;
    console.log(
      `Agent ${this.agentId} received a message from agent ${fromId}: ${message}`
    );
    // Process the message and take appropriate actions
  }
}
