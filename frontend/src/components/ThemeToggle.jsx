import { useEffect, useState } from 'react'
import { IconButton } from '@mui/material'
import { DarkModeOutlined, LightModeOutlined } from '@mui/icons-material'
import { getTheme, setTheme } from '../api/theme'

export default function ThemeToggle() {
  const [theme, setLocal] = useState(getTheme)

  useEffect(() => {
    const sync = () => setLocal(getTheme())
    window.addEventListener('crewup-theme', sync)
    return () => window.removeEventListener('crewup-theme', sync)
  }, [])

  const dark = theme === 'dark'

  return (
    <IconButton
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      size="small"
      sx={{ color: 'text.secondary' }}
    >
      {dark ? <LightModeOutlined fontSize="small" /> : <DarkModeOutlined fontSize="small" />}
    </IconButton>
  )
}
