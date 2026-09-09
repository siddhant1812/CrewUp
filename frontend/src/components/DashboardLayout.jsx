import { useEffect, useState } from 'react'
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Logo from './Logo'
import Sidebar from './Sidebar'
import { clearSession, getSession, mediaUrl } from '../api/auth'

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80'

export default function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [session, setSession] = useState(() => getSession())
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const sync = () => setSession(getSession())
    window.addEventListener('crewup-auth', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('crewup-auth', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  if (!session?.user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  const user = session.user
  const photo = mediaUrl(user.profilePhoto) || DEFAULT_AVATAR

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
            <span className="user-bar__badge">2</span>
          </button>

          <div className="user-bar__avatar-wrap">
            <img src={photo} alt="" className="user-bar__avatar" width="40" height="40" />
            <span className="user-bar__online" aria-hidden="true" />
          </div>
          <span className="user-bar__name">{user.fullName}</span>
          <button type="button" className="dash-topbar__logout" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      <div className="dash-body">
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <div className="dash-content">
          <Outlet context={{ user }} />
        </div>
      </div>
    </div>
  )
}
