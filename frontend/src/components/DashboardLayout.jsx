import { useEffect, useState } from 'react'
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Logo from './Logo'
import Sidebar from './Sidebar'
import AccountDrawer from './AccountDrawer'
import ThemeToggle from './ThemeToggle'
import Icon from './Icon'
import { clearSession, getSession, mediaUrl } from '../api/auth'
import { connectSocket, disconnectSocket } from '../api/socket'

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

  useEffect(() => {
    if (!session?.token) {
      disconnectSocket()
      return undefined
    }

    const socket = connectSocket()
    if (!socket) return undefined

    function onUnreadCount(payload) {
      if (typeof payload?.count === 'number') {
        window.dispatchEvent(
          new CustomEvent('crewup-unread', { detail: { count: payload.count } })
        )
      }
    }

    function onIncoming() {
      window.dispatchEvent(new Event('crewup-messages-refresh'))
    }

    socket.on('unread:count', onUnreadCount)
    socket.on('message:new', onIncoming)
    socket.on('conversation:new', onIncoming)

    return () => {
      socket.off('unread:count', onUnreadCount)
      socket.off('message:new', onIncoming)
      socket.off('conversation:new', onIncoming)
    }
  }, [session?.token])

  if (!session?.user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  const user = session.user
  const photo = mediaUrl(user.profilePhoto)

  function handleLogout() {
    disconnectSocket()
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
          <ThemeToggle />
          <button type="button" className="user-bar__bell" aria-label="Notifications">
            <Icon name="bell" size={19} />
            {unread > 0 ? <span className="user-bar__badge" aria-hidden="true" /> : null}
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
            <Icon name="chevronDown" size={16} className="user-bar__chevron-icon" />
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
