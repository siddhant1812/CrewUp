import { mediaUrl } from './auth'
import { authRequest } from './client'

export { mediaUrl }

export function fetchSettings() {
  return authRequest('/api/settings')
}

export function uploadProfilePhoto(file) {
  const form = new FormData()
  form.append('profilePhoto', file)
  return authRequest('/api/settings/photo', {
    method: 'POST',
    data: form,
  })
}

export function patchSettings(section, body) {
  return authRequest(`/api/settings/${section}`, {
    method: 'PATCH',
    data: body,
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
    data: body,
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
    data: form,
  })
}

export function deleteDocument(id) {
  return authRequest(`/api/settings/documents/${id}`, { method: 'DELETE' })
}
