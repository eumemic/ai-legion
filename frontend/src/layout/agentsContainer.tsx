import { ReactNode } from 'react';
import { Box, Grid, useTheme } from '@mui/material';

export interface AgentsContainerProps {
  children?: ReactNode;
}

export const AgentsContainer = ({ children }: AgentsContainerProps) => {
  const theme = useTheme();
  return (
    <Grid
      container
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(30%, 1fr))',
        gap: 1,
        flex: 4,
        p: 1,
        justifyContent: 'center',
        backgroundColor: theme.palette.grey[900]
      }}
    >
      {children}
    </Grid>
  );
};
