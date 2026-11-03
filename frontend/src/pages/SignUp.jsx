import { useState } from 'react'
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormLabel,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { PersonOutlineOutlined, Visibility, VisibilityOff } from '@mui/icons-material'
import AuthLayout from '../components/AuthLayout'
import { signup, saveSession } from '../api/auth'
import { startCheckout } from '../api/billing'

const ROLES = [
  { id: 'general_contractor', label: 'Contractor' },
  { id: 'subcontractor', label: 'Subcontractor' },
  { id: 'find_work', label: 'Find Work' },
]

export default function SignUp() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const requestedPlan = (searchParams.get('plan') || '').toLowerCase()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [photoPreview, setPhotoPreview] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    role: 'general_contractor',
    password: '',
    confirm: '',
    terms: false,
  })
  const [error, setError] = useState('')
  const isFindWork = form.role === 'find_work'

  function update(field) {
    return (e) => {
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
      setForm((prev) => ({ ...prev, [field]: value }))
      setError('')
    }
  }

  function onPhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) {
      setPhotoFile(null)
      setPhotoPreview('')
      return
    }
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file for your profile photo.')
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      setError('Profile photo must be under 3MB.')
      return
    }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError('Please fill in all required fields.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }
    if (!form.terms) {
      setError('Please agree to the Terms and Privacy Policy.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const body = new FormData()
      body.append('fullName', form.name.trim())
      body.append('workEmail', form.email.trim())
      if (!isFindWork) body.append('company', form.company.trim())
      body.append('contractorType', form.role)
      body.append('password', form.password)
      body.append('confirmPassword', form.confirm)
      body.append('acceptTerms', String(form.terms))
      if (photoFile) body.append('profilePhoto', photoFile)

      const data = await signup(body)
      saveSession(data.token, data.user, true)
      if (requestedPlan === 'pro' || requestedPlan === 'business') {
        try {
          const checkout = await startCheckout(requestedPlan)
          if (checkout.url) {
            window.location.href = checkout.url
            return
          }
        } catch {
          navigate('/dashboard/settings/subscription')
          return
        }
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join CrewUp to find work, hire crews, and grow your business."
    >
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={2}>
          {error ? (
            <Alert severity="error" role="alert">
              {error}
            </Alert>
          ) : null}

          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <Avatar src={photoPreview || undefined} sx={{ width: 64, height: 64 }}>
              <PersonOutlineOutlined />
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight={600}>
                Profile photo
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                Shown in the header after you log in. Optional, max 3MB.
              </Typography>
              <Button component="label" variant="outlined" size="small">
                Choose photo
                <input type="file" accept="image/*" onChange={onPhotoChange} hidden />
              </Button>
            </Box>
          </Stack>

          <TextField
            label="Full name"
            type="text"
            name="name"
            autoComplete="name"
            placeholder="John Contractor"
            value={form.name}
            onChange={update('name')}
            required
          />

          <TextField
            label={isFindWork ? 'Email' : 'Work email'}
            type="email"
            name="email"
            autoComplete="email"
            placeholder={isFindWork ? 'you@email.com' : 'you@company.com'}
            value={form.email}
            onChange={update('email')}
            required
          />

          {!isFindWork ? (
            <TextField
              label="Company (optional)"
              type="text"
              name="company"
              autoComplete="organization"
              placeholder="Your company name"
              value={form.company}
              onChange={update('company')}
            />
          ) : null}

          <Box component="fieldset" sx={{ border: 'none', p: 0, m: 0 }}>
            <FormLabel component="legend" sx={{ fontSize: '0.85rem', fontWeight: 600, color: 'text.primary', mb: 0.75 }}>
              I am a
            </FormLabel>
            <ToggleButtonGroup
              value={form.role}
              exclusive
              fullWidth
              onChange={(e, value) => {
                if (value) update('role')({ target: { type: 'text', value } })
              }}
              sx={{ bgcolor: 'action.hover', borderRadius: '10px', p: 0.5 }}
            >
              {ROLES.map((role) => (
                <ToggleButton
                  key={role.id}
                  value={role.id}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    border: 'none',
                    borderRadius: '8px !important',
                    '&.Mui-selected': {
                      bgcolor: 'background.paper',
                      boxShadow: 1,
                      color: 'primary.main',
                      '&:hover': { bgcolor: 'background.paper' },
                    },
                  }}
                >
                  {role.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={form.password}
            onChange={update('password')}
            required
            slotProps={{
              htmlInput: { minLength: 8 },
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

          <TextField
            label="Confirm password"
            type={showConfirm ? 'text' : 'password'}
            name="confirm"
            autoComplete="new-password"
            placeholder="Re-enter password"
            value={form.confirm}
            onChange={update('confirm')}
            required
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                      onClick={() => setShowConfirm((v) => !v)}
                      edge="end"
                      size="small"
                    >
                      {showConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <FormControlLabel
            sx={{ alignItems: 'flex-start' }}
            control={<Checkbox checked={form.terms} onChange={update('terms')} required sx={{ mt: -0.75 }} />}
            label={
              <Typography variant="body2">
                I agree to the{' '}
                <Link href="#terms" fontWeight={600} underline="hover">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="#privacy" fontWeight={600} underline="hover">
                  Privacy Policy
                </Link>
              </Typography>
            }
          />

          <Button type="submit" variant="contained" size="large" disabled={loading} fullWidth>
            {loading ? 'Creating account…' : 'Create Account'}
          </Button>

          <Typography variant="body2" align="center" color="text.secondary">
            Already have an account?{' '}
            <Link component={RouterLink} to="/login" fontWeight={600} underline="hover">
              Log in
            </Link>
          </Typography>
        </Stack>
      </Box>
    </AuthLayout>
  )
}
