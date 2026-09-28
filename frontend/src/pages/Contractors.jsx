import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { mediaUrl } from '../api/auth'
import { createConversation } from '../api/messages'
import { fetchProjects } from '../api/projects'
import {
  fetchContractors,
  fetchInvites,
  fetchSavedContractors,
  respondInvite,
  sendInvite,
  toggleSavedContractor,
} from '../api/contractors'

function typeLabel(type) {
  if (type === 'subcontractor') return 'Subcontractor'
  if (type === 'find_work') return 'Find Work'
  return 'Contractor'
}

function Avatar({ user }) {
  const src = mediaUrl(user?.profilePhoto)
  if (src) return <img src={src} alt="" width="44" height="44" />
  const initials = (user?.fullName || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('')
  return <span className="msg-avatar-fallback">{initials}</span>
}

export default function Contractors() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [type, setType] = useState('')
  const [list, setList] = useState([])
  const [mode, setMode] = useState('saved')
  const [projects, setProjects] = useState([])
  const [invites, setInvites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [inviteFor, setInviteFor] = useState(null)
  const [projectId, setProjectId] = useState('')
  const [busy, setBusy] = useState('')

  async function loadSaved() {
    setLoading(true)
    setError('')
    setMode('saved')
    try {
      const data = await fetchSavedContractors()
      setList(data.contractors || [])
    } catch (err) {
      setError(err.message || 'Failed to load saved contractors.')
    } finally {
      setLoading(false)
    }
  }

  async function loadList() {
    const q = query.trim()
    if (q.length < 2) {
      await loadSaved()
      return
    }
    setLoading(true)
    setError('')
    setMode('search')
    try {
      const data = await fetchContractors({ q, type })
      setList(data.contractors || [])
    } catch (err) {
      setError(err.message || 'Failed to load contractors.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSaved()
  }, [])

  useEffect(() => {
    fetchProjects()
      .then((d) => setProjects(d.projects || []))
      .catch(() => setProjects([]))
    fetchInvites('received')
      .then((d) => setInvites((d.invites || []).filter((i) => i.status === 'pending')))
      .catch(() => setInvites([]))
  }, [])

  async function onSearch(e) {
    e.preventDefault()
    await loadList()
  }

  async function onSave(id) {
    setBusy(id)
    try {
      const data = await toggleSavedContractor(id)
      setList((prev) => prev.map((c) => (c.id === id ? { ...c, saved: data.saved } : c)))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  async function onMessage(person) {
    setBusy(person.id)
    try {
      const data = await createConversation({
        participantId: person.id,
        projectTitle: '',
        initialMessage: `Hi ${person.fullName}, I'd like to connect on CrewUp.`,
      })
      navigate('/dashboard/messages')
      return data
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  async function onInvite(e) {
    e.preventDefault()
    if (!inviteFor || !projectId) return
    setBusy('invite')
    try {
      await sendInvite({ contractorId: inviteFor.id, projectId })
      setInviteFor(null)
      setProjectId('')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  return (
    <section className="dash-page">
      <div className="dash-page__header">
        <h1>Contractors</h1>
        <p>Search CrewUp users to save, message, or invite onto a project.</p>
      </div>

      {invites.length > 0 && (
        <div className="dash-table-card" style={{ marginBottom: '1rem' }}>
          <div className="dash-table-card__head">
            <h3>Project invites for you</h3>
          </div>
          <ul className="set-list" style={{ padding: '0 1.1rem 1rem' }}>
            {invites.map((inv) => (
              <li key={inv.id}>
                <div>
                  <strong>{inv.project?.title || 'Project'}</strong>
                  <span>
                    From {inv.from?.fullName}
                    {inv.project?.location ? ` · ${inv.project.location}` : ''}
                  </span>
                </div>
                <span>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() =>
                      respondInvite(inv.id, 'accepted').then(() =>
                        setInvites((prev) => prev.filter((i) => i.id !== inv.id))
                      )
                    }
                  >
                    Accept
                  </button>{' '}
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() =>
                      respondInvite(inv.id, 'declined').then(() =>
                        setInvites((prev) => prev.filter((i) => i.id !== inv.id))
                      )
                    }
                  >
                    Decline
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form className="dash-projects__toolbar" onSubmit={onSearch}>
        <input
          type="search"
          placeholder="Search name, company, or location"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1, minWidth: 180, border: '1.5px solid var(--line)', borderRadius: 10, padding: '0.6rem 0.75rem' }}
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={{ border: '1.5px solid var(--line)', borderRadius: 10, padding: '0.6rem 0.75rem' }}
        >
          <option value="">All types</option>
          <option value="general_contractor">Contractors</option>
          <option value="subcontractor">Subcontractors</option>
          <option value="find_work">Find work</option>
        </select>
        <button type="submit" className="btn btn-primary btn-sm">
          Search
        </button>
      </form>

      {error ? <p className="dash-form-error">{error}</p> : null}

      <div className="dash-table-card">
        {loading ? <p className="dash-empty">Loading contractors…</p> : null}
        {!loading && list.length === 0 ? (
          <p className="dash-empty">
            {mode === 'search'
              ? 'No matching contractors.'
              : 'No saved contractors yet. Search by name or company to find CrewUp users.'}
          </p>
        ) : (
          <ul className="set-list" style={{ padding: '0.85rem 1.1rem 1rem' }}>
            {list.map((c) => (
              <li key={c.id}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <Avatar user={c} />
                  <div>
                    <strong>{c.company || c.fullName}</strong>
                    <span>
                      {c.fullName} · {typeLabel(c.contractorType)}
                      {c.location ? ` · ${c.location}` : ''}
                    </span>
                  </div>
                </div>
                <span style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={busy === c.id}
                    onClick={() => onSave(c.id)}
                  >
                    {c.saved ? 'Saved' : 'Save'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={busy === c.id}
                    onClick={() => onMessage(c)}
                  >
                    Message
                  </button>
                  {projects.length > 0 && (
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => setInviteFor(c)}>
                      Invite
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {inviteFor && (
        <form className="set-card" onSubmit={onInvite}>
          <h3>Invite {inviteFor.fullName} to a project</h3>
          <label className="set-field">
            <span>Project</span>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} required>
              <option value="">Select a project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-primary btn-sm" disabled={busy === 'invite'}>
              Send invite
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setInviteFor(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
