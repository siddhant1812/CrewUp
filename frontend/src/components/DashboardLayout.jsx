import { useEffect, useState } from 'react'
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Logo from './Logo'
import Sidebar from './Sidebar'
import AccountDrawer from './AccountDrawer'
import { clearSession, getSession, mediaUrl } from '../api/auth'

function initials(name) {
  return (name || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('')
}

export default function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [session, setSession] = useState(() => getSession())
  const [mobileOpen, setMobileOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [accountOpen, setAccountOpen] = useState(false)

  useEffect(() => {
    setAccountOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const sync = () => setSession(getSession())
    const onUnread = (e) => {
      if (typeof e.detail?.count === 'number') setUnread(e.detail.count)
    }
    window.addEventListener('crewup-auth', sync)
    window.addEventListener('storage', sync)
    window.addEventListener('crewup-unread', onUnread)
    return () => {
      window.removeEventListener('crewup-auth', sync)
      window.removeEventListener('storage', sync)
      window.removeEventListener('crewup-unread', onUnread)
    }
  }, [])

  if (!session?.user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  const user = session.user
  const photo = mediaUrl(user.profilePhoto)

  function handleLogout() {
    clearSession()
    navigate('/login')
  }

  return (
    <div className="dash-shell">
      <header className="dash-topbar">
        <div className="dash-topbar__left">
          <button
            type="button"
            className="dash-topbar__menu"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <span /><span /><span />
          </button>
          <Link to="/" className="dash-topbar__logo" aria-label="CrewUp home">
            <Logo markSize={32} />
          </Link>
        </div>

        <div className="dash-topbar__user">
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
            {unread > 0 ? (
              <span className="user-bar__badge">{unread > 99 ? '99+' : unread}</span>
            ) : null}
          </button>

          <button
            type="button"
            className="user-bar__profile"
            aria-expanded={accountOpen}
            aria-haspopup="dialog"
            onClick={() => setAccountOpen(true)}
          >
            <div className="user-bar__avatar-wrap">
              {photo ? (
                <img src={photo} alt="" className="user-bar__avatar" width="40" height="40" />
              ) : (
                <span className="user-bar__avatar user-bar__avatar--fallback">
                  {initials(user.fullName)}
                </span>
              )}
              <span className="user-bar__online" aria-hidden="true" />
            </div>
            <span className="user-bar__name">{user.fullName}</span>
          </button>
        </div>
      </header>

      <AccountDrawer
        user={user}
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        onLogout={handleLogout}
      />

      <div className="dash-body">
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <div className="dash-content">
          <Outlet context={{ user }} />
        </div>
      </div>
    </div>
  )
}
