import { Dispatch, createContext } from 'react';
import { ActionType } from '../../hooks/useCreateReducer';
import { AgentsControlState } from './AgentsControl.state';

export interface AgentsControlContextProps {
  state: AgentsControlState;
  dispatch: Dispatch<ActionType<AgentsControlState>>;
}

const AgentsControlContext = createContext<AgentsControlContextProps>(
  undefined!
);

export default AgentsControlContext;
