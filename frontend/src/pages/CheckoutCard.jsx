import { useEffect, useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { Alert, Box, Button, Chip, Paper, Stack, TextField, Typography } from '@mui/material'
import { ArrowBackOutlined, CreditCardOutlined, LockOutlined } from '@mui/icons-material'
import { fetchBilling, fetchPlans } from '../api/billing'

export default function CheckoutCard() {
  const { planId } = useParams()
  const navigate = useNavigate()
  const [plan, setPlan] = useState(null)
  const [billing, setBilling] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [useSaved, setUseSaved] = useState(true)
  const [card, setCard] = useState({ name: '', number: '', expiry: '', cvv: '' })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [catalog, me] = await Promise.all([fetchPlans(), fetchBilling()])
        if (cancelled) return
        const found = (catalog.plans || []).find((p) => p.id === planId)
        if (!found || found.id === 'starter') {
          setError('Unknown plan.')
        } else {
          setPlan(found)
        }
        setBilling(me.billing)
        setUseSaved(Boolean(me.billing?.paymentMethod))
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load checkout.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [planId])

  const savedCard = billing?.paymentMethod
  const canContinue = useSaved
    ? Boolean(savedCard)
    : card.name.trim() && card.number.replace(/\D/g, '').length >= 12 && card.expiry.trim() && card.cvv.trim().length >= 3

  function handleContinue() {
    navigate(`/dashboard/billing/checkout/${planId}/confirm`, {
      state: { card: useSaved ? null : card },
    })
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 560, mx: 'auto' }}>
      <Button component={RouterLink} to="/dashboard/billing" startIcon={<ArrowBackOutlined />} size="small" sx={{ mb: 2 }}>
        Back to Billing
      </Button>

      {loading ? (
        <Typography color="text.secondary">Loading…</Typography>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 3 }}>
          <Typography variant="h5" sx={{ fontSize: '1.3rem', mb: 0.5 }}>
            Payment method
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {plan.name} plan — {plan.priceLabel}
            {plan.period}
          </Typography>

          {savedCard ? (
            <Paper
              variant="outlined"
              onClick={() => setUseSaved(true)}
              sx={{
                p: 2,
                mb: 1.5,
                borderRadius: 2,
                cursor: 'pointer',
                borderColor: useSaved ? 'primary.main' : 'divider',
                borderWidth: useSaved ? 2 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <CreditCardOutlined color="action" />
                <Box>
                  <Typography fontWeight={700} sx={{ textTransform: 'capitalize' }}>
                    {savedCard.brand} •••• {savedCard.last4}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Expires {savedCard.expMonth}/{savedCard.expYear}
                  </Typography>
                </Box>
              </Stack>
              <Chip label="Saved card" size="small" color={useSaved ? 'primary' : 'default'} />
            </Paper>
          ) : null}

          {savedCard ? (
            <Button variant="text" size="small" onClick={() => setUseSaved((v) => !v)} sx={{ mb: 2 }}>
              {useSaved ? 'Use a different card' : 'Use saved card instead'}
            </Button>
          ) : null}

          {!useSaved ? (
            <Stack spacing={2} sx={{ mb: 1 }}>
              <TextField
                label="Name on card"
                value={card.name}
                onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))}
              />
              <TextField
                label="Card number"
                value={card.number}
                onChange={(e) => setCard((c) => ({ ...c, number: e.target.value }))}
                placeholder="4242 4242 4242 4242"
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Expiry (MM/YY)"
                  value={card.expiry}
                  onChange={(e) => setCard((c) => ({ ...c, expiry: e.target.value }))}
                  placeholder="12/29"
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="CVV"
                  value={card.cvv}
                  onChange={(e) => setCard((c) => ({ ...c, cvv: e.target.value }))}
                  placeholder="123"
                  sx={{ flex: 1 }}
                />
              </Stack>
              <Typography variant="caption" color="text.secondary">
                <LockOutlined sx={{ fontSize: 13, verticalAlign: 'middle', mr: 0.5 }} />
                Demo checkout — no real card is charged or stored.
              </Typography>
            </Stack>
          ) : null}

          <Button variant="contained" fullWidth size="large" sx={{ mt: 2 }} disabled={!canContinue} onClick={handleContinue}>
            Continue to checkout
          </Button>
        </Paper>
      )}
    </Box>
  )
}
