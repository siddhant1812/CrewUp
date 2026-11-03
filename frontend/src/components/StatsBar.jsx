import { Box, Container, Typography } from '@mui/material'

const STATS = [
  {
    value: '5,000+',
    label: 'Contractors',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="15" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 18c0-2.76 2.24-5 5-5 .95 0 1.84.27 2.6.74" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M12.4 14.1A4.5 4.5 0 0 1 15 13.5c2.49 0 4.5 2.01 4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: '10,000+',
    label: 'Projects Posted',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <rect x="4" y="3" width="12" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 8h6M7 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: '50+',
    label: 'Trades',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path d="M13.5 4.5l4 4-9 9H4.5v-4l9-9z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M12 6l4 4" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    value: 'Nationwide',
    label: 'Coverage',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3.5 11h15M11 3.5c2.2 2.4 3.3 5 3.3 7.5S13.2 16.1 11 18.5C8.8 16.1 7.7 13.5 7.7 11S8.8 5.9 11 3.5z" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
]

export default function StatsBar() {
  return (
    <Box component="section" aria-label="Platform statistics" sx={{ bgcolor: 'primary.light', py: 3.5 }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
            gap: { xs: 2.5, sm: 3 },
          }}
        >
          {STATS.map((s) => (
            <Box key={s.label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ color: 'primary.main', flexShrink: 0 }}>{s.icon}</Box>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: '1.15rem', color: 'secondary.main', lineHeight: 1.2 }}>
                  {s.value}
                </Typography>
                <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>{s.label}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  )
}
