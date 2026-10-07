import { io } from 'socket.io-client'
import { API_BASE } from './client'
import { getSession } from './auth'

let socket = null

export function connectSocket() {
  const session = getSession()
  if (!session?.token) return null

  if (socket?.connected && socket.auth?.token === session.token) {
    return socket
  }

  disconnectSocket()

  socket = io(API_BASE, {
    path: '/socket.io',
    auth: { token: session.token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 20,
  })

  return socket
}

export function getSocket() {
  if (socket?.connected) return socket
  return connectSocket()
}

export function disconnectSocket() {
  if (!socket) return
  socket.removeAllListeners()
  socket.disconnect()
  socket = null
}
