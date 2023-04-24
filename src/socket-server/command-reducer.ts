import {
  CommandActionsEnum,
  CommandActionsType,
  CommandActionToMessage,
} from "./command-types";

export type CommandMessage =
  CommandActionToMessage[keyof CommandActionToMessage];

type ProcessMessageFunction = (
  message: CommandMessage,
  actions: CommandActionsType
) => void;

export const commandMessageReducer: ProcessMessageFunction = (
  message,
  actions
) => {
  switch (message.action) {
    case CommandActionsEnum.Start:
      actions.startSystem();
      break;
    case CommandActionsEnum.Stop:
      actions.stopSystem();
      break;
    case CommandActionsEnum.AddAgent:
      actions.addAgent(message.content);
      break;
    case CommandActionsEnum.RemoveAgent:
      actions.removeAgent(message.content);
      break;
    case CommandActionsEnum.StopAgent:
      actions.stopAgent(message.content);
      break;
    case CommandActionsEnum.StartAgent:
      actions.startAgent(message.content);
      break;
    case CommandActionsEnum.ChangeAgentType:
      actions.changeAgentType(message.content);
      break;
    case CommandActionsEnum.ChangeAgentName:
      actions.changeAgentName(message.content);
      break;
    default:
      console.error("Invalid action:");
  }
};
