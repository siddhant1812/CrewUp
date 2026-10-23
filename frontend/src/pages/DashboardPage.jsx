import { useEffect, useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import { accountKindOf, canPostProjects, mediaUrl } from '../api/auth'
import { categoriesFor } from '../data/categories'
import {
  createProject,
  deleteProject,
  fetchDashboard,
  fetchOpenProjects,
  fetchProjects,
  updateProject,
} from '../api/projects'

const TITLES = {
  dashboard: {
    title: 'Dashboard',
    lead: 'Overview of your projects, messages, and crew activity.',
  },
  projects: {
    title: 'Projects',
    lead: 'Track jobs you posted, or browse open work to bid on.',
  },
}

const STATUS_OPTIONS = [
  { value: 'open', label: 'Bidding' },
  { value: 'in_progress', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

function statusMeta(status) {
  return STATUS_OPTIONS.find((s) => s.value === status) || { value: status, label: status || 'Open' }
}

function formatDue(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function ProjectThumb({ project }) {
  const src = mediaUrl(project.image)
  if (src) {
    return <img src={src} alt="" width="48" height="36" />
  }
  return <span className="dash-table__thumb-fallback" aria-hidden="true" />
}

function StatusPill({ status }) {
  const meta = statusMeta(status)
  return <span className={`status-pill status-pill--${meta.value}`}>{meta.label}</span>
}

function ProjectsTable({ projects, emptyLabel, onDelete, onStatus }) {
  const navigate = useNavigate()

  if (!projects.length) {
    return <p className="dash-empty">{emptyLabel}</p>
  }

  return (
    <div className="dash-table-wrap">
      <table className="dash-table">
        <thead>
          <tr>
            <th>Project</th>
            <th>Location</th>
            <th>Due</th>
            <th>Status</th>
            {onDelete ? <th /> : null}
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr
              key={p.id}
              className="dash-table__click"
              onClick={() => navigate(`/dashboard/projects/${p.id}`)}
            >
              <td>
                <div className="dash-table__project">
                  <ProjectThumb project={p} />
                  <span>{p.title}</span>
                </div>
              </td>
              <td>{p.location || '—'}</td>
              <td>{formatDue(p.dueDate)}</td>
              <td>
                {onStatus ? (
                  <select
                    className={`status-select status-pill--${p.status}`}
                    value={p.status || 'open'}
                    onChange={(e) => onStatus(p.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Status for ${p.title}`}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <StatusPill status={p.status} />
                )}
              </td>
              {onDelete ? (
                <td>
                  <button
                    type="button"
                    className="dash-table__delete"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(p.id)
                    }}
                  >
                    Delete
                  </button>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DashboardHome({ user }) {
  const firstName = user.fullName.split(' ')[0]
  const kind = accountKindOf(user)
  const isWorker = kind === 'worker'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({
    activeProjects: 0,
    openJobs: 0,
    myBids: 0,
    messages: 0,
    savedContractors: 0,
    projectInvites: 0,
  })
  const [recentProjects, setRecentProjects] = useState([])
  const [recommendedJobs, setRecommendedJobs] = useState([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const data = await fetchDashboard()
        if (cancelled) return
        setStats({
          activeProjects: data.stats?.activeProjects || 0,
          openJobs: data.stats?.openJobs || 0,
          myBids: data.stats?.myBids || 0,
          messages: data.stats?.messages || 0,
          savedContractors: data.stats?.savedContractors || 0,
          projectInvites: data.stats?.projectInvites || 0,
        })
        setRecentProjects(data.recentProjects || [])
        setRecommendedJobs(data.recommendedJobs || [])
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load dashboard.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const statCards = isWorker
    ? [
        { value: stats.openJobs, label: 'Open Jobs' },
        { value: stats.myBids, label: 'Your Bids' },
        { value: stats.messages, label: 'Messages' },
        { value: stats.projectInvites, label: 'Invites' },
      ]
    : [
        { value: stats.activeProjects, label: 'Active Projects' },
        { value: stats.messages, label: 'Messages' },
        { value: stats.savedContractors, label: 'Saved Crew' },
        { value: stats.projectInvites, label: 'Invites Sent' },
      ]

  return (
    <>
      <div className="dash-welcome">
        <div className="dash-welcome__text">
          <h2>Welcome back, {firstName}!</h2>
          <p>
            {isWorker
              ? 'Find open work, submit proposals, and keep up with messages.'
              : 'Post jobs, review bids, and hire crew from one place.'}
          </p>
        </div>
        {isWorker ? (
          <Link to="/jobs" className="btn btn-primary btn-sm">
            Browse jobs
          </Link>
        ) : (
          <Link to="/dashboard/projects" className="btn btn-primary btn-sm">
            Post a project
          </Link>
        )}
      </div>

      <div className="dash-stats">
        {statCards.map((s) => (
          <article key={s.label} className="dash-stat">
            <strong>{loading ? '—' : s.value}</strong>
            <span>{s.label}</span>
          </article>
        ))}
      </div>

      <div className="dash-table-card">
        <div className="dash-table-card__head">
          <h3>{isWorker ? 'Jobs for you' : 'Recent Projects'}</h3>
          <Link to={isWorker ? '/jobs' : '/dashboard/projects'}>View all</Link>
        </div>
        {error ? <p className="dash-empty">{error}</p> : null}
        {loading ? (
          <p className="dash-empty">Loading…</p>
        ) : (
          <ProjectsTable
            projects={isWorker ? recommendedJobs : recentProjects}
            emptyLabel={
              isWorker
                ? 'No open jobs yet. Check Browse Jobs as contractors post work.'
                : 'No projects yet. Create one from My Projects and it will show up here.'
            }
          />
        )}
      </div>
    </>
  )
}

function ProjectsSection({ user }) {
  const [projects, setProjects] = useState([])
  const [openJobs, setOpenJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '',
    location: '',
    dueDate: '',
    projectType: '',
    service: '',
    budget: '',
    vacancies: 1,
    description: '',
    trades: '',
    status: 'open',
    image: null,
  })

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await fetchProjects()
      setProjects(data.projects || [])
      try {
        const open = await fetchOpenProjects()
        setOpenJobs(open.projects || [])
      } catch {
        setOpenJobs([])
      }
    } catch (err) {
      setError(err.message || 'Failed to load projects.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.title.trim()) {
      setFormError('Project title is required.')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      await createProject({
        title: form.title.trim(),
        location: form.location.trim(),
        dueDate: form.dueDate || undefined,
        projectType: form.projectType,
        service: form.service || undefined,
        budget: form.budget.trim(),
        vacancies: Number(form.vacancies) || 1,
        description: form.description.trim(),
        trades: form.trades
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        image: form.image || undefined,
        status: form.status,
      })
      setForm({
        title: '',
        location: '',
        dueDate: '',
        projectType: '',
        service: '',
        budget: '',
    vacancies: 1,
        description: '',
        trades: '',
        status: 'open',
        image: null,
      })
      setShowForm(false)
      await load()
    } catch (err) {
      setFormError(err.message || 'Could not create project.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this project?')) return
    try {
      await deleteProject(id)
      setProjects((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      setError(err.message || 'Could not delete project.')
    }
  }

  async function handleStatus(id, status) {
    const previous = projects
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)))
    try {
      const data = await updateProject(id, { status })
      if (data.project) {
        setProjects((prev) => prev.map((p) => (p.id === id ? data.project : p)))
      }
    } catch (err) {
      setProjects(previous)
      setError(err.message || 'Could not update status.')
    }
  }

  const canPost = canPostProjects(user)
  const isContractor = user.contractorType === 'general_contractor'
  const categories = categoriesFor(user.contractorType)

  return (
    <div className="dash-projects">
      <div className="dash-projects__toolbar">
        <p className="dash-page__hint">
          {canPost
            ? 'Projects you create appear on your dashboard under Recent Projects.'
            : 'Browse open jobs below and apply from the job page. Only contractors and subcontractors can post projects.'}
        </p>
        {canPost ? (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? 'Cancel' : 'New project'}
          </button>
        ) : (
          <Link to="/jobs" className="btn btn-primary btn-sm">
            Browse jobs
          </Link>
        )}
      </div>

      {canPost && showForm && (
        <form className="dash-project-form" onSubmit={handleCreate}>
          <div className="dash-project-form__grid">
            <label>
              <span>Title</span>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Project title"
                required
              />
            </label>
            <label>
              <span>Location</span>
              <input
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="Denver, CO"
              />
            </label>
            <label>
              <span>Due date</span>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </label>
            <label>
              <span>Budget</span>
              <input
                value={form.budget}
                onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                placeholder="$250,000 – $500,000"
              />
            </label>
            <label>
              <span>Vacancies (workers needed)</span>
              <input
                type="number"
                min="1"
                value={form.vacancies}
                onChange={(e) => setForm((f) => ({ ...f, vacancies: e.target.value }))}
              />
            </label>
            <label>
              <span>{isContractor ? 'Project type' : 'Trade category'}</span>
              <select
                value={form.projectType}
                onChange={(e) =>
                  setForm((f) => ({ ...f, projectType: e.target.value, service: '' }))
                }
                required
              >
                <option value="">
                  {isContractor ? 'Select project type' : 'Select trade category'}
                </option>
                {Object.keys(categories).map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{isContractor ? 'Project' : 'Service'}</span>
              <select
                value={form.service}
                onChange={(e) => setForm((f) => ({ ...f, service: e.target.value }))}
                disabled={!form.projectType}
              >
                <option value="">Any / not specific</option>
                {(categories[form.projectType] || []).map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Status</span>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setForm((f) => ({ ...f, image: e.target.files?.[0] || null }))
                }
              />
            </label>
          </div>
          <label className="dash-project-form__full">
            <span>Trades needed</span>
            <input
              value={form.trades}
              onChange={(e) => setForm((f) => ({ ...f, trades: e.target.value }))}
              placeholder="Electrical, Plumbing, HVAC"
            />
          </label>
          <label className="dash-project-form__full">
            <span>Description</span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Scope, trades needed, notes…"
            />
          </label>
          {formError ? <p className="dash-form-error">{formError}</p> : null}
          <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
            {saving ? 'Creating…' : 'Create project'}
          </button>
        </form>
      )}

      <div className="dash-table-card">
        <div className="dash-table-card__head">
          <h3>Your projects</h3>
          <span className="dash-muted">{projects.length} total</span>
        </div>
        {error ? <p className="dash-empty">{error}</p> : null}
        {loading ? (
          <p className="dash-empty">Loading projects…</p>
        ) : (
          <ProjectsTable
            projects={projects}
            emptyLabel={
              canPost
                ? `No projects yet for ${user.fullName}. Create your first project above.`
                : 'You have not posted projects. This list is for jobs you create as a general contractor.'
            }
            onDelete={canPost ? handleDelete : undefined}
            onStatus={canPost ? handleStatus : undefined}
          />
        )}
      </div>

      <div className="dash-table-card" style={{ marginTop: '1rem' }}>
        <div className="dash-table-card__head">
          <h3>Open jobs to bid on</h3>
          <Link to="/jobs">Browse all</Link>
        </div>
        <ProjectsTable
          projects={openJobs}
          emptyLabel="No open jobs from other users yet. When someone posts a project, you can apply from here."
        />
      </div>
    </div>
  )
}

export default function DashboardPage({ section = 'dashboard' }) {
  const { user } = useOutletContext()
  const copy = TITLES[section] || TITLES.dashboard
  const worker = accountKindOf(user) === 'worker' && !canPostProjects(user)
  const header = {
    ...copy,
    ...(section === 'projects' && worker
      ? {
          title: 'Work',
          lead: 'See jobs you can bid on. Contractors and subcontractors post the listings.',
        }
      : {}),
  }

  return (
    <section className="dash-page">
      {section !== 'dashboard' ? (
        <div className="dash-page__header">
          <h1>{header.title}</h1>
          <p>{header.lead}</p>
        </div>
      ) : null}

      {section === 'dashboard' ? (
        <DashboardHome user={user} />
      ) : (
        <ProjectsSection user={user} />
      )}
    </section>
  )
}
