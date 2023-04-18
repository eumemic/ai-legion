import React, { useContext, useState } from 'react';
import { TextField, Button, Grid } from '@mui/material';
import AgentsControlContext from '../pages/AgentsControl/AgentsControl.context';
import socket from '../services/socket';

const ControlInput = () => {
  const [inputText, setInputText] = useState('');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(event.target.value);
  };

  const handleClick = () => {
    if (inputText.trim()) {
      if (socket) socket.emit('message', inputText);
      setInputText('');
    }
  };

  return (
    <Grid
      item
      container
      rowGap={1}
      sx={{
        pt: 2,
        flex: 1,
        flexDirection: 'column',
        flexWrap: 'nowrap',
        height: '100%'
      }}
    >
      <Grid item container sx={{ flex: 1 }}>
        <TextField
          fullWidth
          label="Speak to agents"
          value={inputText}
          onChange={handleChange}
          multiline
          InputProps={{
            style: {
              color: '#EEE',
              height: '100%',
              alignItems: 'flex-start'
            }
          }}
          sx={{ label: { color: '#888' } }}
        />
      </Grid>
      <Grid item sx={{}}>
        <Button
          fullWidth
          variant="contained"
          color="primary"
          onClick={handleClick}
        >
          Send
        </Button>
      </Grid>
    </Grid>
  );
};

export default ControlInput;
