import { ActionDefinition } from "../action-definition";
import coreActions from "./core";
import filesystemActions from "./filesystem";

export const allActionDefinitions: ActionDefinition[] = [
  ...coreActions,
  ...filesystemActions,
];
