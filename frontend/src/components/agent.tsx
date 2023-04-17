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
    <Grid
      sx={{
        overflowY: 'auto',
        backgroundColor: '#444',
        borderRadius: 1,
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
          sx={{
            flex: 1,
            fontSize: 16,
            color: '#fff',
            fontWeight: 'bold',
            p: 1
          }}
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
      <List
        sx={{
          flex: 1,
          overflow: 'auto',
          backgroundColor: '#1a1a1a',
          height: '100%'
        }}
      >
        {filteredMessages.map((message, idx) => (
          <ListItem
            key={idx}
            alignItems="flex-start"
            sx={{
              backgroundColor: message.type === 'error' ? '#300105' : '#222',
              borderRadius: 1,
              marginBottom: 1,
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
    </Grid>
  );
};

export default Agent;
