import { request } from './client'

export function fetchStats() {
  return request('/api/admin/stats')
}

export function fetchUsers(params) {
  return request('/api/admin/users', { params })
}

export function fetchUser(id) {
  return request(`/api/admin/users/${id}`)
}

export function updateUser(id, patch) {
  return request(`/api/admin/users/${id}`, { method: 'PATCH', data: patch })
}

export function resetUserPassword(id, newPassword) {
  return request(`/api/admin/users/${id}/reset-password`, {
    method: 'POST',
    data: { newPassword },
  })
}

export function deleteUser(id) {
  return request(`/api/admin/users/${id}`, { method: 'DELETE' })
}

export function fetchProjects(params) {
  return request('/api/admin/projects', { params })
}

export function updateProjectStatus(id, status) {
  return request(`/api/admin/projects/${id}/status`, { method: 'PATCH', data: { status } })
}

export function deleteProject(id) {
  return request(`/api/admin/projects/${id}`, { method: 'DELETE' })
}

export function fetchProposals(params) {
  return request('/api/admin/proposals', { params })
}
