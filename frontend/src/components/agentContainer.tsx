import { useEffect, useState } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import io, { Socket } from 'socket.io-client';
import { Message } from '../types/message';
import Agent from './agent';
import ControlInput from './controlInput';

const AgentsContainer = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeAgents, setActiveAgents] = useState<string[]>([]);

  useEffect(() => {
    const newSocket = io('http://localhost:4331'); // Replace with your server's address
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      setMessages((prevMessages) => [...prevMessages, message]);

      if (message.activeAgents) {
        setActiveAgents(message.activeAgents);
      }
    };

    socket.on('message', handleNewMessage);

    return () => {
      socket.off('message', handleNewMessage);
    };
  }, [socket]);

  return (
    <Grid
      container
      gap={2}
      flexDirection="row"
      sx={{
        width: '100%',
        height: '100%'
      }}
    >
      <Grid
        container
        item
        sx={{
          flexDirection: 'column',
          flexWrap: 'nowrap',
          flex: 1,
          borderRadius: 1,
          backgroundColor: '#2a2a2a',
          height: '100%'
        }}
      >
        <Agent agentId={'0'} messages={messages} />

        <Grid
          item
          container
          sx={{ alignItems: 'flex-end', height: '100%', width: '100%' }}
        >
          <ControlInput socket={socket} />
        </Grid>
      </Grid>
      <Grid item sx={{ flex: 4, height: '100%' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(30%, 1fr))',
            gap: 2,
            minHeight: 600,
            minWidth: 600,
            width: '100%',
            height: '100%',
            backgroundColor: '#2a2a2a'
          }}
        >
          {activeAgents
            .filter((agentId) => agentId !== '0')
            .map((agentId) => (
              <Agent key={agentId} agentId={agentId} messages={messages} />
            ))}
        </Box>
      </Grid>
    </Grid>
  );
};

export default AgentsContainer;
