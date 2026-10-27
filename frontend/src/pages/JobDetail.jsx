import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Header from '../components/Header'
import FooterCta from '../components/FooterCta'
import { posterRoleLabel } from '../data/categories'
import { canApplyToJobs, canPostProjects, getSession, mediaUrl } from '../api/auth'
import { fetchJob } from '../api/jobs'
import Icon from '../components/Icon'
import IconBadge from '../components/IconBadge'

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
                <div className="job-detail__image job-detail__image--empty">
                  <IconBadge icon="building" size={56} iconSize={26} />
                </div>
              )}

              <div className="job-detail__body">
                <p className="eyebrow">
                  {job.projectType || 'Open job'}
                  {job.service ? ` · ${job.service}` : ''}
                </p>
                <h1>{job.title}</h1>
                <p className="job-detail__poster">
                  <Icon name="user" size={15} /> Posted by{' '}
                  {job.postedBy?.company || job.postedBy?.fullName || 'a CrewUp member'}
                  {posterRoleLabel(job.postedByRole) ? ` (${posterRoleLabel(job.postedByRole)})` : ''}
                </p>

                <div className="proj-stats job-detail__stats">
                  <div className="proj-stat">
                    <IconBadge icon="pin" size={38} />
                    <div className="proj-stat__body">
                      <span>Location</span>
                      <strong>{job.location || 'Not specified'}</strong>
                    </div>
                  </div>
                  <div className="proj-stat">
                    <IconBadge icon="coin" size={38} />
                    <div className="proj-stat__body">
                      <span>Budget</span>
                      <strong>{job.budget || 'Ask for details'}</strong>
                    </div>
                  </div>
                  <div className="proj-stat proj-stat--accent">
                    <IconBadge icon="users" size={38} />
                    <div className="proj-stat__body">
                      <span>Vacancies</span>
                      <strong>{job.vacancies || 1}</strong>
                    </div>
                  </div>
                  <div className="proj-stat">
                    <IconBadge icon="calendar" size={38} />
                    <div className="proj-stat__body">
                      <span>Due</span>
                      <strong>{formatDue(job.dueDate)}</strong>
                    </div>
                  </div>
                  <div className="proj-stat">
                    <IconBadge icon="fileText" size={38} />
                    <div className="proj-stat__body">
                      <span>Bids</span>
                      <strong>{job.bidsCount || 0}</strong>
                    </div>
                  </div>
                </div>

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
