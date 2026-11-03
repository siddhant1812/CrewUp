import { createTheme } from '@mui/material/styles'

// Mirrors the brand palette that lived in index.css's :root custom
// properties. The admin app is light-only (no dark mode toggle exists here).
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#43a8f0', dark: '#107ac6', light: '#eef7fe', contrastText: '#ffffff' },
    secondary: { main: '#144364', contrastText: '#ffffff' },
    error: { main: '#e0392b', light: '#fdeceb' },
    success: { main: '#1f9d55', light: '#e8f8ee' },
    background: { default: '#f4f8fc', paper: '#ffffff' },
    text: { primary: '#253e50', secondary: '#6a7d8a' },
    divider: '#e4e7ec',
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    h1: { fontFamily: "'Sora', 'Plus Jakarta Sans', system-ui, sans-serif", fontWeight: 700, color: '#144364' },
    h2: { fontFamily: "'Sora', 'Plus Jakarta Sans', system-ui, sans-serif", fontWeight: 700, color: '#144364' },
    h3: { fontFamily: "'Sora', 'Plus Jakarta Sans', system-ui, sans-serif", fontWeight: 600, color: '#144364' },
    h4: { fontFamily: "'Sora', 'Plus Jakarta Sans', system-ui, sans-serif", fontWeight: 600, color: '#144364' },
    h5: { fontFamily: "'Sora', 'Plus Jakarta Sans', system-ui, sans-serif", fontWeight: 600, color: '#144364' },
    h6: { fontFamily: "'Sora', 'Plus Jakarta Sans', system-ui, sans-serif", fontWeight: 600, color: '#144364' },
    button: { textTransform: 'none', fontWeight: 600 },
  },
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

export default theme
