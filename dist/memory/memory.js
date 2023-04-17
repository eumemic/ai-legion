"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Memory = void 0;
const make_decision_1 = __importStar(require("../make-decision"));
const message_1 = require("../message");
const util_1 = require("../utils/util");
class Memory {
    constructor(agentId, moduleManager, store, compressionThreshold, model) {
        this.agentId = agentId;
        this.moduleManager = moduleManager;
        this.store = store;
        this.compressionThreshold = compressionThreshold;
        this.model = model;
        this.firstRetrieval = true;
        this.model = model;
    }
    async append(event) {
        this.printEvent(event);
        let events = await this.retrieve();
        if (event.type === "message" && event.message.type === "ok") {
            // After an "ok" message is sent, remove all errors and their antecedents from memory,
            // since agents tend to repeat mistakes rather than learning from them.
            events = this.removeErrors(events);
        }
        events.push(event);
        events = await this.summarize(events);
        await this.store.set(this.key, events.slice(1));
        return events;
    }
    async retrieve() {
        const introduction = await this.getIntroduction();
        const storedEvents = await this.store.get(this.key);
        let events = [
            introduction,
            ...(storedEvents || [{ type: "decision", actionText: "noop" }]),
        ];
        if (this.firstRetrieval) {
            this.firstRetrieval = false;
            events = await this.summarize(events);
            await this.store.set(this.key, events.slice(1));
        }
        // events.forEach((event) => this.printEvent(event));
        return events;
    }
    async getIntroduction() {
        const nestedEvents = await Promise.all(this.moduleManager.modules.map(async (module) => {
            const { name, pinnedMessage } = module.moduleDef;
            if (!pinnedMessage)
                return [];
            const content = await pinnedMessage(module.context);
            if (!content)
                return [];
            return [`--- ${name.toUpperCase()} ---\n\n${content}`];
        }));
        return {
            type: "message",
            message: message_1.messageBuilder.spontaneous(this.agentId, nestedEvents.flat().join("\n\n")),
        };
    }
    removeErrors(events) {
        const cleaned = [];
        for (let i = events.length - 1; i >= 0; i--) {
            const event = events[i];
            if (event.type === "message" && event.message.type === "error") {
                const prevEvent = events[i - 1];
                // console.log("REMOVING", JSON.stringify(prevEvent, null, 2));
                // console.log("REMOVING", JSON.stringify(event, null, 2));
                if (prevEvent.type === "decision") {
                    i--; // skip the previous action which generated the error
                }
                else {
                    console.error("error event was not preceded by an action");
                }
                continue;
            }
            cleaned.push(event);
        }
        cleaned.reverse();
        // console.log({ events, cleaned });
        return cleaned;
    }
    /**
     * Compress the event history when it becomes too large in order to free up the context window.
     */
    async summarize(events) {
        if (!events.length)
            return [];
        const cumulativeTokenCounts = this.getCumulativeTokenCounts(events);
        const totalTokenCount = cumulativeTokenCounts[cumulativeTokenCounts.length - 1];
        const thresholdOverrun = totalTokenCount - this.compressionThreshold;
        const truncationThreshold = cumulativeTokenCounts[0] +
            Math.max(thresholdOverrun, Math.floor((totalTokenCount - cumulativeTokenCounts[0]) / 2));
        // console.log(
        //   `Token count: ${totalTokenCount}\nRemaining context space: ${-thresholdOverrun}`
        // );
        // console.log({
        //   compressionThreshold: this.compressionThreshold,
        //   truncationThreshold,
        //   thresholdOverrun,
        //   cumulativeTokenCounts,
        // });
        if (thresholdOverrun > 0) {
            let i = 1;
            // prettier-ignore
            for (; i < events.length && cumulativeTokenCounts[i - 1] <= truncationThreshold; i++)
                ;
            // prettier-ignore
            for (; i > 0 && cumulativeTokenCounts[i - 1] > this.compressionThreshold; i--)
                ;
            i = Math.max(i, 3);
            const precedingTokens = cumulativeTokenCounts[i - 1];
            // console.log({ truncationIndex: i, precedingTokens });
            const summaryWordLimit = Math.floor((this.compressionThreshold * util_1.AVG_WORDS_PER_TOKEN) / 6);
            const eventsToSummarize = events.slice(0, i);
            // console.log(
            //   `Summarizing ${eventsToSummarize.length} events (${eventsToSummarize
            //     .map(countTokens)
            //     .reduce((sum, next) => sum + next, 0)} tokens)`
            // );
            const summaryContent = await (0, make_decision_1.default)([
                ...eventsToSummarize,
                {
                    type: "message",
                    message: message_1.messageBuilder.ok(this.agentId, `Write a summary in ${summaryWordLimit} words or less of what has happened since (but not including) the introductory message. Include key information that you learned which you don't want to forget. This information will serve as a note to yourself to help you understand what has gone before. Use the second person voice, as if you are someone filling in your replacement who knows nothing. The summarized messages will be omitted from your context window going forward and you will only have this summary to go by, so make it as useful and information-dense as possible. Be as specific as possible, but only include important information. If there are details that seem unimportant, or which you could recover outside of your memory (for instance the particular contents of a file which you could read any time), then omit them from your summary. Once again, your summary must not exceed ${summaryWordLimit} words. In this particular instance, your response should just be raw text, not formatted as an action.`),
                },
            ], this.model);
            const summary = `Several events are omitted here to free up space in your context window, summarized as follows:\n\n${summaryContent}`;
            // const summary =
            //   "Several events are omitted here to free up space in your context window.";
            const summaryEvent = {
                type: "message",
                message: message_1.messageBuilder.spontaneous(this.agentId, summary),
            };
            const summaryTokens = countTokens(summaryEvent);
            const tokenSavings = precedingTokens - summaryTokens - cumulativeTokenCounts[0];
            if (tokenSavings > 0) {
                // console.log(
                //   `Summarized events, saving ${tokenSavings} tokens:\n\n${summary}`
                // );
                const newEvents = [events[0], summaryEvent, ...events.slice(i)];
                // const newCumulativeTokenCounts =
                //   this.getCumulativeTokenCounts(newEvents);
                // console.log({ newCumulativeTokenCounts });
                return newEvents;
            }
        }
        return events;
    }
    getCumulativeTokenCounts(events) {
        return events.reduce((counts, event) => {
            const prevSum = counts.length ? counts[counts.length - 1] : 0;
            counts.push(prevSum + countTokens(event));
            return counts;
        }, []);
    }
    get key() {
        return "memory";
    }
    printEvent(event) {
        var _a;
        let sourceName;
        let targetNames;
        if (event.type === "message") {
            const { message } = event;
            sourceName = (0, util_1.messageSourceName)(message.source);
            targetNames = (_a = message.targetAgentIds) === null || _a === void 0 ? void 0 : _a.map(util_1.agentName);
        }
        else {
            sourceName = (0, util_1.agentName)(this.agentId);
            targetNames = ["System"];
        }
        console.log(`${sourceName} -> ${targetNames.join(", ")}:\n\n${(0, make_decision_1.toOpenAiMessage)(event).content}\n\n=============\n`);
    }
}
exports.Memory = Memory;
function countTokens(event) {
    return (0, util_1.countTokens)((0, make_decision_1.toOpenAiMessage)(event).content);
}
