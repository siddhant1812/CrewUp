import { useEffect, useState } from 'react'
import { Link as RouterLink, useSearchParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Search } from '@mui/icons-material'
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

const POPULAR_CATEGORIES = Object.keys(ALL_CATEGORIES).slice(0, 8)

function formatDue(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function JobThumb({ job }) {
  const src = mediaUrl(job.image)
  if (src) {
    return (
      <Box
        component="img"
        src={src}
        alt=""
        sx={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }}
      />
    )
  }
  return (
    <Box
      aria-hidden="true"
      sx={{
        width: '100%',
        height: 180,
        display: 'grid',
        placeItems: 'center',
        background: 'linear-gradient(135deg, #dff0fc, #eef7fe)',
      }}
    >
      <IconBadge icon="building" size={48} iconSize={22} />
    </Box>
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
        <Container maxWidth="lg">
          <Box sx={{ maxWidth: '40rem', mb: 3 }}>
            <Typography
              variant="overline"
              sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: '0.08em' }}
            >
              Find Work
            </Typography>
            <Typography variant="h1" sx={{ fontSize: { xs: '1.8rem', md: '2.5rem' }, letterSpacing: '-0.03em', mb: 0.5, color: 'secondary.main' }}>
              Browse open jobs
            </Typography>
            <Typography color="text.secondary">
              Search projects by category, location, and keywords, then apply with a proposal.
            </Typography>
          </Box>

          <Box
            component="form"
            onSubmit={onSearch}
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: restrictedViewer
                  ? '1.6fr 1fr 1fr 7.5rem'
                  : '1.4fr 0.85fr 0.85fr 0.85fr 7.5rem',
              },
              gap: 1,
              mb: 1.5,
              alignItems: 'stretch',
            }}
          >
            <TextField
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title, category, or company"
              aria-label="Search jobs"
              slotProps={{ input: { startAdornment: <Search fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /> } }}
            />
            {restrictedViewer ? null : (
              <Select
                value={role}
                onChange={(e) => applyFilters({ q, type, role: e.target.value, location })}
                displayEmpty
                aria-label="Filter by poster"
              >
                <MenuItem value="">Contractors &amp; subcontractors</MenuItem>
                <MenuItem value="contractor">Posted by contractors</MenuItem>
                <MenuItem value="subcontractor">Posted by subcontractors</MenuItem>
              </Select>
            )}
            <Select
              value={type}
              onChange={(e) => applyFilters({ q, type: e.target.value, role, location })}
              displayEmpty
              aria-label="Filter by category"
            >
              <MenuItem value="">All categories</MenuItem>
              <ListSubheaderLike>Project types</ListSubheaderLike>
              {Object.keys(CONTRACTOR_CATEGORIES).map((name) => (
                <MenuItem key={name} value={name} sx={{ pl: 3 }}>
                  {name}
                </MenuItem>
              ))}
              <ListSubheaderLike>Trade categories</ListSubheaderLike>
              {Object.keys(SUBCONTRACTOR_CATEGORIES).map((name) => (
                <MenuItem key={name} value={name} sx={{ pl: 3 }}>
                  {name}
                </MenuItem>
              ))}
            </Select>
            <Select
              value={location}
              onChange={(e) => applyFilters({ q, type, role, location: e.target.value })}
              displayEmpty
              aria-label="Filter by location"
            >
              <MenuItem value="">All locations</MenuItem>
              {filters.locations.map((name) => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
              ))}
            </Select>
            <Button type="submit" variant="contained" sx={{ minHeight: 46 }}>
              Search
            </Button>
          </Box>

          <Select
            value={POPULAR_CATEGORIES.includes(type) ? type : ''}
            onChange={(e) => applyFilters({ q, type: e.target.value, role, location })}
            displayEmpty
            aria-label="Popular categories"
            fullWidth
            sx={{ mb: 2 }}
          >
            <MenuItem value="">Popular categories</MenuItem>
            {POPULAR_CATEGORIES.map((name) => (
              <MenuItem key={name} value={name}>
                {name}
              </MenuItem>
            ))}
          </Select>

          <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
            {loading ? 'Loading jobs…' : `${total} open ${total === 1 ? 'job' : 'jobs'}`}
          </Typography>

          {error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : null}

          {!loading && jobs.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '14px', color: 'text.secondary' }}>
              No open jobs match those filters yet. Try another category or location.
            </Paper>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
              }}
            >
              {jobs.map((job) => (
                <Paper
                  key={job.id}
                  variant="outlined"
                  sx={{
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(16, 30, 40, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <JobThumb job={job} />
                  <Box sx={{ p: '1.1rem 1.15rem 1.2rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <Typography
                      variant="caption"
                      sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', mb: 0.5 }}
                    >
                      {job.projectType || 'Project'}
                      {job.service ? ` · ${job.service}` : ''}
                      {posterRoleLabel(job.postedByRole) ? ` · ${posterRoleLabel(job.postedByRole)}` : ''}
                    </Typography>
                    <Typography variant="h6" sx={{ fontSize: '1.15rem', color: 'secondary.main', letterSpacing: '-0.02em', mb: 0.5 }}>
                      {job.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 1,
                        minHeight: '2.7em',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {job.description || 'No description posted yet.'}
                    </Typography>

                    <Stack
                      direction="row"
                      useFlexGap
                      spacing={1.25}
                      sx={{ flexWrap: 'wrap', color: 'text.secondary', fontSize: '0.82rem', mb: 1 }}
                    >
                      {job.location ? (
                        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                          <Icon name="pin" size={13} /> {job.location}
                        </Box>
                      ) : null}
                      {job.budget ? (
                        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                          <Icon name="coin" size={13} /> {job.budget}
                        </Box>
                      ) : null}
                      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                        <Icon name="users" size={13} /> {job.vacancies || 1}{' '}
                        {(job.vacancies || 1) === 1 ? 'vacancy' : 'vacancies'}
                      </Box>
                      {formatDue(job.dueDate) ? (
                        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                          <Icon name="calendar" size={13} /> Due {formatDue(job.dueDate)}
                        </Box>
                      ) : null}
                      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                        <Icon name="fileText" size={13} /> {job.bidsCount || 0} bids
                      </Box>
                    </Stack>

                    {job.trades?.length ? (
                      <Stack direction="row" useFlexGap spacing={0.75} sx={{ flexWrap: 'wrap', mb: 1.25 }}>
                        {job.trades.slice(0, 3).map((t) => (
                          <Chip key={t} label={t} size="small" sx={{ bgcolor: 'primary.light', color: 'secondary.main', fontWeight: 600 }} />
                        ))}
                      </Stack>
                    ) : null}

                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ alignItems: 'center', justifyContent: 'space-between', mt: 'auto' }}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
                      >
                        <Icon name="user" size={13} />
                        {job.postedBy?.company || job.postedBy?.fullName || 'CrewUp member'}
                      </Typography>
                      <Button component={RouterLink} to={`/jobs/${job.id}`} variant="contained" size="small">
                        View job
                      </Button>
                    </Stack>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </Container>
      </Box>
      <FooterCta />
    </Box>
  )
}

// A plain, non-selectable row used to label groups inside a native-style MUI
// Select menu (MUI's ListSubheader doesn't play well with Select's scroll
// anchoring here, so this lightweight stand-in keeps the two option groups
// visually separated without being choosable itself).
function ListSubheaderLike({ children }) {
  return (
    <MenuItem disabled divider sx={{ opacity: 1, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>
      {children}
    </MenuItem>
  )
}
