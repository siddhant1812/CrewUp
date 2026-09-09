import { Link } from 'react-router-dom'
import Logo from './Logo'

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="auth">
      <div className="auth__backdrop" aria-hidden="true">
        <Logo className="auth__logo-blur" markSize={420} showText />
      </div>

      <div className="auth__top">
        <Link to="/" className="auth__brand" aria-label="CrewUp home">
          <Logo markSize={34} />
        </Link>
      </div>

      <div className="auth__panel">
        <div className="auth__card">
          <h1 className="auth__title">{title}</h1>
          {subtitle && <p className="auth__subtitle">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  )
}
