import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { canDo, clearSession, getSession } from '../api/auth'
import { fetchUnreadCount } from '../api/messages'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', end: true },
  { to: '/dashboard/projects', label: 'My Projects', permission: 'manageProjects' },
  { to: '/jobs', label: 'Browse Jobs', permission: 'browseJobs' },
  { to: '/dashboard/messages', label: 'Messages', badgeKey: 'messages' },
  { to: '/dashboard/contractors', label: 'Find Crew', permission: 'hire' },
  { to: '/dashboard/contractors', label: 'Companies', hideIf: 'hire' },
  { to: '/dashboard/billing', label: 'Billing' },
  {
    to: '/dashboard/settings/account',
    match: '/dashboard/settings',
    label: 'Settings',
  },
]

export default function Sidebar({ mobileOpen, onClose }) {
  const navigate = useNavigate()
  const location = useLocation()
  const user = getSession()?.user
  const [unread, setUnread] = useState(0)
  const links = NAV.filter((item) => {
    if (item.permission && !canDo(item.permission, user)) return false
    if (item.hideIf && canDo(item.hideIf, user)) return false
    return true
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await fetchUnreadCount()
        if (!cancelled) {
          const count = data.count || 0
          setUnread(count)
          window.dispatchEvent(new CustomEvent('crewup-unread', { detail: { count } }))
        }
      } catch {
        if (!cancelled) setUnread(0)
      }
    }

    load()
    const onRefresh = () => load()
    const onUnread = (e) => {
      if (typeof e.detail?.count === 'number') setUnread(e.detail.count)
    }
    window.addEventListener('crewup-messages-refresh', onRefresh)
    window.addEventListener('crewup-unread', onUnread)
    const interval = setInterval(load, 60000)
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
        <div className="sidebar__brand">
          <span className="sidebar__cu">CU</span>
        </div>
        <nav className="sidebar__nav">
          {links.map((item) => {
            const badge =
              item.badgeKey === 'messages' && unread > 0 ? unread : null
            return (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.end}
                className={({ isActive }) => {
                  const nested =
                    item.match && location.pathname.startsWith(item.match)
                  return `sidebar__link${isActive || nested ? ' is-active' : ''}`
                }}
                onClick={onClose}
              >
                <span className="sidebar__dot" aria-hidden="true" />
                <span className="sidebar__label">{item.label}</span>
                {badge != null && (
                  <span className="sidebar__badge">{badge > 99 ? '99+' : badge}</span>
                )}
              </NavLink>
            )
          })}
        </nav>

        <button type="button" className="sidebar__logout" onClick={handleLogout}>
          <span className="sidebar__label">Log Out</span>
        </button>
      </aside>
    </>
  )
}
