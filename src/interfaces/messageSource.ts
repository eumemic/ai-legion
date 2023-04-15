interface IMessageSourceBase {
  id?: string;
}

export interface ISystemMessageSource extends IMessageSourceBase {
  type: "system";
  id?: undefined;
}

export interface IAgentMessageSource extends IMessageSourceBase {
  type: "agent";
  id: string;
}

export type IMessageSource = ISystemMessageSource | IAgentMessageSource;
