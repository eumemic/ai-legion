import { AppState } from "interfaces/application";

const appState: AppState = {
  agents: [],
  numberOfAgents: 0,
  modelType: "",
};

const dataStore = new RedisDataStore<AppState>(appState);
