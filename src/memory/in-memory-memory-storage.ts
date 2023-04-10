import { Memento, MemoryStorage } from ".";
import { agentName, messageSourceName } from "../util";

export class InMemoryMemoryStorage implements MemoryStorage {
  private mementos: Memento[] = [];

  async append(memento: Memento): Promise<Memento[]> {
    printMemento(memento);
    this.mementos.push(memento);
    return this.mementos;
  }

  async retrieve(): Promise<Memento[]> {
    return this.mementos;
  }
}

function printMemento(memento: Memento) {
  let sourceName: string;
  let targetNames: string[];
  let content: string;
  if (memento.type === "message") {
    const { message } = memento;
    sourceName = messageSourceName(message.source);
    targetNames = message.targetAgentIds?.map(agentName);
    content = message.content;
  } else {
    sourceName = agentName(memento.agentId);
    targetNames = ["System"];
    content = memento.decision.actionText;
  }
  console.log(
    `${sourceName} -> ${targetNames.join(
      ", "
    )}:\n\n${content}\n\n=============\n`
  );
}
