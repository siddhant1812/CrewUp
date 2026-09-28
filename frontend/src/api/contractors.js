import { getSession, mediaUrl } from './auth'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

async function authRequest(path, options = {}) {
  const session = getSession()
  if (!session?.token) {
    const err = new Error('Not authenticated')
    err.status = 401
    throw err
  }
  const headers = {
    Authorization: `Bearer ${session.token}`,
    ...(options.headers || {}),
  }
  if (options.body != null) headers['Content-Type'] = 'application/json'

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

export { mediaUrl }

export function fetchContractors({ q = '', type = '' } = {}) {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (type) params.set('type', type)
  const qs = params.toString()
  return authRequest(`/api/contractors${qs ? `?${qs}` : ''}`)
}

export function fetchSavedContractors() {
  return authRequest('/api/contractors/saved')
}

export function toggleSavedContractor(id) {
  return authRequest(`/api/contractors/${id}/save`, { method: 'POST' })
}

export function fetchInvites(box = 'received') {
  return authRequest(`/api/contractors/invites?box=${encodeURIComponent(box)}`)
}

export function sendInvite(body) {
  return authRequest('/api/contractors/invites', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function respondInvite(id, status) {
  return authRequest(`/api/contractors/invites/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}
