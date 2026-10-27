import { useEffect, useState } from 'react'
import { fetchProposals } from '../api/admin'

const STATUSES = ['pending', 'accepted', 'declined', 'withdrawn']

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Proposals() {
  const [proposals, setProposals] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    ;(async () => {
      try {
        const data = await fetchProposals({ page, status })
        if (cancelled) return
        setProposals(data.proposals || [])
        setTotal(data.total || 0)
        setPages(data.pages || 1)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load proposals.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [page, status])

  return (
    <>
      <div className="admin-topbar">
        <div>
          <h1>Proposals</h1>
          <p>{total} total bids placed across every project</p>
        </div>
      </div>

      {error ? <p className="admin-error">{error}</p> : null}

      <form className="admin-toolbar" onSubmit={(e) => e.preventDefault()}>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </form>

      <div className="admin-table-wrap">
        {loading ? (
          <p className="admin-empty">Loading…</p>
        ) : proposals.length === 0 ? (
          <p className="admin-empty">No proposals match those filters.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Project</th>
                <th>Bid</th>
                <th>Status</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {proposals.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="admin-table__name">{p.applicant?.fullName || 'Unknown'}</div>
                    <div className="admin-table__sub">{p.applicant?.workEmail || ''}</div>
                  </td>
                  <td>{p.project?.title || '—'}</td>
                  <td>{p.amount}</td>
                  <td>
                    <span
                      className={`admin-pill ${
                        p.status === 'accepted'
                          ? 'admin-pill--active'
                          : p.status === 'declined'
                            ? 'admin-pill--cancelled'
                            : ''
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td>{formatDate(p.createdAt)}</td>
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
