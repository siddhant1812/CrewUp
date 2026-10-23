import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Header from '../components/Header'
import FooterCta from '../components/FooterCta'
import { posterRoleLabel } from '../data/categories'
import { canApplyToJobs, canPostProjects, getSession, mediaUrl } from '../api/auth'
import { fetchJob } from '../api/jobs'

function formatDue(value) {
  if (!value) return 'Flexible'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return 'Flexible'
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const data = await fetchJob(id)
        if (!cancelled) setJob(data.job)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load job.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  function apply() {
    const session = getSession()
    const next = `/dashboard/projects/${id}`
    if (!session?.token) {
      navigate('/login', { state: { from: next } })
      return
    }
    if (!canApplyToJobs(session.user)) {
      navigate(canPostProjects(session.user) ? '/dashboard/projects' : '/dashboard')
      return
    }
    navigate(next)
  }

  const image = mediaUrl(job?.image)

  return (
    <div className="app">
      <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <main className="jobs jobs--detail">
        <div className="container">
          <Link to="/jobs" className="jobs__back">
            ← All jobs
          </Link>

          {loading ? <p className="jobs__empty">Loading job…</p> : null}
          {error ? <p className="jobs__error">{error}</p> : null}

          {job ? (
            <article className="job-detail">
              {image ? (
                <img className="job-detail__image" src={image} alt="" />
              ) : (
                <div className="job-detail__image job-detail__image--empty" />
              )}

              <div className="job-detail__body">
                <p className="eyebrow">
                  {job.projectType || 'Open job'}
                  {job.service ? ` · ${job.service}` : ''}
                </p>
                <h1>{job.title}</h1>
                <p className="job-detail__poster">
                  Posted by {job.postedBy?.company || job.postedBy?.fullName || 'a CrewUp member'}
                  {posterRoleLabel(job.postedByRole) ? ` (${posterRoleLabel(job.postedByRole)})` : ''}
                </p>

                <dl className="job-detail__meta">
                  <div>
                    <dt>Location</dt>
                    <dd>{job.location || 'Not specified'}</dd>
                  </div>
                  <div>
                    <dt>Budget</dt>
                    <dd>{job.budget || 'Ask for details'}</dd>
                  </div>
                  <div>
                    <dt>Vacancies</dt>
                    <dd>{job.vacancies || 1}</dd>
                  </div>
                  <div>
                    <dt>Due</dt>
                    <dd>{formatDue(job.dueDate)}</dd>
                  </div>
                  <div>
                    <dt>Bids</dt>
                    <dd>{job.bidsCount || 0}</dd>
                  </div>
                </dl>

                {job.trades?.length ? (
                  <div className="jobs-card__trades">
                    {job.trades.map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                ) : null}

                <h2>About this job</h2>
                <p className="job-detail__copy">
                  {job.description || 'The poster has not added a description yet.'}
                </p>

                <div className="job-detail__actions">
                  <button type="button" className="btn btn-primary btn-lg" onClick={apply}>
                    {getSession()?.token && !canApplyToJobs(getSession()?.user)
                      ? 'Go to my projects'
                      : 'Apply now'}
                  </button>
                  <Link to="/jobs" className="btn btn-outline btn-lg">
                    Back to jobs
                  </Link>
                </div>
              </div>
            </article>
          ) : null}
        </div>
      </main>
      <FooterCta />
    </div>
  )
}
