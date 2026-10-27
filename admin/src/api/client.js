import axios from 'axios'

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const TOKEN_KEY = 'crewup_admin_token'
const USER_KEY = 'crewup_admin_user'

const http = axios.create({ baseURL: API_BASE })

function toError(error) {
  const data = error.response?.data
  const status = error.response?.status
  const message =
    (data && typeof data === 'object' && data.message) ||
    (status ? `Request failed (${status})` : error.message || 'Network error')
  const err = new Error(message)
  err.status = status
  err.data = data ?? null
  return err
}

export function getSession() {
  const token = localStorage.getItem(TOKEN_KEY)
  const raw = localStorage.getItem(USER_KEY)
  if (!token || !raw) return null
  try {
    return { token, user: JSON.parse(raw) }
  } catch {
    return null
  }
}

export function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export async function request(path, { method = 'GET', data, params } = {}) {
  const session = getSession()
  try {
    const res = await http.request({
      url: path,
      method,
      data,
      params,
      headers: session?.token ? { Authorization: `Bearer ${session.token}` } : {},
    })
    return res.data
  } catch (error) {
    if (error.response?.status === 401) clearSession()
    throw toError(error)
  }
}
