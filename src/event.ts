export type Event = HeartbeatEvent | MessageEvent;

export interface HeartbeatEvent {
  type: "heartbeat";
}

export interface MessageEvent {
  type: "message";
  fromId: string;
  toId: string;
  message: string;
}
