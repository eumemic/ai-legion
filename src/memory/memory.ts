import { isEmpty } from "lodash";
import { Memento, messageMemento } from ".";
import { primerMessage } from "../message";
import { Store } from "../store";
import { agentName, messageSourceName } from "../util";

export class Memory {
  constructor(private agentId: string, private store: Store) {}

  async append(memento: Memento): Promise<Memento[]> {
    printMemento(memento);
    const mementos = await this.retrieve();
    mementos.push(memento);
    await this.store.set(this.agentId, JSON.stringify(mementos, null, 2));
    return mementos;
  }

  async retrieve(): Promise<Memento[]> {
    const mementosText = await this.store.get(this.agentId);
    const mementos: Memento[] = JSON.parse(mementosText || "[]");
    if (isEmpty(mementos))
      mementos.push(messageMemento(primerMessage(this.agentId)));
    return mementos;
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
