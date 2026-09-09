const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function storage() {
  if (localStorage.getItem('crewup_token')) return localStorage
  if (sessionStorage.getItem('crewup_token')) return sessionStorage
  return localStorage
}

async function request(path, options = {}) {
  const isForm = typeof FormData !== 'undefined' && options.body instanceof FormData
  const headers = { ...(options.headers || {}) }
  if (!isForm) headers['Content-Type'] = 'application/json'

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
    const message = data?.message || `Request failed (${res.status})`
    const err = new Error(message)
    err.status = res.status
    err.data = data
    throw err
  }

  return data
}

export function mediaUrl(path) {
  if (!path) return ''
  if (path.startsWith('http') || path.startsWith('data:')) return path
  return `${API_BASE}${path}`
}

export function signup(formData) {
  return request('/api/auth/signup', {
    method: 'POST',
    body: formData,
  })
}

export function login(body) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
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
