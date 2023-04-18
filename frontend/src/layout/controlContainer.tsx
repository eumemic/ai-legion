import { ReactNode } from 'react';
import { Grid } from '@mui/material';
import { useTheme } from '@mui/system';

export interface ControlContainerProps {
  children?: ReactNode;
}

export const ControlContainer = ({ children }: ControlContainerProps) => {
  const theme = useTheme();
  return (
    <Grid
      container
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        p: 1,
        flexWrap: 'nowrap',
        minWidth: 200,
        justifyContent: 'center',
        backgroundColor: theme.palette.grey[900]
      }}
    >
      {children}
    </Grid>
  );
};
