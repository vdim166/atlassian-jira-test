import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0052CC' },
    secondary: { main: '#6554C0' },
    error: { main: '#DE350B' },
    warning: { main: '#FFAB00' },
    background: { default: '#F4F5F7', paper: '#FFFFFF' },
  },
  typography: {
    fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&.problem-unassigned': { backgroundColor: 'rgba(222, 53, 11, 0.08)' },
          '&.problem-deadline': { backgroundColor: 'rgba(255, 171, 0, 0.12)' },
        },
      },
    },
  },
});
