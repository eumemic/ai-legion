import { ReactNode } from 'react';
import { Box, Grid } from '@mui/material';

export interface PageContainerProps {
  children?: ReactNode;
}

export const PageContainer = ({ children }: PageContainerProps) => {
  console.log('trigger page container');
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        width: '100%',
        justifyContent: 'center'
      }}
    >
      <Grid
        container
        columnGap={1}
        sx={{
          display: 'flex',
          flexGrow: 1,
          justifyContent: 'center'
        }}
      >
        {children}
      </Grid>
    </Box>
  );
};
