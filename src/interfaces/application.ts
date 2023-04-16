import { openAImodel } from "./open-ai-model";

export interface AppState {
  agents: string[];
  numberOfAgents: number;
  modelType: openAImodel;
}
