import React, { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import ReactMarkdown from 'react-markdown';
import {
  Paper,
  List,
  Avatar,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
  Grid
} from '@mui/material';

import { Message } from '../types/message';
import { capitalizeFirstLetter } from '../utils/strings';

const AgentStream = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');

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
      console.log('message', message);

      setMessages((prevMessages) => [...prevMessages, message]);
    };

    socket.on('message', handleNewMessage);

    return () => {
      socket.off('message', handleNewMessage);
    };
  }, [socket]);

  const sendMessage = (message: string) => {
    if (!socket) return;
    socket.emit('message', message);
    setInput('');
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendMessage(input);
  };

  const createTitle = (message: Message) => {
    const source =
      message.source.type === 'agent' && message.source.id === '0'
        ? 'Control'
        : `${capitalizeFirstLetter(message.source.type)} ${
            message.source.id || ''
          }`;

    return `${source} >>> ${message.targetAgentIds
      .map((id: string) => (id === '0' ? 'Control' : `Agent ${id}`))
      .join(', ')}`;
  };

  return (
    <div style={{ height: '80vh', flex: 1, width: '80vw' }}>
      <Paper
        sx={{
          overflow: 'auto',
          backgroundColor: '#444',
          borderRadius: 2,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          pt: 0,
          pb: 0,
          pl: 4,
          pr: 4
        }}
      >
        <List sx={{ overflow: 'auto' }}>
          {messages.map((message, idx) => (
            <ListItem
              key={idx}
              alignItems="flex-start"
              sx={{
                backgroundColor: message.type === 'error' ? '#300105' : '#222',
                borderRadius: 4,
                marginTop: 5,
                marginBottom: 5
              }}
            >
              <ListItemText
                primary={
                  <Grid
                    sx={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center'
                    }}
                  >
                    <Typography sx={{ flex: 1, fontSize: 20, color: '#fff' }}>
                      {createTitle(message)}
                    </Typography>
                    <Typography sx={{ fontSize: 20, color: '#fff' }}>
                      {`Type: ${message.type}`}
                    </Typography>
                  </Grid>
                }
                secondary={<ReactMarkdown>{message.content}</ReactMarkdown>}
                secondaryTypographyProps={{
                  fontSize: 14,
                  color: '#ddd'
                }}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </div>
  );
};

export default AgentStream;
