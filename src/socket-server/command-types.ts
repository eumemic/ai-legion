export enum CommandActionsEnum {
  Start = "start",
  Stop = "stop",
  AddAgent = "addAgent",
  RemoveAgent = "removeAgent",
  StopAgent = "stopAgent",
  StartAgent = "startAgent",
  ChangeAgentType = "changeAgentType",
  ChangeAgentName = "changeAgentName",
}

export type CommandActionToMessage = {
  [CommandActionsEnum.Start]: {
    action: CommandActionsEnum.Start;
    content: null;
  };
  [CommandActionsEnum.Stop]: { action: CommandActionsEnum.Stop; content: null };
  [CommandActionsEnum.AddAgent]: {
    action: CommandActionsEnum.AddAgent;
    content: { id: string; name?: string; type?: string };
  };
  [CommandActionsEnum.RemoveAgent]: {
    action: CommandActionsEnum.RemoveAgent;
    content: { id: string };
  };
  [CommandActionsEnum.StopAgent]: {
    action: CommandActionsEnum.StopAgent;
    content: { id: string };
  };
  [CommandActionsEnum.StartAgent]: {
    action: CommandActionsEnum.StartAgent;
    content: { id: string };
  };
  [CommandActionsEnum.ChangeAgentType]: {
    action: CommandActionsEnum.ChangeAgentType;
    content: { id: string; type: string };
  };
  [CommandActionsEnum.ChangeAgentName]: {
    action: CommandActionsEnum.ChangeAgentName;
    content: { id: string; name: string };
  };
};

export type CommandActionsType = {
  startSystem: () => void;
  stopSystem: () => void;
  addAgent: (content: { id: string; name?: string; type?: string }) => void;
  removeAgent: (content: { id: string }) => void;
  stopAgent: (content: { id: string }) => void;
  startAgent: (content: { id: string }) => void;
  changeAgentType: (content: { id: string; type: string }) => void;
  changeAgentName: (content: { id: string; name: string }) => void;
};
