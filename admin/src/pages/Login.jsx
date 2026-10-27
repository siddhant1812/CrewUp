import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { isAdmin, login } from '../api/auth'
import Icon from '../components/Icon'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ workEmail: '', password: '' })
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
    <div className="admin-auth">
      <form className="admin-auth__card" onSubmit={onSubmit}>
        <span className="admin-auth__mark">
          <Icon name="shield" size={22} />
        </span>
        <h1>CrewUp Admin</h1>
        <p>Sign in with an account that has admin access.</p>

        {error ? <p className="admin-error">{error}</p> : null}

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
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required
          />
        </label>
        <button type="submit" className="admin-btn admin-btn--block" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
