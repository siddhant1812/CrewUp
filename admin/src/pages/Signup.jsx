import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { isAdmin, signup } from '../api/auth'
import Icon from '../components/Icon'

export default function Signup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    fullName: '',
    workEmail: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAdmin()) return <Navigate to="/" replace />

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signup(form)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Could not create account.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-auth">
      <form className="admin-auth__card" onSubmit={onSubmit}>
        <span className="admin-auth__mark">
          <Icon name="shield" size={22} />
        </span>
        <h1>Create admin account</h1>
        <p>Every account created here gets full admin access.</p>

        {error ? <p className="admin-error">{error}</p> : null}

        <label className="admin-field">
          Full name
          <input
            type="text"
            autoComplete="name"
            value={form.fullName}
            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            required
          />
        </label>
        <label className="admin-field">
          Email
          <input
            type="email"
            autoComplete="username"
            value={form.workEmail}
            onChange={(e) => setForm((f) => ({ ...f, workEmail: e.target.value }))}
            required
          />
        </label>
        <label className="admin-field">
          Password
          <input
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            minLength={8}
            required
          />
        </label>
        <label className="admin-field">
          Confirm password
          <input
            type="password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
            minLength={8}
            required
          />
        </label>
        <button type="submit" className="admin-btn admin-btn--block" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
        <p className="admin-auth__switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  )
}
