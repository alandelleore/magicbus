import { createTheme } from '@mui/material/styles';

export const tokens = {
  brand: '#F05510',
  brandDark: '#C23D00',
  brandLight: '#FFF0EB',
  bg: '#F7F6F4',
  surface: '#FFFFFF',
  surface2: '#F2F0ED',
  textPrimary: '#1A1917',
  textSecondary: '#6B6760',
  textMuted: '#9B9790',
  border: 'rgba(0,0,0,0.08)',
  borderStrong: 'rgba(0,0,0,0.14)',
  green: '#1A7A4A',
  greenBg: '#E8F6EE',
  amber: '#92580A',
  amberBg: '#FEF3E2',
  red: '#B22B2B',
  redBg: '#FCEAEA',
  blue: '#2A56C6',
  blueBg: '#E8F0FE',
};

export const radii = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 14,
  card: 16,
};

const theme = createTheme({
  palette: {
    primary: { main: tokens.brand },
    secondary: { main: tokens.brandDark },
    success: { main: tokens.green },
    warning: { main: tokens.amber },
    error: { main: tokens.red },
    background: {
      default: tokens.bg,
      paper: tokens.surface,
    },
    text: {
      primary: tokens.textPrimary,
      secondary: tokens.textSecondary,
    },
    divider: tokens.border,
  },
  typography: {
    fontFamily: '"DM Sans", system-ui, sans-serif',
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    body1: { fontFamily: '"DM Sans", system-ui, sans-serif' },
    body2: { fontFamily: '"DM Sans", system-ui, sans-serif' },
    caption: { fontFamily: '"DM Sans", system-ui, sans-serif' },
  },
  shape: { borderRadius: radii.md },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: radii.md,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: radii.xl },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: radii.md,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          backgroundImage: 'none',
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: `0 3px 10px rgba(240,85,16,0.35)`,
        },
      },
    },
  },
});

export default theme;
