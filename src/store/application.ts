import { AppState } from "interfaces/application";
import { RedisStore } from "./factories/redis-store";
import { appState } from "./state/application";

export const applicationStore = new RedisStore<AppState>(appState);
