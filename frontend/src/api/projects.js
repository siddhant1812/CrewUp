import { mediaUrl } from './auth'
import { authRequest } from './client'

export { mediaUrl }

export function fetchDashboard() {
  return authRequest('/api/projects/dashboard')
}

export function fetchProjects(status = '') {
  const qs = status ? `?status=${encodeURIComponent(status)}` : ''
  return authRequest(`/api/projects${qs}`)
}

export function fetchOpenProjects() {
  return authRequest('/api/projects/open')
}

export function fetchProject(id) {
  return authRequest(`/api/projects/${id}`)
}

export function submitProposal(projectId, body) {
  return authRequest(`/api/projects/${projectId}/proposals`, {
    method: 'POST',
    data: body,
  })
}

export function respondProposal(projectId, proposalId, status) {
  return authRequest(`/api/projects/${projectId}/proposals/${proposalId}`, {
    method: 'PATCH',
    data: { status },
  })
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
    data: form,
  })
}

export function deleteProject(id) {
  return authRequest(`/api/projects/${id}`, {
    method: 'DELETE',
  })
}

export function updateProject(id, fields) {
  return authRequest(`/api/projects/${id}`, {
    method: 'PATCH',
    data: fields,
  })
}
