import { Grid } from '@mui/material';
import './App.css';

import AgentsContainer from './components/agentContainer';

function App() {
  return (
    <Grid sx={{ height: '100%', width: '100%', p: 1 }}>
      <AgentsContainer />
    </Grid>
  );
}

export default App;
