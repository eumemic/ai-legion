import React, { useState } from 'react';
import { TextField, Button, Grid } from '@mui/material';

import { Socket } from 'socket.io-client';

interface ControlInputProps {
  socket: Socket | null;
}

const ControlInput = ({ socket }: ControlInputProps) => {
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
    <Grid container spacing={2} sx={{ p: 1 }}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Speak to agents"
          value={inputText}
          onChange={handleChange}
          multiline
          rows={4}
          InputProps={{
            style: {
              backgroundColor: '#222',
              color: '#EEE'
            }
          }}
          sx={{ label: { color: '#888' } }}
        />
      </Grid>
      <Grid item xs={12}>
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
