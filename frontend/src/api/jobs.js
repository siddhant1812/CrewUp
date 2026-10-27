import { request } from './client'
import { getSession } from './auth'

// /api/jobs is public, but a logged-in contractor/subcontractor only sees
// contractor-posted jobs, so attach the token when we have one without
// requiring it.
function optionalAuthHeaders() {
  const token = getSession()?.token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function browseJobs({ q = '', trade = '', location = '', type = '', role = '', page = 1 } = {}) {
  const params = new URLSearchParams()
  if (q.trim()) params.set('q', q.trim())
  if (trade.trim()) params.set('trade', trade.trim())
  if (location.trim()) params.set('location', location.trim())
  if (type.trim()) params.set('type', type.trim())
  if (role.trim()) params.set('role', role.trim())
  if (page > 1) params.set('page', String(page))
  const qs = params.toString()
  return request(`/api/jobs${qs ? `?${qs}` : ''}`, { headers: optionalAuthHeaders() })
}

export function fetchJob(id) {
  return request(`/api/jobs/${id}`, { headers: optionalAuthHeaders() })
}
