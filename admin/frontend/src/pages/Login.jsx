import { useState } from 'react'
import { Link as RouterLink, Navigate, useNavigate } from 'react-router-dom'
import { Alert, Box, Button, Link, Paper, Stack, TextField, Typography } from '@mui/material'
import { isAdmin, login } from '../api/auth'
import Icon from '../components/Icon'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ workEmail: '', password: '', adminCode: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAdmin()) return <Navigate to="/" replace />

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Paper
        component="form"
        onSubmit={onSubmit}
        elevation={0}
        sx={{
          width: 'min(100%, 400px)',
          p: { xs: 3, sm: 4 },
          borderRadius: '18px',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 20px 50px rgba(16, 30, 40, 0.08)',
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '12px',
            bgcolor: 'primary.main',
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
          }}
        >
          <Icon name="shield" size={22} />
        </Box>
        <Typography variant="h4" sx={{ fontSize: '1.5rem', mb: 0.5 }}>
          CrewUp Admin
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Sign in with an account that has admin access.
        </Typography>

        <Stack spacing={2}>
          {error ? <Alert severity="error">{error}</Alert> : null}

          <TextField
            label="Email"
            type="email"
            autoComplete="username"
            value={form.workEmail}
            onChange={(e) => setForm((f) => ({ ...f, workEmail: e.target.value }))}
            required
          />
          <TextField
            label="Password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required
          />
          <TextField
            label="Admin code"
            type="password"
            autoComplete="off"
            value={form.adminCode}
            onChange={(e) => setForm((f) => ({ ...f, adminCode: e.target.value }))}
            required
          />

          <Button type="submit" variant="contained" size="large" fullWidth disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>

          <Typography variant="body2" color="text.secondary" align="center">
            Need an account?{' '}
            <Link component={RouterLink} to="/signup" fontWeight={600} underline="hover">
              Create one
            </Link>
          </Typography>
        </Stack>
      </Paper>
    </Box>
  )
}
