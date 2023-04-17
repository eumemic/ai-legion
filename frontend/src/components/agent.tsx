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
import CommsIndicator from './commsIndicator';
import { useEffect } from 'react';

interface AgentProps {
  agentId: string;
  messages: Message[];
}

const Agent = ({ agentId, messages }: AgentProps) => {
  const filteredMessages = messages.filter((message) =>
    message.targetAgentIds.includes(agentId)
  );

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
    <Paper
      sx={{
        overflow: 'auto',
        backgroundColor: '#444',
        borderRadius: 1,
        minHeight: '100px',
        maxHeight:
          agentId === '0'
            ? 'calc(100% - 220px)'
            : 'calc((100vh - 80px) / Math.ceil(numItems / 3))',
        display: 'flex',
        flexDirection: 'column',
        p: 1
      }}
    >
      <Grid
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center'
        }}
      >
        <Typography
          sx={{ flex: 1, fontSize: 16, color: '#fff', fontWeight: 'bold' }}
        >
          {agentId === '0' ? 'Control' : `Agent ${agentId}`}
        </Typography>
        <CommsIndicator
          message={
            filteredMessages?.length > 0
              ? filteredMessages[filteredMessages.length - 1]
              : null
          }
        />
      </Grid>
      <List sx={{ overflow: 'auto' }}>
        {filteredMessages.map((message, idx) => (
          <ListItem
            key={idx}
            alignItems="flex-start"
            sx={{
              backgroundColor: message.type === 'error' ? '#300105' : '#222',
              borderRadius: 1,
              marginTop: 0.5,
              marginBottom: 0.5,
              p: 1,
              boxShadow: 1
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
                  <Typography sx={{ flex: 1, fontSize: 14, color: '#fff' }}>
                    {createTitle(message)}
                  </Typography>
                  <Typography sx={{ fontSize: 14, color: '#fff' }}>
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
  );
};

export default Agent;
