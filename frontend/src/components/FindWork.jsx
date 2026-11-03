import { Link as RouterLink } from 'react-router-dom'
import { Box, Button, Container, Typography } from '@mui/material'

const FEATURES = [
  'Search by trade',
  'Search by location',
  'Direct contractor messaging',
  'Company profiles',
  'Project alerts',
  'Mobile friendly',
]

const IMG =
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1100&q=80'

export default function FindWork() {
  return (
    <Box component="section" id="find-work" sx={{ bgcolor: '#10283a', py: { xs: 6, md: 7 } }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: { xs: 4.5, md: 7 },
            alignItems: 'center',
          }}
        >
          <Box
            component="img"
            src={IMG}
            alt="Construction worker reviewing blueprints on a job site"
            width={560}
            height={420}
            sx={{ width: '100%', height: '100%', maxHeight: 420, objectFit: 'cover', borderRadius: '16px' }}
          />
          <Box>
            <Typography sx={{ color: '#add9f8', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1 }}>
              Find Work
            </Typography>
            <Typography variant="h2" sx={{ color: '#fff', fontSize: 'clamp(1.75rem, 3.5vw, 2.35rem)', letterSpacing: '-0.025em', lineHeight: 1.2, mb: 1 }}>
              Find Your Next Opportunity
            </Typography>
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.78)', fontSize: '1.02rem', maxWidth: '34rem', mb: 3 }}>
              Browse projects that match your trade, location, and schedule — then connect directly
              with general contractors who need your skills.
            </Typography>
            <Box
              component="ul"
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem 1.25rem',
                m: 0,
                mb: 3.5,
                p: 0,
                listStyle: 'none',
              }}
            >
              {FEATURES.map((f) => (
                <Box
                  component="li"
                  key={f}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.92rem' }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <circle cx="9" cy="9" r="8" fill="rgba(77,148,255,0.2)" stroke="#5B9BFF" strokeWidth="1.2" />
                    <path d="M5.5 9.2l2.2 2.2 4.8-4.8" stroke="#8FBAFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {f}
                </Box>
              ))}
            </Box>
            <Button component={RouterLink} to="/jobs" variant="contained" size="large">
              Browse Jobs
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  )
}
