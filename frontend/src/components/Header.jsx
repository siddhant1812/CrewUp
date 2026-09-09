import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from './Logo'
import { clearSession, getSession, mediaUrl } from '../api/auth'

const LINKS = [
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Find Work', href: '/#find-work' },
  { label: 'Find Contractors', href: '/dashboard/find-contractors' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'Resources', href: '/#resources', dropdown: true },
]

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80'

function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const photo = mediaUrl(user.profilePhoto) || DEFAULT_AVATAR

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  return (
    <div className="user-bar" ref={ref}>
      <button type="button" className="user-bar__bell" aria-label="Notifications">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 7H3s3 0 3-7"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10 19a2 2 0 0 0 4 0"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
        <span className="user-bar__badge">2</span>
      </button>

      <button
        type="button"
        className="user-bar__profile"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="user-bar__avatar-wrap">
          <img src={photo} alt="" className="user-bar__avatar" width="40" height="40" />
          <span className="user-bar__online" aria-hidden="true" />
        </span>
        <span className="user-bar__name">{user.fullName}</span>
        <svg
          className={`user-bar__chevron${open ? ' open' : ''}`}
          width="12"
          height="8"
          viewBox="0 0 12 8"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M1 1.5l5 5 5-5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="user-bar__menu" role="menu">
          <div className="user-bar__menu-meta">
            <strong>{user.fullName}</strong>
            <span>{user.workEmail}</span>
          </div>
          <Link
            to="/dashboard"
            role="menuitem"
            className="user-bar__menu-link"
            onClick={() => setOpen(false)}
          >
            Dashboard
          </Link>
          <button type="button" role="menuitem" onClick={onLogout}>
            Log out
          </button>
        </div>
      )}
    </div>
  )
}

export default function Header({ menuOpen, setMenuOpen }) {
  const navigate = useNavigate()
  const [session, setSession] = useState(() => getSession())

  useEffect(() => {
    const sync = () => setSession(getSession())
    window.addEventListener('crewup-auth', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('crewup-auth', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  function handleLogout() {
    clearSession()
    setSession(null)
    setMenuOpen(false)
    navigate('/login')
  }

  const user = session?.user

  return (
    <header className="header">
      <div className="container header__row">
        <Link to="/" aria-label="CrewUp home">
          <Logo markSize={32} />
        </Link>

        <nav className="header__nav" aria-label="Primary">
          {LINKS.map((l) =>
            l.href.startsWith('/dashboard') ? (
              <Link key={l.label} to={l.href} className="header__link">
                {l.label}
              </Link>
            ) : (
              <a key={l.label} href={l.href} className="header__link">
                {l.label}
                {l.dropdown && (
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
                    <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                )}
              </a>
            )
          )}
        </nav>

        <div className="header__actions">
          {user ? (
            <UserMenu user={user} onLogout={handleLogout} />
          ) : (
            <>
              <Link to="/login" className="link-login">Log In</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Sign Up</Link>
            </>
          )}
        </div>

        <button
          type="button"
          className={`burger${menuOpen ? ' open' : ''}`}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span /><span /><span />
        </button>
      </div>

      {menuOpen && (
        <div className="header__drawer">
          {LINKS.map((l) =>
            l.href.startsWith('/dashboard') ? (
              <Link key={l.label} to={l.href} onClick={() => setMenuOpen(false)}>
                {l.label}
              </Link>
            ) : (
              <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)}>
                {l.label}
              </a>
            )
          )}
          <div className="header__drawer-actions">
            {user ? (
              <>
                <div className="user-bar user-bar--drawer">
                  <span className="user-bar__avatar-wrap">
                    <img
                      src={mediaUrl(user.profilePhoto) || DEFAULT_AVATAR}
                      alt=""
                      className="user-bar__avatar"
                      width="40"
                      height="40"
                    />
                    <span className="user-bar__online" aria-hidden="true" />
                  </span>
                  <span className="user-bar__name">{user.fullName}</span>
                </div>
                <button type="button" className="btn btn-outline" onClick={handleLogout}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)}>Log In</Link>
                <Link to="/signup" className="btn btn-primary" onClick={() => setMenuOpen(false)}>
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
