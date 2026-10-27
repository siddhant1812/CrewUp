import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Header from '../components/Header'
import FooterCta from '../components/FooterCta'
import { getSession, mediaUrl } from '../api/auth'
import { browseJobs } from '../api/jobs'
import {
  ALL_CATEGORIES,
  CONTRACTOR_CATEGORIES,
  SUBCONTRACTOR_CATEGORIES,
  posterRoleLabel,
} from '../data/categories'
import Icon from '../components/Icon'
import IconBadge from '../components/IconBadge'

function formatDue(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function JobThumb({ job }) {
  const src = mediaUrl(job.image)
  if (src) return <img src={src} alt="" />
  return (
    <span className="jobs-card__thumb-fallback" aria-hidden="true">
      <IconBadge icon="building" size={48} iconSize={22} />
    </span>
  )
}

// Contractors and subcontractors only ever see contractor-posted jobs (the
// backend enforces this too), so the "posted by" filter is moot for them.
function postsRestrictedToContractors(user) {
  return Boolean(
    user && user.role !== 'admin' &&
      (user.contractorType === 'general_contractor' || user.contractorType === 'subcontractor')
  )
}

export default function Jobs() {
  const [menuOpen, setMenuOpen] = useState(false)
  const restrictedViewer = postsRestrictedToContractors(getSession()?.user)
  const [searchParams, setSearchParams] = useSearchParams()
  const [q, setQ] = useState(searchParams.get('q') || '')
  const [jobs, setJobs] = useState([])
  const [filters, setFilters] = useState({ trades: [], locations: [] })
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const type = searchParams.get('type') || ''
  const role = searchParams.get('role') || ''
  const location = searchParams.get('location') || ''
  const query = searchParams.get('q') || ''

  useEffect(() => {
    setQ(query)
  }, [query])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const data = await browseJobs({ q: query, type, role, location })
        if (cancelled) return
        setJobs(data.jobs || [])
        setTotal(data.total || 0)
        setFilters({
          trades: data.filters?.trades || [],
          locations: data.filters?.locations || [],
        })
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load jobs.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [query, type, role, location])

  function applyFilters(next) {
    const params = {}
    if (next.q?.trim()) params.q = next.q.trim()
    if (next.type) params.type = next.type
    if (next.role) params.role = next.role
    if (next.location) params.location = next.location
    setSearchParams(params)
  }

  function onSearch(e) {
    e.preventDefault()
    applyFilters({ q, type, role, location })
  }

  return (
    <div className="app">
      <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <main className="jobs">
        <div className="container">
          <div className="jobs__hero">
            <p className="eyebrow">Find Work</p>
            <h1>Browse open jobs</h1>
            <p>Search projects by category, location, and keywords, then apply with a proposal.</p>
            {restrictedViewer ? (
              <p className="jobs__hero-note">Showing projects posted by general contractors.</p>
            ) : null}
          </div>

          <form className="jobs__filters" onSubmit={onSearch}>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title, category, or company"
              aria-label="Search jobs"
            />
            {restrictedViewer ? null : (
              <select
                value={role}
                onChange={(e) => applyFilters({ q, type, role: e.target.value, location })}
                aria-label="Filter by poster"
              >
                <option value="">Contractors &amp; subcontractors</option>
                <option value="contractor">Posted by contractors</option>
                <option value="subcontractor">Posted by subcontractors</option>
              </select>
            )}
            <select
              value={type}
              onChange={(e) => applyFilters({ q, type: e.target.value, role, location })}
              aria-label="Filter by category"
            >
              <option value="">All categories</option>
              <optgroup label="Project types">
                {Object.keys(CONTRACTOR_CATEGORIES).map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Trade categories">
                {Object.keys(SUBCONTRACTOR_CATEGORIES).map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </optgroup>
            </select>
            <select
              value={location}
              onChange={(e) => applyFilters({ q, type, role, location: e.target.value })}
              aria-label="Filter by location"
            >
              <option value="">All locations</option>
              {filters.locations.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <button type="submit" className="btn btn-primary btn-sm jobs__search-btn">
              Search
            </button>
          </form>

          <div className="jobs__chips" aria-label="Popular categories">
            {Object.keys(ALL_CATEGORIES).slice(0, 8).map((name) => (
              <button
                key={name}
                type="button"
                className={`jobs__chip${type === name ? ' is-active' : ''}`}
                onClick={() => applyFilters({ q, type: type === name ? '' : name, role, location })}
              >
                {name}
              </button>
            ))}
          </div>

          <div className="jobs__meta">
            {loading ? 'Loading jobs…' : `${total} open ${total === 1 ? 'job' : 'jobs'}`}
          </div>

          {error ? <p className="jobs__error">{error}</p> : null}

          {!loading && jobs.length === 0 ? (
            <p className="jobs__empty">
              No open jobs match those filters yet. Try another category or location.
            </p>
          ) : (
            <div className="jobs__grid">
              {jobs.map((job) => (
                <article key={job.id} className="jobs-card">
                  <JobThumb job={job} />
                  <div className="jobs-card__body">
                    <p className="jobs-card__type">
                      {job.projectType || 'Project'}
                      {job.service ? ` · ${job.service}` : ''}
                      {posterRoleLabel(job.postedByRole) ? ` · ${posterRoleLabel(job.postedByRole)}` : ''}
                    </p>
                    <h2>{job.title}</h2>
                    <p className="jobs-card__desc">
                      {job.description || 'No description posted yet.'}
                    </p>
                    <ul className="jobs-card__facts">
                      {job.location ? (
                        <li>
                          <Icon name="pin" size={13} /> {job.location}
                        </li>
                      ) : null}
                      {job.budget ? (
                        <li>
                          <Icon name="coin" size={13} /> {job.budget}
                        </li>
                      ) : null}
                      <li>
                        <Icon name="users" size={13} /> {job.vacancies || 1}{' '}
                        {(job.vacancies || 1) === 1 ? 'vacancy' : 'vacancies'}
                      </li>
                      {formatDue(job.dueDate) ? (
                        <li>
                          <Icon name="calendar" size={13} /> Due {formatDue(job.dueDate)}
                        </li>
                      ) : null}
                      <li>
                        <Icon name="fileText" size={13} /> {job.bidsCount || 0} bids
                      </li>
                    </ul>
                    {job.trades?.length ? (
                      <div className="jobs-card__trades">
                        {job.trades.slice(0, 3).map((t) => (
                          <span key={t}>{t}</span>
                        ))}
                      </div>
                    ) : null}
                    <div className="jobs-card__foot">
                      <span>
                        <Icon name="user" size={13} />
                        {job.postedBy?.company || job.postedBy?.fullName || 'CrewUp member'}
                      </span>
                      <Link to={`/jobs/${job.id}`} className="btn btn-primary btn-sm">
                        View job
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
      <FooterCta />
    </div>
  )
}
