import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import './App.css';

import AgentsControl from './pages/AgentsControl';

const darkTheme = createTheme({
  palette: {
    mode: 'dark'
  }
});

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <AgentsControl />
    </ThemeProvider>
  );
}

export default App;
