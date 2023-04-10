import { isEmpty } from "lodash";
import { Event } from ".";
import { primerMessage } from "../message";
import { Store } from "../store";
import { agentName, messageSourceName } from "../util";
import { toOpenAiMessage } from "../make-decision";

export class Memory {
  constructor(private agentId: string, private store: Store) {}

  async append(event: Event): Promise<Event[]> {
    this.printEvent(event);
    const events = await this.retrieve();
    events.push(event);
    await this.store.set(this.key, JSON.stringify(events, null, 2));
    return events;
  }

  async retrieve(): Promise<Event[]> {
    const eventsText = await this.store.get(this.key);
    const events: Event[] = JSON.parse(eventsText || "[]");
    if (isEmpty(events))
      events.push({ type: "message", message: primerMessage(this.agentId) });
    return events;
  }

  private get key() {
    return `agent-${this.agentId}`;
  }

  private printEvent(event: Event) {
    let sourceName: string;
    let targetNames: string[];
    if (event.type === "message") {
      const { message } = event;
      sourceName = messageSourceName(message.source);
      targetNames = message.targetAgentIds?.map(agentName);
    } else {
      sourceName = agentName(this.agentId);
      targetNames = ["System"];
    }
    console.log(
      `${sourceName} -> ${targetNames.join(", ")}:\n\n${
        toOpenAiMessage(event).content
      }\n\n=============\n`
    );
  }
}
