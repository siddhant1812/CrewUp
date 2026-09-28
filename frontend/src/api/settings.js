import { getSession, mediaUrl } from './auth'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

async function authRequest(path, options = {}) {
  const session = getSession()
  if (!session?.token) {
    const err = new Error('Not authenticated')
    err.status = 401
    throw err
  }

  const isForm = typeof FormData !== 'undefined' && options.body instanceof FormData
  const headers = {
    Authorization: `Bearer ${session.token}`,
    ...(options.headers || {}),
  }
  if (!isForm && options.body != null) {
    headers['Content-Type'] = 'application/json'
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

export { mediaUrl }

export function fetchSettings() {
  return authRequest('/api/settings')
}

export function patchSettings(section, body) {
  return authRequest(`/api/settings/${section}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function fetchActivity() {
  return authRequest('/api/settings/activity')
}

export function fetchTeam() {
  return authRequest('/api/settings/team')
}

export function inviteTeam(body) {
  return authRequest('/api/settings/team', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function removeTeam(id) {
  return authRequest(`/api/settings/team/${id}`, { method: 'DELETE' })
}

export function fetchDocuments() {
  return authRequest('/api/settings/documents')
}

export function uploadDocument(file) {
  const form = new FormData()
  form.append('file', file)
  return authRequest('/api/settings/documents', {
    method: 'POST',
    body: form,
  })
}

export function deleteDocument(id) {
  return authRequest(`/api/settings/documents/${id}`, { method: 'DELETE' })
}
