import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Box, Button, Container, Typography } from '@mui/material'
import { getSession } from '../api/auth'

const TRADES = [
  { name: 'Electrical', d: 'M13 2L4 14h7l-1 8 10-14h-7z' },
  { name: 'Plumbing', d: 'M8 3v4M16 3v4M6 7h12v3a6 6 0 0 1-6 6 6 6 0 0 1-6-6V7zM12 16v5' },
  { name: 'HVAC', d: 'M3 8h18v10H3zM7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2M8 13h8' },
  { name: 'Roofing', d: 'M3 12l9-8 9 8M5 10.5V20h14v-9.5' },
  { name: 'Concrete', d: 'M4 10h16v10H4zM4 14h16M8 10V7h8v3' },
  { name: 'Framing', d: 'M4 20V8l8-5 8 5v12M9 20v-8h6v8' },
  { name: 'Drywall', d: 'M3 4h18v16H3zM3 12h18M12 4v16' },
  { name: 'Painting', d: 'M5 14c0-4 3-8 7-9 0 3 2 5 5 5 0 4-3 8-7 8s-5-1.5-5-4zM9 19v2' },
  { name: 'Flooring', d: 'M3 8l9-4 9 4v12l-9 4-9-4V8zM12 4v16M3 8l9 4 9-4' },
  { name: 'Excavation', d: 'M3 18h18M6 18V11l5-5 2 2v10M13 8l5 2v8' },
  { name: 'Landscaping', d: 'M12 20V10M12 14c-4 0-7-3-7-7 4 0 7 3 7 7zM12 14c4 0 7-3 7-7-4 0-7 3-7 7z' },
  { name: 'Masonry', d: 'M3 4h8v5H3zM13 4h8v5h-8zM7 10h10v5H7zM3 16h8v5H3zM13 16h8v5h-8z' },
]

const IMG =
  'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1100&q=80'

function isContractorUser() {
  return getSession()?.user?.contractorType === 'general_contractor'
}

export default function FindContractors() {
  const [forContractor, setForContractor] = useState(isContractorUser)

  useEffect(() => {
    const sync = () => setForContractor(isContractorUser())
    window.addEventListener('crewup-auth', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('crewup-auth', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const destination = forContractor ? '/jobs' : '/dashboard/contractors'

  return (
    <Box component="section" id="find-contractors" sx={{ py: { xs: 6, md: 7 } }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.95fr' },
            gap: { xs: 4.5, md: 6 },
            alignItems: 'center',
          }}
        >
          <Box>
            <Typography sx={{ color: 'primary.main', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1 }}>
              {forContractor ? 'Find Work' : 'Find Contractors'}
            </Typography>
            <Typography variant="h2" sx={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.35rem)', letterSpacing: '-0.025em', lineHeight: 1.2, mb: 1 }}>
              {forContractor ? 'Find Your Next Opportunity' : 'Find Qualified Subcontractors Fast'}
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: '1.02rem', maxWidth: '34rem', mb: 3 }}>
              {forContractor
                ? 'Browse open projects by trade, location, and schedule — then connect with the people who posted them.'
                : 'Search verified tradespeople by specialty, location, and availability — then hire with confidence.'}
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(4, 1fr)', md: 'repeat(6, 1fr)' },
                gap: 1,
                mb: 3.5,
              }}
            >
              {TRADES.map((t) => (
                <Box
                  key={t.name}
                  component={RouterLink}
                  to={forContractor ? destination : `${destination}?trade=${encodeURIComponent(t.name)}`}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.6,
                    p: '0.85rem 0.4rem',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '10px',
                    bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'background.paper' : '#f9fcff'),
                    color: 'primary.main',
                    textAlign: 'center',
                    textDecoration: 'none',
                    minHeight: 84,
                    transition: '0.15s ease',
                    '&:hover': { borderColor: '#b9def9', bgcolor: 'rgba(67, 168, 240, 0.04)' },
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d={t.d} stroke="currentColor" strokeWidth="1.55" strokeLinejoin="round" strokeLinecap="round" />
                  </svg>
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: 'text.primary' }}>{t.name}</Typography>
                </Box>
              ))}
            </Box>
            <Button component={RouterLink} to={destination} variant="contained" size="large">
              {forContractor ? 'Find Work' : 'Find Contractors'}
            </Button>
          </Box>
          <Box
            component="img"
            src={IMG}
            alt="Two construction workers looking at a tablet together"
            width={560}
            height={480}
            sx={{ width: '100%', maxHeight: 480, objectFit: 'cover', borderRadius: '16px' }}
          />
        </Box>
      </Container>
    </Box>
  )
}
