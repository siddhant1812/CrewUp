import { Link as RouterLink } from 'react-router-dom'
import { Box, Paper, Typography } from '@mui/material'
import Logo from './Logo'

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(67,168,240,0.08), transparent 55%), linear-gradient(180deg, #10283a 0%, #142f44 100%)'
            : 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(67,168,240,0.12), transparent 55%), linear-gradient(180deg, #f7fbfe 0%, #eef7fe 100%)',
      }}
    >
      <Box
        aria-hidden="true"
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'hidden',
        }}
      >
        <Logo
          markSize={260}
          sx={{ opacity: 0.22, filter: 'blur(18px)', transform: { xs: 'scale(0.9)', sm: 'scale(1.15)' }, gap: 3 }}
          textSx={{ fontSize: { xs: '4.5rem', sm: '8rem', md: '10rem' }, color: 'secondary.main' }}
        />
      </Box>

      <Box sx={{ position: 'relative', zIndex: 2, px: { xs: 2, sm: 3 }, py: 2.5 }}>
        <Box
          component={RouterLink}
          to="/"
          aria-label="CrewUp home"
          sx={{ display: 'inline-flex', textDecoration: 'none' }}
        >
          <Logo markSize={34} />
        </Box>
      </Box>

      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          px: 2,
          pb: 6,
          pt: 1,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: 'min(100%, 440px)',
            bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(27,50,66,0.82)' : 'rgba(255,255,255,0.82)'),
            backdropFilter: 'blur(16px)',
            border: '1px solid',
            borderColor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)'),
            borderRadius: '18px',
            boxShadow: '0 20px 50px rgba(16, 30, 40, 0.12)',
            p: { xs: 2.5, sm: '2rem 1.75rem 1.75rem' },
          }}
        >
          <Typography
            variant="h4"
            sx={{ fontSize: '1.65rem', letterSpacing: '-0.02em', color: 'secondary.main', mb: 0.5 }}
          >
            {title}
          </Typography>
          {subtitle ? (
            <Typography sx={{ color: 'text.secondary', fontSize: '0.95rem', mb: 3, lineHeight: 1.5 }}>
              {subtitle}
            </Typography>
          ) : null}
          {children}
        </Paper>
      </Box>
    </Box>
  )
}
