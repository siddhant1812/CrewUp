import { useState } from 'react'
import { Link } from 'react-router-dom'
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
    <AuthLayout
      title="Reset your password"
      subtitle="We'll email you a link to choose a new password."
    >
      {sent ? (
        <div className="auth__success" role="status">
          <p>
            If an account exists for <strong>{email}</strong>, you&apos;ll get a reset link
            shortly. Check your inbox and spam folder.
          </p>
          <Link to="/login" className="btn btn-primary btn-lg auth__submit">
            Back to Log In
          </Link>
          <button
            type="button"
            className="auth__link auth__resend"
            onClick={() => setSent(false)}
          >
            Try a different email
          </button>
        </div>
      ) : (
        <form className="auth__form" onSubmit={handleSubmit} noValidate>
          {error && <p className="auth__error" role="alert">{error}</p>}

          <label className="field">
            <span className="field__label">Email</span>
            <input
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
          </label>

          <button type="submit" className="btn btn-primary btn-lg auth__submit">
            Send Reset Link
          </button>

          <p className="auth__switch">
            Remember your password?{' '}
            <Link to="/login" className="auth__link">Log in</Link>
          </p>
        </form>
      )}
    </AuthLayout>
  )
}
