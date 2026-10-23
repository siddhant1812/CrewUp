import { request } from './client'

export function browseJobs({ q = '', trade = '', location = '', type = '', role = '', page = 1 } = {}) {
  const params = new URLSearchParams()
  if (q.trim()) params.set('q', q.trim())
  if (trade.trim()) params.set('trade', trade.trim())
  if (location.trim()) params.set('location', location.trim())
  if (type.trim()) params.set('type', type.trim())
  if (role.trim()) params.set('role', role.trim())
  if (page > 1) params.set('page', String(page))
  const qs = params.toString()
  return request(`/api/jobs${qs ? `?${qs}` : ''}`)
}

export function fetchJob(id) {
  return request(`/api/jobs/${id}`)
}
