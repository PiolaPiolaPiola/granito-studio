import { createTheme } from '@mui/material/styles'

/**
 * Primario #8F7042 (no #B08D57 del diseño original): con texto blanco da un
 * contraste de ~4.9:1 y cumple WCAG AA. #B08D57 solo llegaba a ~3.2:1.
 * El texto secundario también se oscureció (#5E5850) por la misma razón.
 */
export const tema = createTheme({
  palette: {
    primary: { main: '#8F7042', light: '#B08D57', dark: '#6E5532', contrastText: '#FFFFFF' },
    secondary: { main: '#4A453F' },
    error: { main: '#B3261E' },
    background: { default: '#F5F2EC', paper: '#FFFFFF' },
    text: { primary: '#262320', secondary: '#5E5850' },
    divider: '#E8E3DA',
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    h1: { fontSize: '1.5rem', fontWeight: 700 },
    h2: { fontSize: '1.125rem', fontWeight: 600 },
    h3: { fontSize: '1rem', fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { minHeight: 40 } },
    },
    MuiIconButton: { styleOverrides: { root: { width: 44, height: 44 } } },
    MuiCard: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: { root: { borderColor: '#E8E3DA', boxShadow: '0 1px 3px rgba(38,35,32,0.06)' } },
    },
    MuiTextField: { defaultProps: { size: 'small', fullWidth: true } },
    MuiChip: { styleOverrides: { root: { fontSize: 12 } } },
  },
})
