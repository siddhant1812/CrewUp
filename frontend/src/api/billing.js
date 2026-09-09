import { getSession } from './auth'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

async function request(path, options = {}, { auth = false } = {}) {
  const headers = { ...(options.headers || {}) }
  if (options.body != null) headers['Content-Type'] = 'application/json'
  if (auth) {
    const session = getSession()
    if (!session?.token) {
      const err = new Error('Not authenticated')
      err.status = 401
      throw err
    }
    headers.Authorization = `Bearer ${session.token}`
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  let data = null
  try {
    data = await res.json()
  } catch {
    data = null
  }
  if (!res.ok) {
    const err = new Error(data?.message || `Request failed (${res.status})`)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

export function fetchPlans() {
  return request('/api/billing/plans')
}

export function fetchBilling() {
  return request('/api/billing/me', {}, { auth: true })
}

export function startCheckout(plan) {
  return request(
    '/api/billing/checkout',
    { method: 'POST', body: JSON.stringify({ plan }) },
    { auth: true }
  )
}

export function openBillingPortal() {
  return request('/api/billing/portal', { method: 'POST' }, { auth: true })
}

export function cancelSubscription() {
  return request('/api/billing/cancel', { method: 'POST' }, { auth: true })
}

export function resumeSubscription() {
  return request('/api/billing/resume', { method: 'POST' }, { auth: true })
}
