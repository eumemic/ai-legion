export enum CommandActions {
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
  [CommandActions.Start]: { action: CommandActions.Start; content: null };
  [CommandActions.Stop]: { action: CommandActions.Stop; content: null };
  [CommandActions.AddAgent]: {
    action: CommandActions.AddAgent;
    content: { id: string; name?: string; type?: string };
  };
  [CommandActions.RemoveAgent]: {
    action: CommandActions.RemoveAgent;
    content: { id: string };
  };
  [CommandActions.StopAgent]: {
    action: CommandActions.StopAgent;
    content: { id: string };
  };
  [CommandActions.StartAgent]: {
    action: CommandActions.StartAgent;
    content: { id: string };
  };
  [CommandActions.ChangeAgentType]: {
    action: CommandActions.ChangeAgentType;
    content: { id: string; type: string };
  };
  [CommandActions.ChangeAgentName]: {
    action: CommandActions.ChangeAgentName;
    content: { id: string; name: string };
  };
};
