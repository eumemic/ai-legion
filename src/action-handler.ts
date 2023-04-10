import { Action } from "./action-types";

export default class ActionHandler {
  async handle(action: Action) {
    // console.log(`action received: ${JSON.stringify(action, null, 2)}`);
  }
}
