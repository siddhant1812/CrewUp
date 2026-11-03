import { useState } from 'react'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import AuthLayout from '../components/AuthLayout'
import { login, saveSession } from '../api/auth'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', remember: true })
  const [error, setError] = useState('')

  function update(field) {
    return (e) => {
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
      setForm((prev) => ({ ...prev, [field]: value }))
      setError('')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.email.trim() || !form.password) {
      setError('Please enter your email and password.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const data = await login({
        workEmail: form.email.trim(),
        password: form.password,
      })
      saveSession(data.token, data.user, form.remember)
      const redirectTo = location.state?.from || '/dashboard'
      navigate(redirectTo)
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to manage projects, crews, and opportunities.">
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={2}>
          {error ? (
            <Alert severity="error" role="alert">
              {error}
            </Alert>
          ) : null}

          <TextField
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={form.email}
            onChange={update('email')}
            required
          />

          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={form.password}
            onChange={update('password')}
            required
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((v) => !v)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <Stack
            direction="row"
            sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}
          >
            <FormControlLabel
              control={<Checkbox checked={form.remember} onChange={update('remember')} size="small" />}
              label={<Typography variant="body2">Remember me</Typography>}
            />
            <Link component={RouterLink} to="/forgot-password" variant="body2" fontWeight={600} underline="hover">
              Forgot password?
            </Link>
          </Stack>

          <Button type="submit" variant="contained" size="large" disabled={loading} fullWidth>
            {loading ? 'Logging in…' : 'Log In'}
          </Button>

          <Divider sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>or</Divider>

          <Button variant="outlined" size="large" disabled fullWidth>
            Continue with Google
          </Button>

          <Typography variant="body2" align="center" color="text.secondary">
            Don&apos;t have an account?{' '}
            <Link component={RouterLink} to="/signup" fontWeight={600} underline="hover">
              Sign up
            </Link>
          </Typography>
        </Stack>
      </Box>
    </AuthLayout>
  )
}
