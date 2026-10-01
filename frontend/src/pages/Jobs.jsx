import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Header from '../components/Header'
import FooterCta from '../components/FooterCta'
import { mediaUrl } from '../api/auth'
import { browseJobs } from '../api/jobs'
import { TRADES } from '../data/trades'

function formatDue(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function JobThumb({ job }) {
  const src = mediaUrl(job.image)
  if (src) return <img src={src} alt="" />
  return <span className="jobs-card__thumb-fallback" aria-hidden="true" />
}

export default function Jobs() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const [q, setQ] = useState(searchParams.get('q') || '')
  const [jobs, setJobs] = useState([])
  const [filters, setFilters] = useState({ trades: [], locations: [] })
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const trade = searchParams.get('trade') || ''
  const location = searchParams.get('location') || ''
  const query = searchParams.get('q') || ''

  const tradeOptions = useMemo(() => {
    const extra = filters.trades.filter((t) => !TRADES.includes(t))
    return [...TRADES, ...extra]
  }, [filters.trades])

  useEffect(() => {
    setQ(query)
  }, [query])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const data = await browseJobs({ q: query, trade, location })
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
  }, [query, trade, location])

  function applyFilters(next) {
    const params = {}
    if (next.q?.trim()) params.q = next.q.trim()
    if (next.trade) params.trade = next.trade
    if (next.location) params.location = next.location
    setSearchParams(params)
  }

  function onSearch(e) {
    e.preventDefault()
    applyFilters({ q, trade, location })
  }

  return (
    <div className="app">
      <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <main className="jobs">
        <div className="container">
          <div className="jobs__hero">
            <p className="eyebrow">Find Work</p>
            <h1>Browse open jobs</h1>
            <p>Search projects by trade, location, and keywords, then apply with a proposal.</p>
          </div>

          <form className="jobs__filters" onSubmit={onSearch}>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title, trade, or company"
              aria-label="Search jobs"
            />
            <select
              value={trade}
              onChange={(e) => applyFilters({ q, trade: e.target.value, location })}
              aria-label="Filter by trade"
            >
              <option value="">All trades</option>
              {tradeOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <select
              value={location}
              onChange={(e) => applyFilters({ q, trade, location: e.target.value })}
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

          <div className="jobs__chips" aria-label="Popular trades">
            {TRADES.slice(0, 8).map((name) => (
              <button
                key={name}
                type="button"
                className={`jobs__chip${trade === name ? ' is-active' : ''}`}
                onClick={() => applyFilters({ q, trade: trade === name ? '' : name, location })}
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
              No open jobs match those filters yet. Try another trade or location.
            </p>
          ) : (
            <div className="jobs__grid">
              {jobs.map((job) => (
                <article key={job.id} className="jobs-card">
                  <JobThumb job={job} />
                  <div className="jobs-card__body">
                    <p className="jobs-card__type">{job.projectType || 'Project'}</p>
                    <h2>{job.title}</h2>
                    <p className="jobs-card__desc">
                      {job.description || 'No description posted yet.'}
                    </p>
                    <ul className="jobs-card__facts">
                      {job.location ? <li>{job.location}</li> : null}
                      {job.budget ? <li>{job.budget}</li> : null}
                      {formatDue(job.dueDate) ? <li>Due {formatDue(job.dueDate)}</li> : null}
                      <li>{job.bidsCount || 0} bids</li>
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
