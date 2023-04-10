import { Memento, Memory } from "./memory";
import { agentName, messageSourceName } from "./util";

export class InMemoryMemory implements Memory {
  private mementos: Memento[] = [];

  constructor(...preloadedMementos: Memento[]) {
    this.mementos.push(...preloadedMementos);
    // this.mementos.forEach(printMemento);
  }

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
    content = memento.actionText;
  }
  console.log(
    `${sourceName} -> ${targetNames}:\n\n${content}\n\n=============\n`
  );
}
