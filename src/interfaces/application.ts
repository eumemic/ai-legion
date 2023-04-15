import { openAImodel } from "./openAImodel";

export interface AppState {
  agents: string[];
  numberOfAgents: number;
  modelType: openAImodel;
}
