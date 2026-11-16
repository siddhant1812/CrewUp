import { authRequest, request } from './client'

export function fetchPlans() {
  return request('/api/billing/plans')
}

export function fetchBilling() {
  return authRequest('/api/billing/me')
}

export function downgradeToStarter() {
  return authRequest('/api/billing/downgrade', { method: 'POST' })
}

export function startRazorpaySubscription(plan) {
  return authRequest('/api/billing/razorpay/subscribe', {
    method: 'POST',
    data: { plan },
  })
}

export function verifyRazorpayPayment(payload) {
  return authRequest('/api/billing/razorpay/verify', {
    method: 'POST',
    data: payload,
  })
}

export function demoRazorpaySubscribe(plan, card) {
  return authRequest('/api/billing/razorpay/demo-subscribe', {
    method: 'POST',
    data: { plan, card: card || undefined },
  })
}

export function cancelSubscription() {
  return authRequest('/api/billing/cancel', { method: 'POST' })
}

export function resumeSubscription() {
  return authRequest('/api/billing/resume', { method: 'POST' })
}
