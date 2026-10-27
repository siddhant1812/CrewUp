import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { currentUser, isAdmin, logout } from '../api/auth'
import Icon from './Icon'

const NAV = [
  { to: '/', label: 'Dashboard', icon: 'home', end: true },
  { to: '/users', label: 'Users', icon: 'users' },
  { to: '/projects', label: 'Projects', icon: 'folder' },
  { to: '/proposals', label: 'Proposals', icon: 'fileText' },
]

export default function Layout() {
  const navigate = useNavigate()
  const user = currentUser()

  // Backend already rejects every /api/admin/* call for a non-admin
  // (requireAdmin), but this stops a non-admin from even seeing the shell.
  if (!user || !isAdmin()) {
    return <Navigate to="/login" replace />
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <span className="admin-sidebar__mark">
            <Icon name="shield" size={18} />
          </span>
          <div>
            <strong>CrewUp</strong>
            <span>Admin</span>
          </div>
        </div>
        <nav className="admin-nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'is-active' : '')}
            >
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <button type="button" className="admin-sidebar__logout" onClick={handleLogout}>
          <Icon name="logout" size={18} />
          <span>Log out</span>
        </button>
      </aside>
      <main className="admin-main">
        <Outlet context={{ user }} />
      </main>
    </div>
  )
}
