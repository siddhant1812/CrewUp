import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { mediaUrl } from '../api/auth'
import { createProject, deleteProject, fetchDashboard, fetchProjects } from '../api/projects'

const TITLES = {
  dashboard: {
    title: 'Dashboard',
    lead: 'Overview of your projects, messages, and crew activity.',
  },
  projects: {
    title: 'Projects',
    lead: 'Track active jobs, bids, and upcoming deadlines.',
  },
  'find-contractors': {
    title: 'Find Contractors',
    lead: 'Search verified subcontractors by trade and location.',
  },
  messages: {
    title: 'Messages',
    lead: 'Chat with contractors and keep project conversations in one place.',
  },
  profile: {
    title: 'My Profile',
    lead: 'Manage your public profile, photo, and company details.',
  },
  reviews: {
    title: 'Reviews',
    lead: 'See ratings and feedback from your construction network.',
  },
  saved: {
    title: 'Saved',
    lead: 'Quick access to contractors and projects you bookmarked.',
  },
  settings: {
    title: 'Settings',
    lead: 'Update account preferences, notifications, and security.',
  },
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

function ProjectsTable({ projects, emptyLabel, onDelete }) {
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
            <th>Bids</th>
            <th>Due</th>
            {onDelete ? <th /> : null}
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr key={p.id}>
              <td>
                <div className="dash-table__project">
                  <ProjectThumb project={p} />
                  <span>{p.title}</span>
                </div>
              </td>
              <td>{p.location || '—'}</td>
              <td>{p.bidsCount ?? 0}</td>
              <td>{formatDue(p.dueDate)}</td>
              {onDelete ? (
                <td>
                  <button
                    type="button"
                    className="dash-table__delete"
                    onClick={() => onDelete(p.id)}
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({
    activeProjects: 0,
    messages: 0,
    savedContractors: 0,
    projectInvites: 0,
  })
  const [recentProjects, setRecentProjects] = useState([])

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
          messages: data.stats?.messages || 0,
          savedContractors: data.stats?.savedContractors || 0,
          projectInvites: data.stats?.projectInvites || 0,
        })
        setRecentProjects(data.recentProjects || [])
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

  const statCards = [
    { value: stats.activeProjects, label: 'Active Projects' },
    { value: stats.messages, label: 'Messages' },
    { value: stats.savedContractors, label: 'Saved Contractors' },
    { value: stats.projectInvites, label: 'Project Invites' },
  ]

  return (
    <>
      <div className="dash-welcome">
        <div className="dash-welcome__text">
          <h2>Welcome back, {firstName}!</h2>
          <p>
            You&apos;re signed in as <strong>{user.workEmail}</strong>
            {user.company ? (
              <>
                {' '}
                at <strong>{user.company}</strong>
              </>
            ) : null}
            .
          </p>
        </div>
        {user.profilePhoto && (
          <img
            className="dash-welcome__photo"
            src={mediaUrl(user.profilePhoto)}
            alt=""
            width="56"
            height="56"
          />
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
          <h3>Recent Projects</h3>
          <Link to="/dashboard/projects">View all</Link>
        </div>
        {error ? <p className="dash-empty">{error}</p> : null}
        {loading ? (
          <p className="dash-empty">Loading projects…</p>
        ) : (
          <ProjectsTable
            projects={recentProjects}
            emptyLabel="No projects yet. Create one from Projects and it will show up here."
          />
        )}
      </div>
    </>
  )
}

function ProjectsSection({ user }) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '',
    location: '',
    dueDate: '',
    projectType: 'Commercial',
    budget: '',
    description: '',
    image: null,
  })

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await fetchProjects()
      setProjects(data.projects || [])
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
        budget: form.budget.trim(),
        description: form.description.trim(),
        image: form.image || undefined,
        status: 'open',
      })
      setForm({
        title: '',
        location: '',
        dueDate: '',
        projectType: 'Commercial',
        budget: '',
        description: '',
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

  return (
    <div className="dash-projects">
      <div className="dash-projects__toolbar">
        <p className="dash-page__hint">
          Projects you create appear on your dashboard under Recent Projects.
        </p>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? 'Cancel' : 'New project'}
        </button>
      </div>

      {showForm && (
        <form className="dash-project-form" onSubmit={handleCreate}>
          <div className="dash-project-form__grid">
            <label>
              <span>Title</span>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Downtown Office Build"
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
              <span>Type</span>
              <select
                value={form.projectType}
                onChange={(e) => setForm((f) => ({ ...f, projectType: e.target.value }))}
              >
                <option>Commercial</option>
                <option>Residential</option>
                <option>Industrial</option>
                <option>Infrastructure</option>
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
            emptyLabel={`No projects yet for ${user.fullName}. Create your first project above.`}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  )
}

function SectionPlaceholder({ title, user }) {
  return (
    <div className="dash-page__card">
      <h2>{title}</h2>
      <p>
        Signed in as <strong>{user.fullName}</strong>
        {user.company ? <> · {user.company}</> : null}
      </p>
      <p className="dash-page__hint">
        This {title.toLowerCase()} view uses the same layout — logo on top, sidebar below.
      </p>
    </div>
  )
}

export default function DashboardPage({ section = 'dashboard' }) {
  const { user } = useOutletContext()
  const copy = TITLES[section] || TITLES.dashboard

  return (
    <section className="dash-page">
      <div className="dash-page__header">
        <h1>{copy.title}</h1>
        <p>{copy.lead}</p>
      </div>

      {section === 'dashboard' ? (
        <DashboardHome user={user} />
      ) : section === 'projects' ? (
        <ProjectsSection user={user} />
      ) : (
        <SectionPlaceholder title={copy.title} user={user} />
      )}
    </section>
  )
}
