import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { applyTheme, getTheme } from './api/theme'
import AppThemeProvider from './components/AppThemeProvider'

applyTheme(getTheme())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppThemeProvider>
      <App />
    </AppThemeProvider>
  </StrictMode>,
)
