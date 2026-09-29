import { API_BASE, request } from './client'

function storage() {
  if (localStorage.getItem('crewup_token')) return localStorage
  if (sessionStorage.getItem('crewup_token')) return sessionStorage
  return localStorage
}

export function mediaUrl(path) {
  if (!path) return ''
  if (path.startsWith('http') || path.startsWith('data:')) return path
  return `${API_BASE}${path}`
}

export function signup(formData) {
  return request('/api/auth/signup', {
    method: 'POST',
    data: formData,
  })
}

export function login(body) {
  return request('/api/auth/login', {
    method: 'POST',
    data: body,
  })
}

export function saveSession(token, user, remember = true) {
  const store = remember ? localStorage : sessionStorage
  store.setItem('crewup_token', token)
  store.setItem('crewup_user', JSON.stringify(user))
  if (remember) {
    sessionStorage.removeItem('crewup_token')
    sessionStorage.removeItem('crewup_user')
  } else {
    localStorage.removeItem('crewup_token')
    localStorage.removeItem('crewup_user')
  }
  window.dispatchEvent(new Event('crewup-auth'))
}

export function clearSession() {
  localStorage.removeItem('crewup_token')
  localStorage.removeItem('crewup_user')
  sessionStorage.removeItem('crewup_token')
  sessionStorage.removeItem('crewup_user')
  window.dispatchEvent(new Event('crewup-auth'))
}

export function getSession() {
  const store = storage()
  const token = store.getItem('crewup_token')
  const raw = store.getItem('crewup_user')
  if (!token || !raw) return null
  try {
    return { token, user: JSON.parse(raw) }
  } catch {
    return null
  }
}

export function updateSessionUser(partial) {
  const session = getSession()
  if (!session) return
  const remember = Boolean(localStorage.getItem('crewup_token'))
  saveSession(session.token, { ...session.user, ...partial }, remember)
}
