import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Box, Button, Container, Link, Paper, Stack, Typography } from '@mui/material'
import { getSession } from '../api/auth'
import { fetchPlans, startCheckout } from '../api/billing'

function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="8" fill="rgba(19, 146, 236,0.1)" stroke="#43a8f0" strokeWidth="1.2" />
      <path d="M5.5 9.2l2.2 2.2 4.8-4.8" stroke="#43a8f0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Pricing() {
  const session = getSession()
  const [plans, setPlans] = useState([])
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await fetchPlans()
        if (!cancelled) setPlans(data.plans || [])
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not load plans.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleCta(plan) {
    if (plan.id === 'starter') {
      window.location.href = session?.user ? '/dashboard/settings/subscription' : '/signup'
      return
    }
    if (!session?.user) {
      window.location.href = `/signup?plan=${plan.id}`
      return
    }
    setBusy(plan.id)
    setError('')
    try {
      const data = await startCheckout(plan.id)
      if (data.url) {
        window.location.href = data.url
        return
      }
      window.location.href = '/dashboard/settings/subscription'
    } catch (err) {
      setError(err.message || 'Checkout failed.')
      setBusy('')
    }
  }

  return (
    <Box component="section" id="pricing" sx={{ bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'background.default' : '#f2f5f9'), py: { xs: 6, md: 7 } }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography sx={{ color: 'primary.main', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1 }}>
            Pricing
          </Typography>
          <Typography variant="h2" sx={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.35rem)', letterSpacing: '-0.025em', lineHeight: 1.2, mb: 1 }}>
            Simple Pricing For Construction Professionals
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '1.02rem', maxWidth: '28rem', mx: 'auto' }}>
            No hidden fees. Upgrade when you&apos;re ready.
          </Typography>
        </Box>

        {error ? (
          <Typography sx={{ color: 'error.main', textAlign: 'center', mb: 2 }}>{error}</Typography>
        ) : null}

        <Box
          sx={{
            display: 'grid',
            gap: 2.5,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            alignItems: 'stretch',
          }}
        >
          {plans.map((p) => (
            <Paper
              key={p.id}
              elevation={0}
              sx={{
                position: 'relative',
                border: '1px solid',
                borderColor: p.popular ? 'primary.main' : 'divider',
                borderRadius: '16px',
                p: p.popular ? '2.25rem 1.5rem 1.5rem' : '1.75rem 1.5rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: p.popular ? '0 12px 36px rgba(67, 168, 240, 0.15)' : 'none',
              }}
            >
              {p.popular ? (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bgcolor: 'primary.main',
                    color: '#fff',
                    textAlign: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    p: '0.4rem',
                    borderRadius: '16px 16px 0 0',
                  }}
                >
                  Most Popular
                </Box>
              ) : null}
              <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: 'secondary.main', mb: 0.75 }}>
                {p.name}
              </Typography>
              <Stack direction="row" sx={{ alignItems: 'baseline', gap: 0.25, mb: 1 }}>
                <Typography sx={{ fontSize: '2.4rem', fontWeight: 700, letterSpacing: '-0.03em', color: 'secondary.main', lineHeight: 1 }}>
                  {p.priceLabel}
                </Typography>
                {p.period ? (
                  <Typography sx={{ color: 'text.secondary', fontWeight: 500 }}>{p.period}</Typography>
                ) : null}
              </Stack>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', mb: 2.25 }}>{p.blurb}</Typography>
              <Stack spacing={1} sx={{ flex: 1, mb: 2.5 }}>
                {p.features.map((f) => (
                  <Stack key={f} direction="row" spacing={1} sx={{ alignItems: 'flex-start', fontSize: '0.92rem' }}>
                    <Check />
                    <span>{f}</span>
                  </Stack>
                ))}
              </Stack>
              <Button
                variant={p.popular ? 'contained' : 'outlined'}
                size="large"
                fullWidth
                onClick={() => handleCta(p)}
                disabled={busy === p.id}
              >
                {busy === p.id
                  ? 'Redirecting…'
                  : p.id === 'starter'
                    ? session?.user
                      ? 'Current / Starter'
                      : 'Get Started'
                    : `Start ${p.name} Plan`}
              </Button>
            </Paper>
          ))}
        </Box>

        {!plans.length && !error ? (
          <Typography sx={{ color: 'text.secondary', textAlign: 'center', mt: 3 }}>Loading plans…</Typography>
        ) : null}

        <Typography sx={{ color: 'text.secondary', textAlign: 'center', mt: 2.5 }}>
          Manage cards and invoices in{' '}
          <Link component={RouterLink} to="/dashboard/settings/subscription">
            Settings → Subscription
          </Link>
          .
        </Typography>
      </Container>
    </Box>
  )
}
