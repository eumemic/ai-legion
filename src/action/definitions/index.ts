import { ActionDefinition } from "../action-definition";
import coreActions from "./core";
import filesystemActions from "./filesystem";
import noteActions from "./note";

export const allActionDefinitions: ActionDefinition[] = [
  ...coreActions,
  ...filesystemActions,
  ...noteActions,
];