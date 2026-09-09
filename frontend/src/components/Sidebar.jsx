import { NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { clearSession } from '../api/auth'
import { fetchUnreadCount } from '../api/messages'

const NAV = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    end: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    to: '/dashboard/projects',
    label: 'Projects',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M8 7V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <rect x="4" y="7" width="16" height="13" rx="2" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    ),
  },
  {
    to: '/dashboard/find-contractors',
    label: 'Find Contractors',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M5.5 19c0-3.038 2.91-5.5 6.5-5.5s6.5 2.462 6.5 5.5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    to: '/dashboard/messages',
    label: 'Messages',
    badgeKey: 'messages',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7A2.5 2.5 0 0 1 16.5 16H9l-4 3.5V6.5z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    to: '/dashboard/profile',
    label: 'My Profile',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M5.5 19c0-3.038 2.91-5.5 6.5-5.5s6.5 2.462 6.5 5.5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    to: '/dashboard/reviews',
    label: 'Reviews',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 3.5l2.4 4.86 5.36.78-3.88 3.78.92 5.34L12 15.9l-4.8 2.36.92-5.34-3.88-3.78 5.36-.78L12 3.5z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    to: '/dashboard/saved',
    label: 'Saved',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M7 4.5h10a1 1 0 0 1 1 1V20l-6-3.5L6 20V5.5a1 1 0 0 1 1-1z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    to: '/dashboard/settings',
    label: 'Settings',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M12 3.5v2.2M12 18.3v2.2M4.9 6.5l1.6 1.6M17.5 16l1.6 1.6M3.5 12h2.2M18.3 12h2.2M4.9 17.5l1.6-1.6M17.5 8l1.6-1.6"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
]

export default function Sidebar({ mobileOpen, onClose }) {
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await fetchUnreadCount()
        if (!cancelled) setUnread(data.count || 0)
      } catch {
        if (!cancelled) setUnread(0)
      }
    }

    load()
    const onRefresh = () => load()
    const onUnread = (e) => {
      if (typeof e.detail?.count === 'number') setUnread(e.detail.count)
      else load()
    }
    window.addEventListener('crewup-messages-refresh', onRefresh)
    window.addEventListener('crewup-unread', onUnread)
    const interval = setInterval(load, 15000)
    return () => {
      cancelled = true
      window.removeEventListener('crewup-messages-refresh', onRefresh)
      window.removeEventListener('crewup-unread', onUnread)
      clearInterval(interval)
    }
  }, [])

  function handleLogout() {
    clearSession()
    navigate('/login')
  }

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="sidebar__backdrop"
          aria-label="Close menu"
          onClick={onClose}
        />
      )}

      <aside className={`sidebar${mobileOpen ? ' is-open' : ''}`} aria-label="Dashboard">
        <nav className="sidebar__nav">
          {NAV.map((item) => {
            const badge =
              item.badgeKey === 'messages' && unread > 0 ? unread : null
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `sidebar__link${isActive ? ' is-active' : ''}`
                }
                onClick={onClose}
              >
                <span className="sidebar__icon">{item.icon}</span>
                <span className="sidebar__label">{item.label}</span>
                {badge != null && (
                  <span className="sidebar__badge">{badge > 99 ? '99+' : badge}</span>
                )}
              </NavLink>
            )
          })}
        </nav>

        <button type="button" className="sidebar__logout" onClick={handleLogout}>
          <span className="sidebar__icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M10 7V5.5A1.5 1.5 0 0 1 11.5 4h7A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 10 18.5V17"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
              <path
                d="M14 12H4m0 0l2.5-2.5M4 12l2.5 2.5"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="sidebar__label">Log Out</span>
        </button>
      </aside>
    </>
  )
}
