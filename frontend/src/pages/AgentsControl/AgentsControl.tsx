import { Grid } from '@mui/material';
import { useContext } from 'react';
import Agent from '../../components/agent';
import ControlInput from '../../components/controlInput';
import { AgentsContainer } from '../../layout/agentsContainer';
import { ControlContainer } from '../../layout/controlContainer';
import { PageContainer } from '../../layout/pageContainer';
import AgentsControlContext from './AgentsControl.context';

interface AgentProps {
  agentId: string;
  'data-testid': string;
}

const AgentsControl = () => {
  const {
    state: { activeAgents }
  } = useContext(AgentsControlContext);

  return (
    <PageContainer>
      <ControlContainer>
        <Grid item container sx={{ flex: 8 }}>
          <Agent agentId={'0'} data-testid="control-agent" />
        </Grid>

        <Grid
          item
          container
          sx={{
            flex: 1,
            minHeight: 225
          }}
        >
          <ControlInput data-testid="control-input" />
        </Grid>
      </ControlContainer>
      <AgentsContainer>
        {activeAgents
          .filter((agentId) => agentId !== '0')
          .map((agentId) => (
            <Agent
              key={agentId}
              agentId={agentId}
              data-testid={`agent-${agentId}`}
            />
          ))}
      </AgentsContainer>
    </PageContainer>
  );
};

export default AgentsControl;
