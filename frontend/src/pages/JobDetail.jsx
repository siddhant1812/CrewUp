import { useEffect, useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { Alert, Box, Button, Chip, Container, Paper, Stack, Typography } from '@mui/material'
import { ArrowBack } from '@mui/icons-material'
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

const STATS = [
  { key: 'location', icon: 'pin', label: 'Location', fallback: 'Not specified' },
  { key: 'budget', icon: 'coin', label: 'Budget', fallback: 'Ask for details' },
  { key: 'vacancies', icon: 'users', label: 'Vacancies', fallback: 1, accent: true },
  { key: 'due', icon: 'calendar', label: 'Due' },
  { key: 'bids', icon: 'fileText', label: 'Bids', fallback: 0 },
]

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
  const statValues = job
    ? {
        location: job.location,
        budget: job.budget,
        vacancies: job.vacancies || 1,
        due: formatDue(job.dueDate),
        bids: job.bidsCount || 0,
      }
    : {}

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <Box
        component="main"
        sx={{
          flex: 1,
          py: { xs: 4, md: 5 },
          bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#16303f' : '#f2f8fd'),
        }}
      >
        <Container maxWidth="md">
          <Button
            component={RouterLink}
            to="/jobs"
            startIcon={<ArrowBack fontSize="small" />}
            sx={{ mb: 2.5, color: 'primary.main', fontWeight: 600 }}
          >
            All jobs
          </Button>

          {loading ? (
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '14px', color: 'text.secondary' }}>
              Loading job…
            </Paper>
          ) : null}
          {error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : null}

          {job ? (
            <Paper variant="outlined" sx={{ borderRadius: '18px', overflow: 'hidden' }}>
              {image ? (
                <Box component="img" src={image} alt="" sx={{ width: '100%', height: 240, objectFit: 'cover', display: 'block' }} />
              ) : (
                <Box
                  aria-hidden="true"
                  sx={{
                    width: '100%',
                    height: 240,
                    display: 'grid',
                    placeItems: 'center',
                    background: 'linear-gradient(135deg, #dff0fc, #eef7fe)',
                  }}
                >
                  <IconBadge icon="building" size={56} iconSize={26} />
                </Box>
              )}

              <Box sx={{ p: { xs: 2.5, sm: '1.5rem 1.35rem 1.75rem' } }}>
                <Typography
                  variant="overline"
                  sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: '0.08em' }}
                >
                  {job.projectType || 'Open job'}
                  {job.service ? ` · ${job.service}` : ''}
                </Typography>
                <Typography variant="h1" sx={{ fontSize: { xs: '1.6rem', md: '2.1rem' }, color: 'secondary.main', mb: 1 }}>
                  {job.title}
                </Typography>
                <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', color: 'text.secondary', mb: 2.5 }}>
                  <Icon name="user" size={15} />
                  <Typography color="text.secondary">
                    Posted by {job.postedBy?.company || job.postedBy?.fullName || 'a CrewUp member'}
                    {posterRoleLabel(job.postedByRole) ? ` (${posterRoleLabel(job.postedByRole)})` : ''}
                  </Typography>
                </Stack>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(5, 1fr)' },
                    gap: 1.25,
                    mb: 2.5,
                  }}
                >
                  {STATS.map((stat) => (
                    <Paper
                      key={stat.key}
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        borderRadius: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        bgcolor: stat.accent ? 'primary.light' : 'background.paper',
                        borderColor: stat.accent ? 'primary.main' : 'divider',
                      }}
                    >
                      <IconBadge icon={stat.icon} size={38} tone={stat.accent ? 'blue' : 'muted'} />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {stat.label}
                        </Typography>
                        <Typography fontWeight={700} color="secondary.main" noWrap>
                          {statValues[stat.key] || stat.fallback}
                        </Typography>
                      </Box>
                    </Paper>
                  ))}
                </Box>

                {job.trades?.length ? (
                  <Stack direction="row" useFlexGap spacing={0.75} sx={{ flexWrap: 'wrap', mb: 2 }}>
                    {job.trades.map((t) => (
                      <Chip key={t} label={t} size="small" sx={{ bgcolor: 'primary.light', color: 'secondary.main', fontWeight: 600 }} />
                    ))}
                  </Stack>
                ) : null}

                <Typography variant="h2" sx={{ fontSize: '1.05rem', color: 'secondary.main', mt: 1, mb: 1 }}>
                  About this job
                </Typography>
                <Typography color="text.secondary" sx={{ whiteSpace: 'pre-wrap', mb: 3 }}>
                  {job.description || 'The poster has not added a description yet.'}
                </Typography>

                <Stack direction="row" useFlexGap spacing={1.25} sx={{ flexWrap: 'wrap' }}>
                  <Button variant="contained" size="large" onClick={apply}>
                    {getSession()?.token && !canApplyToJobs(getSession()?.user) ? 'Go to my projects' : 'Apply now'}
                  </Button>
                  <Button component={RouterLink} to="/jobs" variant="outlined" size="large">
                    Back to jobs
                  </Button>
                </Stack>
              </Box>
            </Paper>
          ) : null}
        </Container>
      </Box>
      <FooterCta />
    </Box>
  )
}
