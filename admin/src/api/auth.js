import { clearSession, getSession, request, saveSession } from './client'

// Talks to the admin backend's own /api/auth/login (a separate service from
// the main app's login — see admin/backend). Every account created through
// this service is already an admin, but this check stays as defense in
// depth in case that ever changes.
export async function login({ workEmail, password }) {
  const data = await request('/api/auth/login', {
    method: 'POST',
    data: { workEmail, password },
  })
  if (data.user?.role !== 'admin') {
    const err = new Error('This account does not have admin access.')
    err.status = 403
    throw err
  }
  saveSession(data.token, data.user)
  return data
}

// Signing up here grants admin access immediately — there is no lesser
// account type in this app. See admin/backend/src/controllers/authController.js.
export async function signup({ fullName, workEmail, password, confirmPassword }) {
  const data = await request('/api/auth/signup', {
    method: 'POST',
    data: { fullName, workEmail, password, confirmPassword },
  })
  saveSession(data.token, data.user)
  return data
}

export function logout() {
  clearSession()
}

export function currentUser() {
  return getSession()?.user || null
}

export function isAdmin() {
  return currentUser()?.role === 'admin'
}
