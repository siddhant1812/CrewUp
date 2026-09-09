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

export function fetchContacts(q = '') {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  const qs = params.toString()
  return authRequest(`/api/messages/contacts${qs ? `?${qs}` : ''}`)
}

export function fetchUnreadCount() {
  return authRequest('/api/messages/unread-count')
}

export function fetchConversations({ tab = 'all', q = '', page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({
    tab,
    page: String(page),
    limit: String(limit),
  })
  if (q) params.set('q', q)
  return authRequest(`/api/messages/conversations?${params}`)
}

export function fetchConversation(id) {
  return authRequest(`/api/messages/conversations/${id}`)
}

export function createConversation(body) {
  return authRequest('/api/messages/conversations', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function fetchMessages(id, { limit = 80 } = {}) {
  return authRequest(`/api/messages/conversations/${id}/messages?limit=${limit}`)
}

export function sendMessage(id, { text = '', files = [] } = {}) {
  const form = new FormData()
  if (text) form.append('text', text)
  for (const file of files) {
    form.append('files', file)
  }
  return authRequest(`/api/messages/conversations/${id}/messages`, {
    method: 'POST',
    body: form,
  })
}

export function markConversationRead(id) {
  return authRequest(`/api/messages/conversations/${id}/read`, {
    method: 'PATCH',
  })
}

export function toggleArchive(id) {
  return authRequest(`/api/messages/conversations/${id}/archive`, {
    method: 'PATCH',
  })
}
