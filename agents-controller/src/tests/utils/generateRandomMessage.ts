function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomArray(
  minSize: number,
  maxSize: number,
  minValue: number,
  maxValue: number
): string[] {
  const size = getRandomInt(minSize, maxSize);
  const arr = new Set<string>();

  while (arr.size < size) {
    arr.add(getRandomInt(minValue, maxValue).toString());
  }

  return Array.from(arr);
}

interface AgentSource {
  type: string;
  id: string;
}

interface AgentEvent {
  type: string;
  source: AgentSource;
  targetAgentIds: string[];
  content: string;
  activeAgents: string[];
}

export function generateObject(): AgentEvent {
  return {
    type: "agentToAgent",
    source: { type: "agent", id: getRandomInt(0, 5).toString() },
    targetAgentIds: generateRandomArray(1, 5, 0, 5),
    content: "Reflecting on 22 events...",
    activeAgents: ["1", "2", "3", "4", "5"],
  };
}
