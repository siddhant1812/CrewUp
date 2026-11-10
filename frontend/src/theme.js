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
          root: {
            borderRadius: 10,
            paddingTop: 10,
            paddingBottom: 10,
            transition: 'background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, transform 0.12s ease',
          },
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
          root: { borderRadius: 10, transition: 'box-shadow 0.15s ease, border-color 0.15s ease' },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            transition: 'background-color 0.15s ease, color 0.15s ease',
          },
        },
      },
      MuiMenu: {
        defaultProps: {
          transitionDuration: 160,
        },
        styleOverrides: {
          paper: {
            borderRadius: 14,
            marginTop: 6,
            minWidth: 200,
            boxShadow: '0 16px 40px rgba(16, 30, 40, 0.16)',
          },
          list: { padding: 6 },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            borderRadius: 9,
            margin: '1px 0',
            padding: '9px 12px',
            fontSize: '0.92rem',
            transition: 'background-color 0.15s ease',
          },
        },
      },
      MuiPopover: {
        defaultProps: {
          transitionDuration: 160,
        },
      },
      MuiTooltip: {
        defaultProps: { arrow: true },
        styleOverrides: {
          tooltip: { borderRadius: 8, fontSize: '0.75rem' },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: { transition: 'background-color 0.15s ease' },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: { transition: 'transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)' },
        },
      },
    },
  })
}
