import { Link as RouterLink } from 'react-router-dom'
import { Box, Button, Container, Stack, Typography } from '@mui/material'

export default function FooterCta() {
  return (
    <Box
      component="section"
      id="resources"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        py: 5,
        background: 'linear-gradient(110deg, #68b9f3 0%, #2294e6 55%, #187bc2 100%)',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'linear-gradient(90deg, transparent, #000 30%, #000 70%, transparent)',
          pointerEvents: 'none',
        },
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr auto' },
            gap: 3.5,
            alignItems: 'center',
          }}
        >
          <Box>
            <Typography variant="h2" sx={{ color: '#fff', fontSize: 'clamp(1.6rem, 3vw, 2.1rem)', letterSpacing: '-0.02em', mb: 1 }}>
              Ready To Build Better Together?
            </Typography>
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.85)', maxWidth: '32rem', fontSize: '0.98rem' }}>
              Join thousands of contractors and subcontractors using CrewUp to find work, fill
              crews, and grow lasting partnerships.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap' }}>
            <Button
              component={RouterLink}
              to="/jobs"
              variant="contained"
              size="large"
              startIcon={
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <circle cx="8" cy="8" r="5.25" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M12.2 12.2L15.5 15.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              }
              sx={{ bgcolor: '#fff', color: 'primary.main', '&:hover': { bgcolor: '#f1f9fe' } }}
            >
              Find Work
            </Button>
            <Button
              component={RouterLink}
              to="/dashboard/find-contractors"
              variant="outlined"
              size="large"
              startIcon={
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <circle cx="6.5" cy="7" r="2.25" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="12" cy="7" r="2.25" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M2.5 14.5c0-2.2 1.8-4 4-4 .85 0 1.64.3 2.26.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M9.7 11.4A3.9 3.9 0 0 1 12 10.5c2.2 0 4 1.8 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              }
              sx={{
                color: '#fff',
                borderColor: 'rgba(255, 255, 255, 0.85)',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.85)' },
              }}
            >
              Find Contractors
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  )
}
