import { mediaUrl } from './auth'
import { authRequest } from './client'

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
    data: body,
  })
}

export function respondInvite(id, status) {
  return authRequest(`/api/contractors/invites/${id}`, {
    method: 'PATCH',
    data: { status },
  })
}
