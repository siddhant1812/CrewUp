import { Box, Container, Stack, Typography } from '@mui/material'

const ITEMS = [
  {
    label: '4.9/5 Average Rating',
    node: (
      <Stack direction="row" spacing={0.25} aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <svg key={i} width="18" height="18" viewBox="0 0 18 18" fill="#F5A623">
            <path d="M9 1.5l2.1 4.25 4.7.68-3.4 3.31.8 4.66L9 12.2l-4.2 2.2.8-4.66-3.4-3.31 4.7-.68L9 1.5z" />
          </svg>
        ))}
      </Stack>
    ),
  },
  {
    label: '5,000+ Active Members',
    node: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="3" stroke="#43a8f0" strokeWidth="1.5" />
        <circle cx="15" cy="8" r="2.5" stroke="#43a8f0" strokeWidth="1.5" />
        <path d="M3 18c0-2.76 2.24-5 5-5 .95 0 1.84.27 2.6.74" stroke="#43a8f0" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M12.4 14.1A4.5 4.5 0 0 1 15 13.5c2.49 0 4.5 2.01 4.5 4.5" stroke="#43a8f0" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: '10,000+ Connections Made',
    node: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path d="M8 11.5l-2.2 2.2a3 3 0 1 1-4.24-4.24l2.2-2.2" stroke="#43a8f0" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M14 10.5l2.2-2.2a3 3 0 1 1 4.24 4.24l-2.2 2.2" stroke="#43a8f0" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8.5 13.5l5-5" stroke="#43a8f0" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: '50+ Construction Trades',
    node: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path d="M7 8.5h8l.8 2H6.2L7 8.5z" stroke="#43a8f0" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M8 10.5v1.5M14 10.5v1.5M6.5 12.5h9v6.5H6.5z" stroke="#43a8f0" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M9 4.5h4v4H9z" stroke="#43a8f0" strokeWidth="1.5" />
      </svg>
    ),
  },
]

export default function TrustBar() {
  return (
    <Box component="section" aria-label="Social proof" sx={{ py: 6, textAlign: 'center' }}>
      <Container maxWidth="lg">
        <Typography sx={{ color: 'primary.main', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', mb: 3 }}>
          Trusted by Construction Professionals
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
            gap: { xs: 3, sm: 0 },
          }}
        >
          {ITEMS.map((item, i) => (
            <Box
              key={item.label}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                fontWeight: 600,
                fontSize: '0.92rem',
                color: 'secondary.main',
                px: { sm: 2 },
                borderRight: { sm: i < ITEMS.length - 1 ? '1px solid' : 'none' },
                borderColor: 'divider',
              }}
            >
              {item.node}
              <span>{item.label}</span>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  )
}
