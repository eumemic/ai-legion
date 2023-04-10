import { Event } from "./event";
import { Action } from "./action";

export interface Memory {
  saveEvent(event: Event): Promise<void>;
  saveAction(agentId: string, action: Action): Promise<void>;
  getMemory(agentId: string): Promise<Array<Event | Action>>;
}
