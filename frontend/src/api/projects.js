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

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

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

export function fetchDashboard() {
  return authRequest('/api/projects/dashboard')
}

export function fetchProjects(status = '') {
  const qs = status ? `?status=${encodeURIComponent(status)}` : ''
  return authRequest(`/api/projects${qs}`)
}

export function createProject(fields) {
  const form = new FormData()
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    if (key === 'image' && value instanceof File) {
      form.append('image', value)
      return
    }
    if (key === 'trades' && Array.isArray(value)) {
      form.append('trades', value.join(', '))
      return
    }
    form.append(key, String(value))
  })
  return authRequest('/api/projects', {
    method: 'POST',
    body: form,
  })
}

export function deleteProject(id) {
  return authRequest(`/api/projects/${id}`, {
    method: 'DELETE',
  })
}
