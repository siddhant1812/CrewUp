import { mediaUrl } from './auth'
import { authRequest } from './client'

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
    data: body,
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
    data: form,
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
