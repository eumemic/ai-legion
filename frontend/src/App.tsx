import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import './App.css';
import AgentStream from './components/agentStram';

function App() {
  return <AgentStream />;
}

export default App;
