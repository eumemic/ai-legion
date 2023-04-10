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
  async pinnedMessage({ agentId, state }) {
    const goals = (await state.get(KEY)) || [];
    const currentGloals = goals.length
      ? `This is your current goal list:\n\n${goals
          .map(
            ({ text, complete }, index) =>
              `${index + 1}) ${text} [${complete ? "COMPLETE" : "PENDING"}]`
          )
          .join("\n")}`
      : "You have no goals currently.";
    return messageBuilder.spontaneous(
      agentId,
      `
--- GOALS ---

You have a list of goals to work with, which you can add (\`addGoal\`) and mark complete (\`completeGoal\`). You are responsible for maintaining this list to help you in your work. Whenever you decide to start doing something it's a good idea to first add a goal. Whenever you finish doing something, mark it complete. This list of goals will always be pinned to the top of your context and won't be summarized away.

${currentGloals}
`.trim()
    );
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
        goalIndex: {
          description: "The index of the goal you want to mark as complete",
        },
      },
      async execute({
        parameters: { goalIndex },
        context: { agentId, state },
        sendMessage,
      }) {
        const idx = parseInt(goalIndex);
        const goals = (await state.get(KEY)) || [];
        if (isNaN(idx) || idx < 0 || idx >= goals.length)
          return sendMessage(
            messageBuilder.error(agentId, `Invalid goal index: ${goalIndex}`)
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
