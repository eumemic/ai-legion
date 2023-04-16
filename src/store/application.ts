import { AppState } from "interfaces/application";
import { RedisStore } from "./factories/redis-store";

const appState: AppState = {
  agents: [],
  numberOfAgents: 0,
  modelType: "gpt-3.5-turbo",
};

export const applicationStore = new RedisStore<AppState>(appState);
