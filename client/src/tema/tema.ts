import { createTheme } from '@mui/material/styles'

declare module '@mui/material/styles' {
  interface Palette {
    /** Superficie suave (zonas de carga de fotos, resúmenes, datos de la cotización). */
    suave: string
    /** Fondo semitransparente para controles sobre fotos o sobre el 3D. */
    vidrio: string
  }
  interface PaletteOptions {
    suave?: string
    vidrio?: string
  }
}

/**
 * Modo claro y oscuro. MUI guarda la preferencia (o usa la del sistema) y expone los colores
 * como variables CSS, así cambiar de modo no vuelve a pintar la app entera.
 *
 * Claro: primario #8F7042 (no #B08D57 del diseño original): con texto blanco da un contraste
 * de ~4.9:1 y cumple WCAG AA. Oscuro: el dorado se aclara (#C9A46A) para mantener contraste
 * sobre fondos oscuros.
 */
export const tema = createTheme({
  cssVariables: { colorSchemeSelector: 'class' },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#8F7042', light: '#B08D57', dark: '#6E5532', contrastText: '#FFFFFF' },
        secondary: { main: '#4A453F' },
        error: { main: '#B3261E' },
        success: { main: '#2E7D4F' },
        warning: { main: '#A35F00' },
        background: { default: '#F5F2EC', paper: '#FFFFFF' },
        text: { primary: '#262320', secondary: '#5E5850' },
        divider: '#E8E3DA',
        suave: '#F7F4EF',
        vidrio: 'rgba(255,255,255,0.9)',
      },
    },
    dark: {
      palette: {
        primary: { main: '#C9A46A', light: '#DDBF8E', dark: '#A88449', contrastText: '#1B1916' },
        secondary: { main: '#CFC7BB' },
        error: { main: '#F2867E' },
        success: { main: '#6CC593' },
        warning: { main: '#F0B45C' },
        background: { default: '#171513', paper: '#211E1B' },
        text: { primary: '#F1ECE4', secondary: '#B8AFA3' },
        divider: '#3A352F',
        suave: '#2A2622',
        vidrio: 'rgba(33,30,27,0.88)',
      },
    },
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
      styleOverrides: {
        root: ({ theme }) => ({ borderColor: theme.vars.palette.divider, boxShadow: '0 1px 3px rgba(38,35,32,0.06)' }),
      },
    },
    MuiTextField: { defaultProps: { size: 'small', fullWidth: true } },
    MuiChip: { styleOverrides: { root: { fontSize: 12 } } },
    MuiTooltip: { defaultProps: { arrow: true, enterDelay: 400 } },
  },
})
