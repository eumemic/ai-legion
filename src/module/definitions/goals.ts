import { defineModule } from "../define-module";
import { messageBuilder } from "../../message";
import { Store } from "../../store";
import FileStore from "../../store/file-store";
import JsonStore from "../../store/json-store";

interface Goal {
  text: string;
  complete: boolean;
}

const KEY = "goals";

export default defineModule<Store<Goal[]>>({
  name: "goals",
  createState: ({ agentId }) => new JsonStore(new FileStore([agentId])),
}).with({
  async pinnedMessage({ state }) {
    const goals = (await state.get(KEY)) || [];
    const currentGloals = goals.length
      ? `This is your current goal list:\n\n${goals
          .map(
            ({ text, complete }, index) =>
              `${index + 1}) ${text} [${complete ? "COMPLETE" : "PENDING"}]`
          )
          .join("\n")}`
      : "You have no goals currently.";
    return `
You are responsible for maintaining your list of goals, based higher-level objectives which will be given to you. Whenever you start doing something, first add a goal. Whenever you finish doing something, mark it complete. This list of goals will always be pinned to the top of your context and won't be summarized away. Goals should be medium-term (requiring several actions to complete) and concrete.

${currentGloals}
`.trim();
  },
  actions: {
    addGoal: {
      description: "Add a new goal at the end of your goals list.",
      parameters: {
        goal: {
          description:
            "A summary of what you want to achieve (keep this relatively short but information dense)",
        },
      },
      async execute({
        parameters: { goal },
        context: { agentId, state },
        sendMessage,
      }) {
        const goals = (await state.get(KEY)) || [];
        await state.set(KEY, [...goals, { text: goal, complete: false }]);
        sendMessage(messageBuilder.ok(agentId, "Goal added."));
      },
    },

    completeGoal: {
      description: "Mark a goal as complete.",
      parameters: {
        goalNumber: {
          description: "The number of the goal you want to mark as complete",
        },
      },
      async execute({
        parameters: { goalNumber },
        context: { agentId, state },
        sendMessage,
      }) {
        const idx = parseInt(goalNumber) - 1;
        const goals = (await state.get(KEY)) || [];
        if (isNaN(idx) || idx < 0 || idx >= goals.length)
          return sendMessage(
            messageBuilder.error(agentId, `Invalid goal index: ${goalNumber}`)
          );
        await state.set(KEY, [
          ...goals.slice(0, idx),
          { ...goals[idx], complete: true },
          ...goals.slice(idx + 1),
        ]);
        sendMessage(messageBuilder.ok(agentId, "Goal marked complete."));
      },
    },
  },
});
