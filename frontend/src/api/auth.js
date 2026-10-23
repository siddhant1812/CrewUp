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

function fallbackPermissions(user) {
  const admin = user?.role === 'admin'
  const contractor =
    admin || user?.contractorType === 'general_contractor' || user?.contractorType === 'subcontractor'
  const worker = admin || user?.contractorType === 'subcontractor' || user?.contractorType === 'find_work'
  return {
    postProjects: contractor,
    manageProjects: contractor,
    hire: contractor,
    inviteContractors: contractor,
    manageTeam: contractor,
    applyToJobs: worker,
    browseJobs: true,
    message: true,
    viewContractors: true,
    saveContractors: true,
    billing: true,
    settings: true,
  }
}

export function permissionsOf(user = getSession()?.user) {
  return user?.permissions || fallbackPermissions(user)
}

export function accountKindOf(user = getSession()?.user) {
  if (user?.accountKind) return user.accountKind
  if (user?.role === 'admin') return 'admin'
  if (user?.contractorType === 'general_contractor') return 'contractor'
  if (user) return 'worker'
  return 'guest'
}

export function canDo(permission, user = getSession()?.user) {
  return Boolean(permissionsOf(user)[permission])
}

export function canPostProjects(user = getSession()?.user) {
  return canDo('postProjects', user)
}

export function canApplyToJobs(user = getSession()?.user) {
  return canDo('applyToJobs', user)
}

export function canHire(user = getSession()?.user) {
  return canDo('hire', user)
}

export function updateSessionUser(partial) {
  const session = getSession()
  if (!session) return
  const remember = Boolean(localStorage.getItem('crewup_token'))
  saveSession(session.token, { ...session.user, ...partial }, remember)
}
