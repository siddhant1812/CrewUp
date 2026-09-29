import { useEffect, useState } from 'react'
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { mediaUrl } from '../api/auth'
import { createConversation } from '../api/messages'
import { fetchProject, respondProposal, submitProposal } from '../api/projects'

const STATUS_LABELS = {
  open: 'Bidding',
  in_progress: 'Active',
  draft: 'Draft',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

function designation(type) {
  if (type === 'subcontractor') return 'Subcontractor'
  if (type === 'find_work') return 'Employee'
  return 'Contractor'
}

function formatDue(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
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

export default function ProjectDetail() {
  const { id } = useParams()
  const { user } = useOutletContext()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [isOwner, setIsOwner] = useState(false)
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const [form, setForm] = useState({ amount: '', timeline: '', proposal: '' })
  const [formError, setFormError] = useState('')
  const [selected, setSelected] = useState(null)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await fetchProject(id)
      setProject(data.project)
      setIsOwner(Boolean(data.isOwner))
      setProposals(data.proposals || [])
      setSelected((data.proposals || [])[0] || null)
    } catch (err) {
      setError(err.message || 'Failed to load project.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  async function onApply(e) {
    e.preventDefault()
    if (!form.amount.trim() || !form.proposal.trim()) {
      setFormError('Bid amount and proposal are required.')
      return
    }
    setBusy('apply')
    setFormError('')
    try {
      const data = await submitProposal(id, {
        amount: form.amount.trim(),
        timeline: form.timeline.trim(),
        proposal: form.proposal.trim(),
      })
      setProposals([data.proposal])
      setSelected(data.proposal)
      setForm({ amount: '', timeline: '', proposal: '' })
    } catch (err) {
      setFormError(err.message || 'Could not submit proposal.')
    } finally {
      setBusy('')
    }
  }

  async function onRespond(proposalId, status) {
    setBusy(proposalId)
    try {
      const data = await respondProposal(id, proposalId, status)
      setProposals((prev) => prev.map((p) => (p.id === proposalId ? data.proposal : p)))
      setSelected((cur) => (cur?.id === proposalId ? data.proposal : cur))
    } catch (err) {
      setError(err.message || 'Could not update proposal.')
    } finally {
      setBusy('')
    }
  }

  async function onMessage(person) {
    if (!person?.id) return
    setBusy(`msg-${person.id}`)
    try {
      await createConversation({
        participantId: person.id,
        projectTitle: project?.title || '',
        projectLocation: project?.location || '',
        projectType: project?.projectType || 'Commercial',
        budget: project?.budget || '',
        initialMessage: `Hi ${person.fullName}, I reviewed your proposal on ${project?.title}.`,
      })
      navigate('/dashboard/messages')
    } catch (err) {
      setError(err.message || 'Could not start a message.')
    } finally {
      setBusy('')
    }
  }

  if (loading) {
    return (
      <section className="dash-page">
        <p className="dash-empty">Loading project…</p>
      </section>
    )
  }

  if (error && !project) {
    return (
      <section className="dash-page">
        <p className="dash-empty">{error}</p>
        <Link to="/dashboard/projects" className="auth__link">
          Back to projects
        </Link>
      </section>
    )
  }

  const mine = !isOwner ? proposals[0] : null

  return (
    <section className="dash-page">
      <div className="proj-detail__top">
        <Link to="/dashboard/projects" className="proj-detail__back">
          ← Projects
        </Link>
      </div>

      {error ? <p className="dash-form-error">{error}</p> : null}

      <div className="dash-table-card proj-detail__summary">
        <div className="dash-table-card__head">
          <h1>{project.title}</h1>
          <span className={`status-pill status-pill--${project.status}`}>
            {STATUS_LABELS[project.status] || project.status}
          </span>
        </div>
        {project.image ? (
          <img
            className="proj-detail__hero"
            src={mediaUrl(project.image)}
            alt=""
          />
        ) : null}
        <dl className="proj-detail__meta">
          <div>
            <dt>Location</dt>
            <dd>{project.location || '—'}</dd>
          </div>
          <div>
            <dt>Due</dt>
            <dd>{formatDue(project.dueDate)}</dd>
          </div>
          <div>
            <dt>Budget</dt>
            <dd>{project.budget || '—'}</dd>
          </div>
          <div>
            <dt>Type</dt>
            <dd>{project.projectType || '—'}</dd>
          </div>
          <div>
            <dt>Proposals</dt>
            <dd>{isOwner ? proposals.length : project.bidsCount || 0}</dd>
          </div>
        </dl>
        <div className="proj-detail__desc">
          <h3>Project details</h3>
          <p>{project.description || 'No description was added for this project.'}</p>
        </div>
      </div>

      {isOwner ? (
        <div className="proj-split">
          <div className="dash-table-card">
            <div className="dash-table-card__head">
              <h3>Who applied</h3>
              <span className="dash-muted">{proposals.length} bid{proposals.length === 1 ? '' : 's'}</span>
            </div>
            {proposals.length === 0 ? (
              <p className="dash-empty">
                No one has applied yet. Proposals will show here when another CrewUp user bids on this job.
              </p>
            ) : (
              <ul className="proj-apply-list">
                {proposals.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className={`proj-apply-list__btn${selected?.id === p.id ? ' is-active' : ''}`}
                      onClick={() => setSelected(p)}
                    >
                      <Avatar user={p.applicant} />
                      <span>
                        <strong>{p.applicant?.company || p.applicant?.fullName}</strong>
                        <em>
                          {p.applicant?.fullName}
                          {p.applicant?.contractorType ? ` · ${designation(p.applicant.contractorType)}` : ''}
                        </em>
                      </span>
                      <b>{p.amount}</b>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="dash-table-card">
            <div className="dash-table-card__head">
              <h3>Proposal</h3>
            </div>
            {!selected ? (
              <p className="dash-empty">Select an applicant to read their proposal and bid.</p>
            ) : (
              <div className="proj-proposal">
                <div className="proj-proposal__who">
                  <Avatar user={selected.applicant} />
                  <div>
                    <strong>{selected.applicant?.fullName}</strong>
                    <span>
                      {designation(selected.applicant?.contractorType)}
                      {selected.applicant?.company ? ` · ${selected.applicant.company}` : ''}
                    </span>
                  </div>
                  <span className={`status-pill status-pill--${selected.status === 'accepted' ? 'completed' : selected.status === 'declined' ? 'cancelled' : 'open'}`}>
                    {selected.status}
                  </span>
                </div>
                <dl className="proj-detail__meta">
                  <div>
                    <dt>Bid</dt>
                    <dd>{selected.amount}</dd>
                  </div>
                  <div>
                    <dt>Timeline</dt>
                    <dd>{selected.timeline || '—'}</dd>
                  </div>
                  <div>
                    <dt>Submitted</dt>
                    <dd>{formatDue(selected.createdAt)}</dd>
                  </div>
                </dl>
                <h4>Cover proposal</h4>
                <p>{selected.proposal}</p>
                <div className="proj-proposal__actions">
                  {selected.status === 'pending' ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={busy === selected.id}
                        onClick={() => onRespond(selected.id, 'accepted')}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        disabled={busy === selected.id}
                        onClick={() => onRespond(selected.id, 'declined')}
                      >
                        Decline
                      </button>
                    </>
                  ) : null}
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={busy === `msg-${selected.applicant?.id}`}
                    onClick={() => onMessage(selected.applicant)}
                  >
                    Message
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="dash-table-card">
          <div className="dash-table-card__head">
            <h3>Your proposal</h3>
          </div>
          {mine ? (
            <div className="proj-proposal">
              <dl className="proj-detail__meta">
                <div>
                  <dt>Your bid</dt>
                  <dd>{mine.amount}</dd>
                </div>
                <div>
                  <dt>Timeline</dt>
                  <dd>{mine.timeline || '—'}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{mine.status}</dd>
                </div>
              </dl>
              <p>{mine.proposal}</p>
            </div>
          ) : project.status === 'open' ? (
            <form className="dash-project-form" onSubmit={onApply}>
              <p className="dash-page__hint">
                Apply as {user.fullName}. The project owner will see your name, bid, and proposal.
              </p>
              <div className="dash-project-form__grid">
                <label>
                  <span>Bid amount</span>
                  <input
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    placeholder="$8,500"
                    required
                  />
                </label>
                <label>
                  <span>Timeline</span>
                  <input
                    value={form.timeline}
                    onChange={(e) => setForm((f) => ({ ...f, timeline: e.target.value }))}
                    placeholder="3 weeks"
                  />
                </label>
              </div>
              <label className="dash-project-form__full">
                <span>Proposal</span>
                <textarea
                  rows={5}
                  value={form.proposal}
                  onChange={(e) => setForm((f) => ({ ...f, proposal: e.target.value }))}
                  placeholder="Scope, approach, and why you are a fit…"
                  required
                />
              </label>
              {formError ? <p className="dash-form-error">{formError}</p> : null}
              <button type="submit" className="btn btn-primary btn-sm" disabled={busy === 'apply'}>
                {busy === 'apply' ? 'Submitting…' : 'Submit proposal'}
              </button>
            </form>
          ) : (
            <p className="dash-empty">This project is not accepting new proposals.</p>
          )}
        </div>
      )}
    </section>
  )
}
