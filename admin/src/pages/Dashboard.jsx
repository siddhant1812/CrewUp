import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { fetchStats } from '../api/admin'
import Icon from '../components/Icon'

function StatCard({ icon, label, value }) {
  return (
    <div className="admin-stat">
      <span className="admin-stat__icon">
        <Icon name={icon} size={18} />
      </span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  )
}

function Breakdown({ title, counts }) {
  const entries = Object.entries(counts || {})
  return (
    <div className="admin-card">
      <h3 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>{title}</h3>
      {entries.length === 0 ? (
        <p className="admin-table__sub">No data yet.</p>
      ) : (
        <div className="admin-breakdown">
          {entries.map(([key, count]) => (
            <span key={key}>
              {key.replace(/_/g, ' ')}: <b>{count}</b>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useOutletContext()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await fetchStats()
        if (!cancelled) setStats(data.stats)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load stats.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <div className="admin-topbar">
        <div>
          <h1>Platform overview</h1>
          <p>Signed in as {user.fullName}</p>
        </div>
      </div>

      {loading ? <p className="admin-table__sub">Loading…</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}

      {stats ? (
        <>
          <div className="admin-stats">
            <StatCard icon="users" label="Total users" value={stats.totalUsers} />
            <StatCard icon="folder" label="Total projects" value={stats.totalProjects} />
            <StatCard icon="fileText" label="Proposals" value={stats.totalProposals} />
            <StatCard icon="coin" label="Conversations" value={stats.totalConversations} />
          </div>

          <Breakdown title="Users by account type" counts={stats.usersByType} />
          <Breakdown title="Users by status" counts={stats.usersByStatus} />
          <Breakdown title="Projects by status" counts={stats.projectsByStatus} />
          <Breakdown title="Plans" counts={stats.planCounts} />
        </>
      ) : null}
    </>
  )
}
