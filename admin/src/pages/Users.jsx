import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { deleteUser, fetchUsers, resetUserPassword, updateUser } from '../api/admin'
import Icon from '../components/Icon'

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Users() {
  const { user: me } = useOutletContext()
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [q, setQ] = useState('')
  const [contractorType, setContractorType] = useState('')
  const [accountStatus, setAccountStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await fetchUsers({ page, q, contractorType, accountStatus })
      setUsers(data.users || [])
      setTotal(data.total || 0)
      setPages(data.pages || 1)
    } catch (err) {
      setError(err.message || 'Failed to load users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, contractorType, accountStatus])

  function onSearch(e) {
    e.preventDefault()
    setPage(1)
    load()
  }

  async function withBusy(id, fn) {
    setBusy(id)
    setError('')
    setNotice('')
    try {
      await fn()
    } catch (err) {
      setError(err.message || 'Action failed.')
    } finally {
      setBusy('')
    }
  }

  async function toggleStatus(u) {
    const next = u.accountStatus === 'active' ? 'deactivated' : 'active'
    await withBusy(u.id, async () => {
      await updateUser(u.id, { accountStatus: next })
      setNotice(`${u.fullName} is now ${next}.`)
      load()
    })
  }

  async function toggleAdmin(u) {
    const makingAdmin = u.role !== 'admin'
    const roleToSet = makingAdmin ? 'admin' : u.contractorType === 'general_contractor' ? 'business' : 'provider'
    if (!window.confirm(`${makingAdmin ? 'Grant' : 'Revoke'} admin access for ${u.fullName}?`)) return
    await withBusy(u.id, async () => {
      await updateUser(u.id, { role: roleToSet })
      setNotice(`Admin access ${makingAdmin ? 'granted to' : 'revoked from'} ${u.fullName}.`)
      load()
    })
  }

  async function doResetPassword(u) {
    const pw = window.prompt(`New password for ${u.fullName} (min 8 characters):`)
    if (!pw) return
    await withBusy(u.id, async () => {
      await resetUserPassword(u.id, pw)
      setNotice(`Password reset for ${u.fullName}.`)
    })
  }

  async function doDelete(u) {
    if (!window.confirm(`Permanently delete ${u.fullName} (${u.workEmail})? This cannot be undone.`)) return
    await withBusy(u.id, async () => {
      await deleteUser(u.id)
      setNotice(`${u.fullName} deleted.`)
      load()
    })
  }

  return (
    <>
      <div className="admin-topbar">
        <div>
          <h1>Users</h1>
          <p>{total} total accounts</p>
        </div>
      </div>

      {error ? <p className="admin-error">{error}</p> : null}
      {notice ? <p className="admin-notice">{notice}</p> : null}

      <form className="admin-toolbar" onSubmit={onSearch}>
        <label className="admin-search">
          <Icon name="search" size={16} />
          <input
            type="search"
            placeholder="Search name, email, or company"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <select value={contractorType} onChange={(e) => setContractorType(e.target.value)}>
          <option value="">All account types</option>
          <option value="general_contractor">Contractor</option>
          <option value="subcontractor">Subcontractor</option>
          <option value="find_work">Find work</option>
        </select>
        <select value={accountStatus} onChange={(e) => setAccountStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="deactivated">Deactivated</option>
          <option value="deleted">Deleted</option>
        </select>
        <button type="submit" className="admin-btn admin-btn--sm">
          Search
        </button>
      </form>

      <div className="admin-table-wrap">
        {loading ? (
          <p className="admin-empty">Loading…</p>
        ) : users.length === 0 ? (
          <p className="admin-empty">No users match those filters.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Plan</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="admin-table__name">
                      {u.fullName} {u.role === 'admin' ? <span className="admin-pill admin-pill--admin">Admin</span> : null}
                    </div>
                    <div className="admin-table__sub">{u.workEmail}</div>
                  </td>
                  <td>{(u.contractorType || '').replace(/_/g, ' ')}</td>
                  <td>
                    <span className={`admin-pill admin-pill--${u.accountStatus}`}>{u.accountStatus}</span>
                  </td>
                  <td>{u.plan}</td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td>
                    <div className="admin-actions">
                      <button
                        type="button"
                        className="admin-btn admin-btn--outline admin-btn--sm"
                        disabled={busy === u.id}
                        onClick={() => toggleStatus(u)}
                      >
                        {u.accountStatus === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn--outline admin-btn--sm"
                        disabled={busy === u.id || u.id === me.id}
                        onClick={() => toggleAdmin(u)}
                        title={u.id === me.id ? "You can't change your own admin access" : ''}
                      >
                        {u.role === 'admin' ? 'Revoke admin' : 'Make admin'}
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn--outline admin-btn--sm"
                        disabled={busy === u.id}
                        onClick={() => doResetPassword(u)}
                      >
                        <Icon name="key" size={14} />
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn--danger admin-btn--sm"
                        disabled={busy === u.id || u.id === me.id}
                        onClick={() => doDelete(u)}
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
