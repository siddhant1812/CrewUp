import { useEffect, useMemo, useState } from 'react'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { getTheme } from '../api/theme'
import { createAppTheme } from '../theme'

// Keeps MUI's theme mode in lockstep with the app's existing light/dark
// toggle (api/theme.js), which still drives the legacy CSS via
// documentElement[data-theme]. Both systems read the same source of truth.
export default function AppThemeProvider({ children }) {
  const [mode, setMode] = useState(getTheme)

  useEffect(() => {
    const sync = () => setMode(getTheme())
    window.addEventListener('crewup-theme', sync)
    return () => window.removeEventListener('crewup-theme', sync)
  }, [])

  const theme = useMemo(() => createAppTheme(mode), [mode])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}
