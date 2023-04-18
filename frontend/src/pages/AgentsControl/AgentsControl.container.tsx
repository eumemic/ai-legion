import { useEffect } from 'react';
import socket from '../../services/socket';
import { useCreateReducer } from '../../hooks/useCreateReducer';

import { Message } from '../../types/message';
import AgentsControl from './AgentsControl';
import AgentsControlContext from './AgentsControl.context';
import { AgentsControlState, initialState } from './AgentsControl.state';

const AgentsControlContainer = () => {
  const contextValue = useCreateReducer<AgentsControlState>({
    initialState
  });

  const {
    state: { messages },
    dispatch
  } = contextValue;

  const handleNewMessage = (message: Message) => {
    dispatch({ field: 'messages', value: [...messages, message] });

    if (message.activeAgents) {
      dispatch({ field: 'activeAgents', value: message.activeAgents });
    }
  };

  useEffect(() => {
    if (socket.connected) {
      socket.on('message', handleNewMessage);
    } else {
      socket.connect();
      socket.on('message', handleNewMessage);
    }
  }, [messages]);

  return (
    <AgentsControlContext.Provider value={contextValue}>
      <AgentsControl />
    </AgentsControlContext.Provider>
  );
};

export default AgentsControlContainer;
