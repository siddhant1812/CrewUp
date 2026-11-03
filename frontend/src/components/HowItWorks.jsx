import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Box, Container, Stack, Typography } from '@mui/material'
import { getSession } from '../api/auth'
import { fetchDashboard } from '../api/projects'

const NAV = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/dashboard/projects', label: 'Projects' },
  { to: '/dashboard/messages', label: 'Messages' },
  { to: '/dashboard/contractors', label: 'Contractors' },
  { to: '/dashboard/billing', label: 'Billing' },
]

function formatDue(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function statusLabel(status) {
  const map = {
    open: 'Bidding',
    in_progress: 'Active',
    draft: 'Draft',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }
  return map[status] || 'Open'
}

const STATUS_COLORS = {
  open: { bg: 'rgba(245, 166, 35, 0.15)', color: '#b7791f' },
  in_progress: { bg: 'rgba(67, 168, 240, 0.12)', color: 'primary.main' },
}

function DashboardPreview() {
  const session = getSession()
  const firstName = session?.user?.fullName?.split(' ')[0]
  const [stats, setStats] = useState({
    activeProjects: 0,
    messages: 0,
    savedContractors: 0,
    projectInvites: 0,
  })
  const [projects, setProjects] = useState([])

  useEffect(() => {
    if (!session?.token) return
    let cancelled = false
    fetchDashboard()
      .then((data) => {
        if (cancelled) return
        setStats({
          activeProjects: data.stats?.activeProjects || 0,
          messages: data.stats?.messages || 0,
          savedContractors: data.stats?.savedContractors || 0,
          projectInvites: data.stats?.projectInvites || 0,
        })
        setProjects(data.recentProjects || [])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [session?.token])

  const cards = [
    [stats.activeProjects, 'Active Projects'],
    [stats.messages, 'Messages'],
    [stats.savedContractors, 'Saved Contractors'],
    [stats.projectInvites, 'Project Invites'],
  ]

  return (
    <Box
      component={RouterLink}
      to="/dashboard"
      aria-label="Open dashboard"
      sx={{
        display: 'grid',
        gridTemplateColumns: '120px 1fr',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '16px',
        boxShadow: '0 12px 40px rgba(16, 30, 40, 0.1)',
        overflow: 'hidden',
        minHeight: 340,
        textDecoration: 'none',
        transition: '0.2s ease',
        '&:hover': { boxShadow: '0 12px 40px rgba(16, 30, 40, 0.1), 0 6px 18px rgba(67, 168, 240, 0.35)' },
      }}
    >
      <Box sx={{ bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#0f1f2a' : '#f7fbfe'), borderRight: '1px solid', borderColor: 'divider', p: '1rem 0.75rem' }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '8px',
            bgcolor: 'primary.main',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.8rem',
            display: 'grid',
            placeItems: 'center',
            mb: 1.5,
          }}
        >
          CU
        </Box>
        <Stack spacing={0.25}>
          {NAV.map((item) => (
            <Stack
              key={item.to}
              direction="row"
              spacing={0.75}
              sx={{
                alignItems: 'center',
                fontSize: '0.72rem',
                color: item.to === '/dashboard' ? 'primary.main' : 'text.secondary',
                fontWeight: item.to === '/dashboard' ? 600 : 400,
                bgcolor: item.to === '/dashboard' ? 'rgba(67, 168, 240, 0.1)' : 'transparent',
                px: 0.5,
                py: 0.6,
                borderRadius: '6px',
              }}
            >
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'currentColor', opacity: 0.7 }} />
              <span>{item.label}</span>
            </Stack>
          ))}
        </Stack>
      </Box>

      <Box sx={{ p: '1.1rem 1.15rem 1.25rem' }}>
        <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', color: 'secondary.main', mb: 1.25 }}>
          {firstName ? `Welcome back, ${firstName}!` : 'Welcome to CrewUp'}
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.75, mb: 1.5 }}>
          {cards.map(([n, label]) => (
            <Box key={label} sx={{ bgcolor: 'primary.light', borderRadius: '8px', p: '0.65rem 0.7rem' }}>
              <Typography sx={{ fontSize: '1.15rem', color: 'secondary.main', lineHeight: 1.1, fontWeight: 700 }}>
                {n}
              </Typography>
              <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary' }}>{label}</Typography>
            </Box>
          ))}
        </Box>
        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: 'secondary.main', mb: 0.75 }}>
          Recent Projects
        </Typography>
        {projects.length === 0 ? (
          <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>No projects yet.</Typography>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.68rem' }}>
              <Box component="thead">
                <Box component="tr">
                  {['Project', 'Location', 'Due', 'Status'].map((h) => (
                    <Box
                      component="th"
                      key={h}
                      sx={{ textAlign: 'left', color: 'text.secondary', fontWeight: 500, p: '0.35rem 0.25rem', borderBottom: '1px solid', borderColor: 'divider' }}
                    >
                      {h}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box component="tbody">
                {projects.map((p) => {
                  const sc = STATUS_COLORS[p.status] || STATUS_COLORS.open
                  return (
                    <Box component="tr" key={p.id}>
                      <Box component="td" sx={{ p: '0.45rem 0.25rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                        {p.title}
                      </Box>
                      <Box component="td" sx={{ p: '0.45rem 0.25rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                        {p.location || '—'}
                      </Box>
                      <Box component="td" sx={{ p: '0.45rem 0.25rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                        {formatDue(p.dueDate)}
                      </Box>
                      <Box component="td" sx={{ p: '0.45rem 0.25rem', borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                        <Box
                          component="span"
                          sx={{
                            display: 'inline-block',
                            px: '0.45rem',
                            py: '0.15rem',
                            borderRadius: 999,
                            fontSize: '0.62rem',
                            fontWeight: 600,
                            bgcolor: sc.bg,
                            color: sc.color,
                          }}
                        >
                          {statusLabel(p.status)}
                        </Box>
                      </Box>
                    </Box>
                  )
                })}
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  )
}

const STEPS = [
  {
    n: 1,
    title: 'Create Your Profile',
    text: 'Sign up as a contractor, subcontractor, or to find work, and showcase your skills, licenses, and experience.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="9" cy="6" r="2.75" stroke="currentColor" strokeWidth="1.4" />
        <path d="M3.5 15c0-2.9 2.46-5.25 5.5-5.25S14.5 12.1 14.5 15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    n: 2,
    title: 'Post or Search Projects',
    text: 'Browse jobs in your trade or post projects when you need reliable crew on site.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M12 12l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    n: 3,
    title: 'Connect With the Right Pros',
    text: 'Message verified partners, compare quotes, and build relationships that last.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M3 4.5h12v8a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 3 12.5v-8z" stroke="currentColor" strokeWidth="1.4" />
        <path d="M3 4.5L9 9.5l6-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    n: 4,
    title: 'Build Better Together',
    text: 'Stay connected, fill labor gaps fast, and grow a crew you can count on.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="6.5" cy="7" r="2.25" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="12" cy="7" r="2.25" stroke="currentColor" strokeWidth="1.4" />
        <path d="M2.5 14.5c0-2.2 1.8-4 4-4h0c.85 0 1.64.3 2.26.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M9.7 11.4A3.9 3.9 0 0 1 12 10.5h0c2.2 0 4 1.8 4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
]

export default function HowItWorks() {
  return (
    <Box component="section" id="how-it-works" sx={{ pt: { xs: 6, md: 7 }, pb: { xs: 7, md: 9 } }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.95fr' },
            gap: { xs: 4, md: 6 },
            alignItems: 'center',
          }}
        >
          <Box sx={{ order: { xs: 2, md: 0 } }}>
            <DashboardPreview />
          </Box>
          <Box sx={{ order: { xs: 1, md: 0 } }}>
            <Typography sx={{ color: 'primary.main', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1 }}>
              How It Works
            </Typography>
            <Typography variant="h1" sx={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.35rem)', letterSpacing: '-0.025em', lineHeight: 1.2, mb: 1 }}>
              How CrewUp Works
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: '1.02rem', maxWidth: '34rem', mb: 3 }}>
              Whether you&apos;re hiring crew or looking for your next job, CrewUp makes connecting
              simple, fast, and reliable.
            </Typography>
            <Stack component="ol" spacing={2.25} sx={{ listStyle: 'none', p: 0, m: 0 }}>
              {STEPS.map((s) => (
                <Box
                  component="li"
                  key={s.n}
                  sx={{ display: 'grid', gridTemplateColumns: '32px 28px 1fr', gap: 1, alignItems: 'start' }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    {s.n}
                  </Box>
                  <Box sx={{ width: 28, height: 32, display: 'grid', placeItems: 'center', color: 'primary.main' }}>
                    {s.icon}
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: 'secondary.main', mb: 0.25 }}>
                      {s.title}
                    </Typography>
                    <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary', lineHeight: 1.5 }}>
                      {s.text}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Box>
        </Box>
      </Container>
    </Box>
  )
}
