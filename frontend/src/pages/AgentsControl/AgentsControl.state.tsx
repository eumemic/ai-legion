import { Message } from '../../types/message';
import { Socket } from 'socket.io-client';

export interface AgentsControlState {
  activeAgents: string[];
  messages: Message[];
}

export const initialState: AgentsControlState = {
  activeAgents: [],
  messages: []
};
