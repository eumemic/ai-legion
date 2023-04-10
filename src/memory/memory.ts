import { encode } from "gpt-3-encoder";
import { Event } from ".";
import makeDecision, { toOpenAiMessage } from "../make-decision";
import { messageBuilder } from "../message";
import { primer } from "../primer";
import { Store } from "../store";
import { agentName, messageSourceName } from "../util";

const AVG_WORDS_PER_TOKEN = 0.75;

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
    await this.store.set(this.key, JSON.stringify(events.slice(1), null, 2));
    return events;
  }

  async retrieve(): Promise<Event[]> {
    const eventsText = await this.store.get(this.key);
    const events: Event[] = JSON.parse(eventsText || "[]");
    return [{ type: "message", message: primer(this.agentId) }, ...events];
  }

  /**
   * Compress the event history when it becomes too large in order to free up the context window.
   */
  private async summarize(events: Event[]): Promise<Event[]> {
    if (!events.length) return [];

    const cumulativeTokenCounts = events.reduce((counts, event) => {
      const prevSum = counts.length ? counts[counts.length - 1] : 0;
      counts.push(prevSum + countTokens(event));
      return counts;
    }, [] as number[]);

    const totalTokenCount =
      cumulativeTokenCounts[cumulativeTokenCounts.length - 1];
    const thresholdOverrun = totalTokenCount - this.compressionThreshold;
    const truncationThreshold =
      cumulativeTokenCounts[0] +
      Math.max(
        thresholdOverrun,
        Math.floor((totalTokenCount - cumulativeTokenCounts[0]) / 2)
      );

    // console.log({ totalTokenCount, thresholdOverrun, truncationThreshold });

    if (thresholdOverrun > 0) {
      for (let i = 1; i < events.length; i++) {
        const precedingTokens = cumulativeTokenCounts[i - 1];
        if (precedingTokens > truncationThreshold) {
          // const summarizedEvents = events.slice(1, i);

          const summaryWordLimit = Math.floor(
            (this.compressionThreshold * AVG_WORDS_PER_TOKEN) / 6
          );
          const { actionText: summary } = await makeDecision(this.agentId, [
            ...events.slice(0, i),
            {
              type: "message",
              message: messageBuilder.standard(
                this.agentId,
                `Write a summary in ${summaryWordLimit} words or less of what has happened since (but not including) the introductory message. Include key information that you learned which you don't want to forget. This information will serve as a note to yourself to help you understand what has gone before. Use the second person voice, as if you are someone filling in your replacement who knows nothing. The summarized messages will be omitted from your context window going forward and you will only have this summary to go by, so make it as useful and information-dense as possible. Be as specific as possible, but only include important information. If there are details that seem unimportant, or which you could recover outside of your memory (for instance the particular contents of a file which you could read any time), then omit them from your summary. Once again, your summary must not exceed ${summaryWordLimit} words. In this particular instance, your response should just be raw text, not formatted as an action.`
              ),
            },
          ]);

          const summaryEvent: Event = {
            type: "summary",
            summary,
          };
          const summaryTokens = countTokens(summaryEvent);
          const tokenSavings = precedingTokens - summaryTokens;
          if (tokenSavings > 0) {
            // console.log(
            //   `Summarized events, saving ${tokenSavings} tokens:\n\n${summary}`
            // );

            return [events[0], summaryEvent, ...events.slice(i)];
          }
        }
      }
    }
    return events;
  }

  private get key() {
    return "memory";
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

function countTokens(event: Event) {
  return encode(toOpenAiMessage(event).content).length;
}
