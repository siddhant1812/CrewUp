import { Box, Typography } from '@mui/material'

export default function Logo({ sx, textSx, markSize = 32, showText = true }) {
  return (
    <Box
      component="span"
      sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, ...sx }}
    >
      <svg width={markSize} height={markSize} viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path
          d="M16 3.5A12.5 12.5 0 1 0 28.5 16"
          stroke="#144364"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d="M16 8.5A7.5 7.5 0 1 0 23.5 16V9.5"
          stroke="#43a8f0"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <circle cx="23.5" cy="9.5" r="2.2" fill="#43a8f0" />
      </svg>
      {showText && (
        <Typography
          component="span"
          sx={{
            fontFamily: "'Sora', 'Plus Jakarta Sans', system-ui, sans-serif",
            fontWeight: 700,
            letterSpacing: '0.06em',
            fontSize: '1.05rem',
            color: 'secondary.main',
            ...textSx,
          }}
        >
          CREWUP
        </Typography>
      )}
    </Box>
  )
}
