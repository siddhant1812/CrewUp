import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { signup, saveSession } from '../api/auth'
import { startCheckout } from '../api/billing'

const ROLES = [
  { id: 'general_contractor', label: 'General Contractor' },
  { id: 'subcontractor', label: 'Subcontractor' },
]

export default function SignUp() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const requestedPlan = (searchParams.get('plan') || '').toLowerCase()
  const [showPassword, setShowPassword] = useState(false)
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
      body.append('company', form.company.trim())
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
          navigate('/dashboard/settings')
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
      <form className="auth__form" onSubmit={handleSubmit} noValidate>
        {error && <p className="auth__error" role="alert">{error}</p>}

        <div className="photo-field">
          <div className="photo-field__preview">
            {photoPreview ? (
              <img src={photoPreview} alt="Profile preview" />
            ) : (
              <span className="photo-field__placeholder">Photo</span>
            )}
          </div>
          <div className="photo-field__meta">
            <span className="field__label">Profile photo</span>
            <p className="photo-field__hint">Shown in the header after you log in. Optional, max 3MB.</p>
            <label className="btn btn-outline btn-sm photo-field__btn">
              Choose photo
              <input
                type="file"
                accept="image/*"
                onChange={onPhotoChange}
                hidden
              />
            </label>
          </div>
        </div>

        <label className="field">
          <span className="field__label">Full name</span>
          <input
            type="text"
            name="name"
            autoComplete="name"
            placeholder="John Contractor"
            value={form.name}
            onChange={update('name')}
            required
          />
        </label>

        <label className="field">
          <span className="field__label">Work email</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={form.email}
            onChange={update('email')}
            required
          />
        </label>

        <label className="field">
          <span className="field__label">
            Company <span className="field__optional">(optional)</span>
          </span>
          <input
            type="text"
            name="company"
            autoComplete="organization"
            placeholder="Your company name"
            value={form.company}
            onChange={update('company')}
          />
        </label>

        <fieldset className="field">
          <legend className="field__label">I am a</legend>
          <div className="role-toggle">
            {ROLES.map((role) => (
              <label
                key={role.id}
                className={`role-toggle__option${form.role === role.id ? ' active' : ''}`}
              >
                <input
                  type="radio"
                  name="role"
                  value={role.id}
                  checked={form.role === role.id}
                  onChange={update('role')}
                />
                {role.label}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="field">
          <span className="field__label">Password</span>
          <div className="field__password">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={update('password')}
              required
              minLength={8}
            />
            <button
              type="button"
              className="field__toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </label>

        <label className="field">
          <span className="field__label">Confirm password</span>
          <input
            type={showPassword ? 'text' : 'password'}
            name="confirm"
            autoComplete="new-password"
            placeholder="Re-enter password"
            value={form.confirm}
            onChange={update('confirm')}
            required
          />
        </label>

        <label className="check check--block">
          <input
            type="checkbox"
            checked={form.terms}
            onChange={update('terms')}
            required
          />
          <span>
            I agree to the{' '}
            <a href="#terms" className="auth__link">Terms of Service</a>
            {' '}and{' '}
            <a href="#privacy" className="auth__link">Privacy Policy</a>
          </span>
        </label>

        <button
          type="submit"
          className="btn btn-primary btn-lg auth__submit"
          disabled={loading}
        >
          {loading ? 'Creating account…' : 'Create Account'}
        </button>

        <p className="auth__switch">
          Already have an account?{' '}
          <Link to="/login" className="auth__link">Log in</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
