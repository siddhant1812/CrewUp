import { useEffect, useState } from 'react'
import { Link as RouterLink, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Alert, Box, Button, Checkbox, CircularProgress, FormControlLabel, Paper, Stack, Typography } from '@mui/material'
import { ArrowBackOutlined, CheckCircleOutlined } from '@mui/icons-material'
import { demoRazorpaySubscribe, fetchPlans } from '../api/billing'

export default function CheckoutConfirm() {
  const { planId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const card = location.state?.card || null

  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [paying, setPaying] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const catalog = await fetchPlans()
        if (cancelled) return
        const found = (catalog.plans || []).find((p) => p.id === planId)
        if (!found || found.id === 'starter') setError('Unknown plan.')
        else setPlan(found)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load plan.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [planId])

  async function handlePay() {
    setPaying(true)
    setError('')
    try {
      await demoRazorpaySubscribe(planId, card)
      setDone(true)
    } catch (err) {
      setError(err.message || 'Payment failed.')
    } finally {
      setPaying(false)
    }
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 560, mx: 'auto' }}>
      {!done ? (
        <Button startIcon={<ArrowBackOutlined />} size="small" sx={{ mb: 2 }} onClick={() => navigate(-1)}>
          Back
        </Button>
      ) : null}

      {loading ? (
        <Typography color="text.secondary">Loading…</Typography>
      ) : done ? (
        <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
          <CheckCircleOutlined color="success" sx={{ fontSize: 56, mb: 1.5 }} />
          <Typography variant="h5" sx={{ mb: 0.5 }}>
            Payment successful
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {plan?.name} plan is now active on your account.
          </Typography>
          <Button variant="contained" component={RouterLink} to="/dashboard/billing">
            Go to Billing
          </Button>
        </Paper>
      ) : plan ? (
        <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 3 }}>
          <Typography variant="h5" sx={{ fontSize: '1.3rem', mb: 2 }}>
            Confirm payment
          </Typography>

          <Stack
            direction="row"
            sx={{ justifyContent: 'space-between', p: 1.5, borderRadius: 2, bgcolor: 'action.hover', mb: 2 }}
          >
            <Typography fontWeight={700}>{plan.name} plan</Typography>
            <Typography fontWeight={700}>
              {plan.priceLabel}
              {plan.period}
            </Typography>
          </Stack>

          {error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : null}

          <FormControlLabel
            control={<Checkbox checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />}
            label="I confirm this payment and want to activate the subscription."
            sx={{ mb: 2 }}
          />

          <Button variant="contained" fullWidth size="large" disabled={!confirmed || paying} onClick={handlePay}>
            {paying ? <CircularProgress size={22} color="inherit" /> : 'Pay & activate subscription'}
          </Button>
        </Paper>
      ) : (
        <Alert severity="error">{error || 'Plan not found.'}</Alert>
      )}
    </Box>
  )
}
