import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material'
import Icon from './Icon'
import { demoRazorpaySubscribe, startRazorpaySubscription, verifyRazorpayPayment } from '../api/billing'

let razorpayScriptPromise = null

export function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve()
  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = resolve
      script.onerror = () => {
        razorpayScriptPromise = null
        reject(new Error('Could not load Razorpay checkout.'))
      }
      document.body.appendChild(script)
    })
  }
  return razorpayScriptPromise
}

// Opens real Razorpay Checkout for a plan. Only call this when billing.razorpayReady
// is true — otherwise open <RazorpayDemoDialog> instead, which simulates payment
// with no API call. onSuccess(billing) / onError(message) / onClose() are all optional.
export async function openRazorpayCheckout(planId, { onSuccess, onError, onClose } = {}) {
  try {
    const data = await startRazorpaySubscription(planId)
    if (data.billing) {
      onSuccess?.(data.billing, data.message)
      return
    }

    await loadRazorpayCheckout()
    const rzp = new window.Razorpay({
      key: data.keyId,
      subscription_id: data.subscriptionId,
      name: 'CrewUp',
      description: `CrewUp ${planId} plan`,
      prefill: data.prefill,
      theme: { color: '#43a8f0' },
      handler: async (response) => {
        try {
          const verified = await verifyRazorpayPayment({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_subscription_id: response.razorpay_subscription_id,
            razorpay_signature: response.razorpay_signature,
          })
          onSuccess?.(verified.billing, 'Payment method saved and subscription updated.')
        } catch (err) {
          onError?.(err.message)
        }
      },
      modal: {
        ondismiss: () => onClose?.(),
      },
    })
    rzp.open()
  } catch (err) {
    onError?.(err.message)
  }
}

function PlanCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="8" fill="rgba(0,102,255,0.1)" stroke="#0066FF" strokeWidth="1.2" />
      <path
        d="M5.5 9.2l2.2 2.2 4.8-4.8"
        stroke="#0066FF"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Simulates the Razorpay checkout modal: no Razorpay API call, no real charge.
// Only shown while backend/.env has RAZORPAY_DEMO_MODE=true (real API keys
// aren't authenticating yet), so the checkout UX can still be demoed end to end.
export function RazorpayDemoDialog({ plan, onClose, onSuccess }) {
  const [stage, setStage] = useState('pay')
  const [error, setError] = useState('')

  async function handlePay() {
    setStage('processing')
    setError('')
    try {
      await new Promise((r) => setTimeout(r, 900))
      const data = await demoRazorpaySubscribe(plan.id)
      setStage('success')
      setTimeout(() => onSuccess(data.billing), 1100)
    } catch (err) {
      setError(err.message || 'Payment failed.')
      setStage('pay')
    }
  }

  return (
    <Dialog open onClose={stage === 'processing' ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Icon name="card" size={18} /> Razorpay Checkout
        <Chip label="Demo" size="small" color="warning" sx={{ ml: 'auto', fontWeight: 700 }} />
      </DialogTitle>
      <DialogContent>
        {stage === 'success' ? (
          <Stack spacing={1.5} sx={{ alignItems: 'center', py: 3 }}>
            <Box sx={{ transform: 'scale(2.4)' }}>
              <PlanCheck />
            </Box>
            <Typography fontWeight={700} sx={{ mt: 1 }}>
              Payment Successful
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {plan.name} plan activated.
            </Typography>
          </Stack>
        ) : (
          <Stack spacing={2} sx={{ py: 1 }}>
            <Typography variant="body2" color="text.secondary">
              No real charge will be made — this simulates a successful Razorpay payment while real
              API keys are being set up.
            </Typography>
            <Stack
              direction="row"
              sx={{ justifyContent: 'space-between', alignItems: 'center', p: 1.5, borderRadius: 2, bgcolor: 'action.hover' }}
            >
              <Typography fontWeight={700}>{plan.name} plan</Typography>
              <Typography fontWeight={700}>
                {plan.priceLabel}
                {plan.period}
              </Typography>
            </Stack>
            {error ? <Alert severity="error">{error}</Alert> : null}
          </Stack>
        )}
      </DialogContent>
      {stage !== 'success' ? (
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="outlined" onClick={onClose} disabled={stage === 'processing'}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handlePay} disabled={stage === 'processing'}>
            {stage === 'processing' ? <CircularProgress size={20} color="inherit" /> : 'Pay Now'}
          </Button>
        </DialogActions>
      ) : null}
    </Dialog>
  )
}
