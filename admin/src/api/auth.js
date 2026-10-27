import { clearSession, getSession, request, saveSession } from './client'

// Reuses the same /api/auth/login every CrewUp account uses — there is no
// separate admin login endpoint. What makes this the *admin* panel is that
// every other page in this app refuses to load for anyone whose
// user.role !== "admin", and every backend /api/admin/* route re-checks
// that same thing server-side (requireAdmin), so a non-admin can log in
// here but gets nothing.
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

export function logout() {
  clearSession()
}

export function currentUser() {
  return getSession()?.user || null
}

export function isAdmin() {
  return currentUser()?.role === 'admin'
}
