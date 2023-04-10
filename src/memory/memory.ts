import { isEmpty } from "lodash";
import { Event } from ".";
import makeDecision, { toOpenAiMessage } from "../make-decision";
import { messageBuilder, primerMessage } from "../message";
import { Store } from "../store";
import { agentName, messageSourceName } from "../util";
import { GPT_3_5_TURBO } from "../openai";

export class Memory {
  constructor(
    private agentId: string,
    private store: Store,
    private compressionThreshold: number
  ) {}

  async append(event: Event): Promise<Event[]> {
    this.printEvent(event);
    let events = await this.retrieve();
    events.push(event);
    events = await this.summarize(events);
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

  /**
   * Compress the event history when it becomes too large in order to free up the context window.
   */
  private async summarize(events: Event[]): Promise<Event[]> {
    const decisions = events.flatMap((event, index) =>
      event.type === "decision" ? [[event.decision, index] as const] : []
    );

    if (decisions.length > 1) {
      const [firstDecision, firstDecisionIndex] = decisions[0];
      const [lastDecision] = decisions[decisions.length - 1];

      const truncationThreshold =
        (firstDecision.precedingTokens + this.compressionThreshold) / 2;

      if (lastDecision.precedingTokens > this.compressionThreshold) {
        const firstSummarizedIndex = firstDecisionIndex + 1;
        for (let i = firstSummarizedIndex; i < events.length; i++) {
          const event = events[i];
          if (event.type === "decision") {
            const { precedingTokens } = event.decision;
            if (precedingTokens > truncationThreshold) {
              const summarizedEvents = events.slice(firstSummarizedIndex, i);

              const { actionText: summary } = await makeDecision(
                GPT_3_5_TURBO,
                this.agentId,
                [
                  ...events.slice(0, i),
                  {
                    type: "message",
                    message: messageBuilder.standard(
                      this.agentId,
                      `Summarize what that has happened to you since (but not including) the introductory message, in ${Math.floor(
                        this.compressionThreshold / 6
                      )} tokens or less. This is a note to yourself to help you understand what has gone before. Use the second person voice, as if you are someone filling in your replacement who knows nothing. The summarized messages will be omitted from your context window going forward and you will only have this summary to go by, so make it as useful and information-dense as possible.`
                    ),
                  },
                ]
              );

              const summaryEvent: Event = {
                type: "summary",
                summary,
                summarizedEvents,
              };
              const firstEvents = [
                ...events.slice(0, firstSummarizedIndex),
                summaryEvent,
              ];

              const { precedingTokens: summaryTokens } = await makeDecision(
                GPT_3_5_TURBO,
                this.agentId,
                firstEvents
              );
              const tokenSavings = precedingTokens - summaryTokens;
              if (tokenSavings > 0) {
                console.log(
                  `Summarized ${summarizedEvents.length} events, saving ${tokenSavings} tokens: ${summary}`
                );

                const newEvents = [
                  ...firstEvents,
                  ...events.slice(i).map((event): Event => {
                    if (event.type !== "decision") return event;
                    return {
                      type: "decision",
                      decision: {
                        ...event.decision,
                        precedingTokens:
                          event.decision.precedingTokens - tokenSavings,
                      },
                    };
                  }),
                ];

                return newEvents;
              }
            }
          }
        }
      }
    }
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
