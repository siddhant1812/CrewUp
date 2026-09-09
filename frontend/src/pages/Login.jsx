import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
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
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to manage projects, crews, and opportunities."
    >
      <form className="auth__form" onSubmit={handleSubmit} noValidate>
        {error && <p className="auth__error" role="alert">{error}</p>}

        <label className="field">
          <span className="field__label">Email</span>
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
          <span className="field__label">Password</span>
          <div className="field__password">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={form.password}
              onChange={update('password')}
              required
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

        <div className="auth__row">
          <label className="check">
            <input
              type="checkbox"
              checked={form.remember}
              onChange={update('remember')}
            />
            <span>Remember me</span>
          </label>
          <Link to="/forgot-password" className="auth__link">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-lg auth__submit"
          disabled={loading}
        >
          {loading ? 'Logging in…' : 'Log In'}
        </button>

        <div className="auth__divider"><span>or</span></div>

        <button type="button" className="btn btn-outline btn-lg auth__social" disabled>
          Continue with Google
        </button>

        <p className="auth__switch">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="auth__link">Sign up</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
