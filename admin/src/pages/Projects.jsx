import { useEffect, useState } from 'react'
import { deleteProject, fetchProjects, updateProjectStatus } from '../api/admin'
import Icon from '../components/Icon'

const STATUSES = ['draft', 'open', 'in_progress', 'completed', 'cancelled']

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await fetchProjects({ page, q, status })
      setProjects(data.projects || [])
      setTotal(data.total || 0)
      setPages(data.pages || 1)
    } catch (err) {
      setError(err.message || 'Failed to load projects.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status])

  function onSearch(e) {
    e.preventDefault()
    setPage(1)
    load()
  }

  async function onStatusChange(p, nextStatus) {
    setBusy(p.id)
    setError('')
    setNotice('')
    try {
      await updateProjectStatus(p.id, nextStatus)
      setNotice(`${p.title} is now ${nextStatus.replace('_', ' ')}.`)
      load()
    } catch (err) {
      setError(err.message || 'Failed to update status.')
    } finally {
      setBusy('')
    }
  }

  async function onDelete(p) {
    if (!window.confirm(`Permanently delete "${p.title}" and its proposals? This cannot be undone.`)) return
    setBusy(p.id)
    setError('')
    setNotice('')
    try {
      await deleteProject(p.id)
      setNotice(`"${p.title}" deleted.`)
      load()
    } catch (err) {
      setError(err.message || 'Failed to delete project.')
    } finally {
      setBusy('')
    }
  }

  return (
    <>
      <div className="admin-topbar">
        <div>
          <h1>Projects</h1>
          <p>{total} total projects, across every contractor and subcontractor</p>
        </div>
      </div>

      {error ? <p className="admin-error">{error}</p> : null}
      {notice ? <p className="admin-notice">{notice}</p> : null}

      <form className="admin-toolbar" onSubmit={onSearch}>
        <label className="admin-search">
          <Icon name="search" size={16} />
          <input
            type="search"
            placeholder="Search title or location"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>
        <button type="submit" className="admin-btn admin-btn--sm">
          Search
        </button>
      </form>

      <div className="admin-table-wrap">
        {loading ? (
          <p className="admin-empty">Loading…</p>
        ) : projects.length === 0 ? (
          <p className="admin-empty">No projects match those filters.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Posted by</th>
                <th>Status</th>
                <th>Bids</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="admin-table__name">{p.title}</div>
                    <div className="admin-table__sub">
                      {[p.projectType, p.location].filter(Boolean).join(' · ') || '—'}
                    </div>
                  </td>
                  <td>
                    <div>{p.createdBy?.fullName || 'Unknown'}</div>
                    <div className="admin-table__sub">{p.createdBy?.workEmail || ''}</div>
                  </td>
                  <td>
                    <span className={`admin-pill admin-pill--${p.status}`}>{p.status.replace('_', ' ')}</span>
                  </td>
                  <td>{p.bidsCount}</td>
                  <td>{formatDate(p.createdAt)}</td>
                  <td>
                    <div className="admin-actions">
                      <select
                        className="admin-inline-select"
                        value={p.status}
                        disabled={busy === p.id}
                        onChange={(e) => onStatusChange(p, e.target.value)}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="admin-btn admin-btn--danger admin-btn--sm"
                        disabled={busy === p.id}
                        onClick={() => onDelete(p)}
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pages > 1 ? (
        <div className="admin-pager">
          <span>
            Page {page} of {pages}
          </span>
          <div className="admin-pager__pages">
            {Array.from({ length: Math.min(7, pages) }, (_, i) => i + 1).map((n) => (
              <button key={n} type="button" className={page === n ? 'is-active' : ''} onClick={() => setPage(n)}>
                {n}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </>
  )
}
