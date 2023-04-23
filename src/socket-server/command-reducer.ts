import { CommandActions, CommandActionToMessage } from "./command-actions";

export type CommandMessage =
  CommandActionToMessage[keyof CommandActionToMessage];

type ProcessMessageFunction = (message: CommandMessage) => void;

export const commandMessageReducer: ProcessMessageFunction = (message) => {
  switch (message.action) {
    case CommandActions.Start:
      startSystem();
      break;
    case CommandActions.Stop:
      stopSystem();
      break;
    case CommandActions.AddAgent:
      addAgent(message.content);
      break;
    case CommandActions.RemoveAgent:
      removeAgent(message.content);
      break;
    case CommandActions.StopAgent:
      stopAgent(message.content);
      break;
    case CommandActions.StartAgent:
      startAgent(message.content);
      break;
    case CommandActions.ChangeAgentType:
      changeAgentType(message.content);
      break;
    case CommandActions.ChangeAgentName:
      changeAgentName(message.content);
      break;
    default:
      console.error("Invalid action:");
  }
};

function startSystem() {
  console.log("startSystem..........");
  // Implement start system logic
}

function stopSystem() {
  console.log("stopSystem..........");
  // Implement stop system logic
}

function addAgent(content: { id: string; name?: string; type?: string }) {
  // Implement add agent logic
}

function removeAgent(content: { id: string }) {
  // Implement remove agent logic
}

function stopAgent(content: { id: string }) {
  // Implement stop agent logic
}

function startAgent(content: { id: string }) {
  // Implement start agent logic
}

function changeAgentType(content: { id: string; type: string }) {
  // Implement change agent type logic
}

function changeAgentName(content: { id: string; name: string }) {
  // Implement change agent name logic
}
