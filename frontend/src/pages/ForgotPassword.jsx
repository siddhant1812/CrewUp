import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Alert, Box, Button, Link, Stack, TextField, Typography } from '@mui/material'
import AuthLayout from '../components/AuthLayout'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) {
      setError('Enter the email associated with your account.')
      return
    }
    setSent(true)
  }

  return (
    <AuthLayout title="Reset your password" subtitle="We'll email you a link to choose a new password.">
      {sent ? (
        <Stack spacing={2} role="status">
          <Typography color="text.secondary">
            If an account exists for <strong>{email}</strong>, you&apos;ll get a reset link shortly. Check your
            inbox and spam folder.
          </Typography>
          <Button component={RouterLink} to="/login" variant="contained" size="large" fullWidth>
            Back to Log In
          </Button>
          <Link
            component="button"
            type="button"
            onClick={() => setSent(false)}
            fontWeight={600}
            underline="hover"
            sx={{ alignSelf: 'center' }}
          >
            Try a different email
          </Link>
        </Stack>
      ) : (
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
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
              }}
              required
            />

            <Button type="submit" variant="contained" size="large" fullWidth>
              Send Reset Link
            </Button>

            <Typography variant="body2" align="center" color="text.secondary">
              Remember your password?{' '}
              <Link component={RouterLink} to="/login" fontWeight={600} underline="hover">
                Log in
              </Link>
            </Typography>
          </Stack>
        </Box>
      )}
    </AuthLayout>
  )
}
