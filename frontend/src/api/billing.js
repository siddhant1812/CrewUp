import { authRequest, request } from './client'

export function fetchPlans() {
  return request('/api/billing/plans')
}

export function fetchBilling() {
  return authRequest('/api/billing/me')
}

export function startCheckout(plan) {
  return authRequest('/api/billing/checkout', {
    method: 'POST',
    data: { plan },
  })
}

export function openBillingPortal() {
  return authRequest('/api/billing/portal', { method: 'POST' })
}

export function cancelSubscription() {
  return authRequest('/api/billing/cancel', { method: 'POST' })
}

export function resumeSubscription() {
  return authRequest('/api/billing/resume', { method: 'POST' })
}
