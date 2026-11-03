import { createTheme } from '@mui/material/styles'

// Mirrors the brand palette that lived in index.css's :root / [data-theme="dark"]
// custom properties, so MUI and any not-yet-migrated legacy CSS stay visually
// consistent during the page-by-page rewrite.
const PALETTES = {
  light: {
    mode: 'light',
    primary: { main: '#43a8f0', dark: '#107ac6', light: '#eef7fe', contrastText: '#ffffff' },
    secondary: { main: '#144364', contrastText: '#ffffff' },
    background: { default: '#ffffff', paper: '#ffffff' },
    text: { primary: '#253e50', secondary: '#6a7d8a' },
    divider: '#e3eef5',
  },
  dark: {
    mode: 'dark',
    primary: { main: '#43a8f0', dark: '#107ac6', light: '#1f3c50', contrastText: '#ffffff' },
    secondary: { main: '#f5fafe', contrastText: '#10283a' },
    background: { default: '#10283a', paper: '#1b3242' },
    text: { primary: '#ebf6fd', secondary: '#a5bed0' },
    divider: '#2b485c',
  },
}

export function createAppTheme(mode) {
  const palette = PALETTES[mode] || PALETTES.light

  return createTheme({
    palette,
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      h1: { fontFamily: "'Sora', 'Plus Jakarta Sans', system-ui, sans-serif", fontWeight: 700 },
      h2: { fontFamily: "'Sora', 'Plus Jakarta Sans', system-ui, sans-serif", fontWeight: 700 },
      h3: { fontFamily: "'Sora', 'Plus Jakarta Sans', system-ui, sans-serif", fontWeight: 600 },
      h4: { fontFamily: "'Sora', 'Plus Jakarta Sans', system-ui, sans-serif", fontWeight: 600 },
      h5: { fontFamily: "'Sora', 'Plus Jakarta Sans', system-ui, sans-serif", fontWeight: 600 },
      h6: { fontFamily: "'Sora', 'Plus Jakarta Sans', system-ui, sans-serif", fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    shadows: Object.assign([], createTheme().shadows, {
      1: '0 12px 40px rgba(16, 30, 40, 0.1)',
    }),
    components: {
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 10, paddingTop: 10, paddingBottom: 10 },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
        },
      },
      MuiTextField: {
        defaultProps: { fullWidth: true },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { borderRadius: 10 },
        },
      },
    },
  })
}
