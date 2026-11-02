import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteProject, fetchProject, updateProject } from '../api/admin'
import Icon from '../components/Icon'

const STATUSES = ['draft', 'open', 'in_progress', 'completed', 'cancelled']
const POSTED_BY_ROLES = ['contractor', 'subcontractor']

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

function toDateInput(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

function emptyForm() {
  return {
    title: '',
    status: 'open',
    postedByRole: 'contractor',
    projectType: '',
    service: '',
    location: '',
    budget: '',
    vacancies: 1,
    dueDate: '',
    trades: '',
    description: '',
  }
}

function formFromProject(project) {
  return {
    title: project.title || '',
    status: project.status || 'open',
    postedByRole: project.postedByRole || 'contractor',
    projectType: project.projectType || '',
    service: project.service || '',
    location: project.location || '',
    budget: project.budget || '',
    vacancies: project.vacancies || 1,
    dueDate: toDateInput(project.dueDate),
    trades: (project.trades || []).join(', '),
    description: project.description || '',
  }
}

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await fetchProject(id)
      setProject(data.project)
      setForm(formFromProject(data.project))
    } catch (err) {
      setError(err.message || 'Failed to load project.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
    setSaved(false)
  }

  async function onSave(e) {
    e.preventDefault()
    if (!form.title.trim()) {
      setError('Title cannot be empty.')
      return
    }
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const data = await updateProject(id, {
        title: form.title.trim(),
        status: form.status,
        postedByRole: form.postedByRole,
        projectType: form.projectType.trim(),
        service: form.service.trim(),
        location: form.location.trim(),
        budget: form.budget.trim(),
        vacancies: form.vacancies,
        dueDate: form.dueDate || null,
        trades: form.trades,
        description: form.description.trim(),
      })
      setProject((prev) => ({ ...prev, ...data.project }))
      setForm(formFromProject(data.project))
      setSaved(true)
    } catch (err) {
      setError(err.message || 'Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  async function onDelete() {
    if (!project) return
    if (!window.confirm(`Permanently delete "${project.title}" and its proposals? This cannot be undone.`)) return
    setDeleting(true)
    setError('')
    try {
      await deleteProject(id)
      navigate('/projects')
    } catch (err) {
      setError(err.message || 'Failed to delete project.')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <>
        <Link to="/projects" className="admin-back-link">
          <Icon name="arrowLeft" size={15} /> Back to Projects
        </Link>
        <p className="admin-empty">Loading project…</p>
      </>
    )
  }

  if (error && !project) {
    return (
      <>
        <Link to="/projects" className="admin-back-link">
          <Icon name="arrowLeft" size={15} /> Back to Projects
        </Link>
        <p className="admin-error">{error}</p>
      </>
    )
  }

  return (
    <>
      <Link to="/projects" className="admin-back-link">
        <Icon name="arrowLeft" size={15} /> Back to Projects
      </Link>

      <div className="admin-topbar">
        <div>
          <h1>{project.title}</h1>
          <p>
            {project.proposalCount ?? project.bidsCount} proposal
            {(project.proposalCount ?? project.bidsCount) === 1 ? '' : 's'} · Created {formatDate(project.createdAt)}
          </p>
        </div>
        <button
          type="button"
          className="admin-btn admin-btn--danger admin-btn--sm"
          disabled={deleting}
          onClick={onDelete}
        >
          <Icon name="trash" size={14} />
          {deleting ? 'Deleting…' : 'Delete project'}
        </button>
      </div>

      {error ? <p className="admin-error">{error}</p> : null}

      <form className="admin-card" onSubmit={onSave}>
        <h2>Project details</h2>

        <div className="admin-detail-meta">
          <div>
            <span>Posted by</span>
            <strong>{project.createdBy?.fullName || 'Unknown'}</strong>
          </div>
          <div>
            <span>Email</span>
            <strong>{project.createdBy?.workEmail || '—'}</strong>
          </div>
          <div>
            <span>Account type</span>
            <strong>{(project.createdBy?.contractorType || '—').replace(/_/g, ' ')}</strong>
          </div>
          <div>
            <span>Bids</span>
            <strong>{project.bidsCount}</strong>
          </div>
          <div>
            <span>Last updated</span>
            <strong>{formatDate(project.updatedAt)}</strong>
          </div>
        </div>

        <div className="admin-form-grid">
          <label className="admin-field">
            Title
            <input value={form.title} onChange={(e) => set('title', e.target.value)} required />
          </label>
          <label className="admin-field">
            Status
            <select value={form.status} onChange={(e) => set('status', e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-field">
            Posted by role
            <select value={form.postedByRole} onChange={(e) => set('postedByRole', e.target.value)}>
              {POSTED_BY_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-field">
            Location
            <input value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Austin, TX" />
          </label>
          <label className="admin-field">
            Project type / category
            <input value={form.projectType} onChange={(e) => set('projectType', e.target.value)} />
          </label>
          <label className="admin-field">
            Service
            <input value={form.service} onChange={(e) => set('service', e.target.value)} />
          </label>
          <label className="admin-field">
            Budget
            <input value={form.budget} onChange={(e) => set('budget', e.target.value)} placeholder="$5,000" />
          </label>
          <label className="admin-field">
            Vacancies
            <input
              type="number"
              min={1}
              max={1000}
              value={form.vacancies}
              onChange={(e) => set('vacancies', e.target.value)}
            />
          </label>
          <label className="admin-field">
            Due date
            <input type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
          </label>
          <label className="admin-field admin-form-grid--full">
            Trades (comma separated)
            <input value={form.trades} onChange={(e) => set('trades', e.target.value)} placeholder="Electrical, Plumbing" />
          </label>
          <label className="admin-field admin-form-grid--full">
            Description
            <textarea
              rows={6}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="No description was added for this project."
            />
          </label>
        </div>

        <div className="admin-form-actions">
          <button type="submit" className="admin-btn" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          {saved ? (
            <span className="admin-form-actions__saved">
              <Icon name="check" size={14} /> Saved
            </span>
          ) : null}
        </div>
      </form>
    </>
  )
}
