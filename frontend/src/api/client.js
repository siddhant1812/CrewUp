import axios from 'axios'
import { getSession } from './auth'

export const API_BASE =
  import.meta.env.VITE_API_URL ||'http://localhost:5000' 

const http = axios.create({
  baseURL: API_BASE,
})

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

export async function request(path, { method = 'GET', data, headers } = {}) {
  try {
    const res = await http.request({ url: path, method, data, headers })
    return res.data
  } catch (error) {
    throw toError(error)
  }
}

export async function authRequest(path, options = {}) {
  const session = getSession()
  if (!session?.token) {
    const err = new Error('Not authenticated')
    err.status = 401
    throw err
  }

  return request(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${session.token}`,
      ...(options.headers || {}),
    },
  })
}
