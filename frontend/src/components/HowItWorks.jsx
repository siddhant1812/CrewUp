import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSession } from '../api/auth'
import { fetchDashboard } from '../api/projects'

const NAV = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/dashboard/projects', label: 'Projects' },
  { to: '/dashboard/messages', label: 'Messages' },
  { to: '/dashboard/contractors', label: 'Contractors' },
  { to: '/dashboard/billing', label: 'Billing' },
]

function formatDue(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function statusLabel(status) {
  const map = {
    open: 'Bidding',
    in_progress: 'Active',
    draft: 'Draft',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }
  return map[status] || 'Open'
}

function statusClass(status) {
  if (status === 'open') return 'bidding'
  if (status === 'in_progress') return 'active'
  return (status || 'open').replace('_', '-')
}

function DashboardPreview() {
  const session = getSession()
  const firstName = session?.user?.fullName?.split(' ')[0]
  const [stats, setStats] = useState({
    activeProjects: 0,
    messages: 0,
    savedContractors: 0,
    projectInvites: 0,
  })
  const [projects, setProjects] = useState([])

  useEffect(() => {
    if (!session?.token) return
    let cancelled = false
    fetchDashboard()
      .then((data) => {
        if (cancelled) return
        setStats({
          activeProjects: data.stats?.activeProjects || 0,
          messages: data.stats?.messages || 0,
          savedContractors: data.stats?.savedContractors || 0,
          projectInvites: data.stats?.projectInvites || 0,
        })
        setProjects(data.recentProjects || [])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [session?.token])

  const cards = [
    [stats.activeProjects, 'Active Projects'],
    [stats.messages, 'Messages'],
    [stats.savedContractors, 'Saved Contractors'],
    [stats.projectInvites, 'Project Invites'],
  ]

  return (
    <div className="dash">
      <aside className="dash__side">
        <Link to="/dashboard" className="dash__logo" aria-label="Open dashboard">
          CU
        </Link>
        {NAV.map((item) => (
          <Link key={item.to} to={item.to} className={`dash__item${item.to === '/dashboard' ? ' active' : ''}`}>
            <span className="dash__dot" />
            {item.label}
          </Link>
        ))}
      </aside>
      <div className="dash__body">
        <p className="dash__hello">
          {firstName ? `Welcome back, ${firstName}!` : 'Welcome to CrewUp'}
        </p>
        <div className="dash__cards">
          {cards.map(([n, label]) => (
            <div key={label} className="dash__card">
              <strong>{n}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <div className="dash__table">
          <div className="dash__table-head">Recent Projects</div>
          {projects.length === 0 ? (
            <p className="dash__empty">No projects yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Location</th>
                  <th>Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id}>
                    <td>{p.title}</td>
                    <td>{p.location || '—'}</td>
                    <td>{formatDue(p.dueDate)}</td>
                    <td>
                      <span className={`pill pill--${statusClass(p.status)}`}>
                        {statusLabel(p.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

const STEPS = [
  {
    n: 1,
    title: 'Create Your Profile',
    text: 'Sign up as a contractor, subcontractor, or to find work, and showcase your skills, licenses, and experience.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="9" cy="6" r="2.75" stroke="currentColor" strokeWidth="1.4" />
        <path d="M3.5 15c0-2.9 2.46-5.25 5.5-5.25S14.5 12.1 14.5 15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    n: 2,
    title: 'Post or Search Projects',
    text: 'Browse jobs in your trade or post projects when you need reliable crew on site.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M12 12l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    n: 3,
    title: 'Connect With the Right Pros',
    text: 'Message verified partners, compare quotes, and build relationships that last.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M3 4.5h12v8a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 3 12.5v-8z" stroke="currentColor" strokeWidth="1.4" />
        <path d="M3 4.5L9 9.5l6-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    n: 4,
    title: 'Build Better Together',
    text: 'Stay connected, fill labor gaps fast, and grow a crew you can count on.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="6.5" cy="7" r="2.25" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="12" cy="7" r="2.25" stroke="currentColor" strokeWidth="1.4" />
        <path d="M2.5 14.5c0-2.2 1.8-4 4-4h0c.85 0 1.64.3 2.26.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M9.7 11.4A3.9 3.9 0 0 1 12 10.5h0c2.2 0 4 1.8 4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
]

export default function HowItWorks() {
  return (
    <section className="section how" id="how-it-works">
      <div className="container how__grid">
        <div className="how__visual">
          <DashboardPreview />
        </div>
        <div className="how__copy">
          <p className="eyebrow">How It Works</p>
          <h1 className="h2">How CrewUp Works</h1>
          <p className="lead">
            Whether you&apos;re hiring crew or looking for your next job, CrewUp makes
            connecting simple, fast, and reliable.
          </p>
          <ol className="steps">
            {STEPS.map((s) => (
              <li key={s.n} className="steps__item">
                <span className="steps__num">{s.n}</span>
                <span className="steps__icon">{s.icon}</span>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
