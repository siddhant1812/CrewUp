import { describe, expect, test } from 'vitest'
import { accountKindOf, canDo, mediaUrl, permissionsOf } from '../api/auth'

describe('mediaUrl', () => {
  test('empty path returns empty string', () => {
    expect(mediaUrl('')).toBe('')
    expect(mediaUrl(null)).toBe('')
  })
  test('absolute http(s) urls pass through unchanged', () => {
    expect(mediaUrl('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png')
  })
  test('data urls pass through unchanged', () => {
    expect(mediaUrl('data:image/png;base64,AAA')).toBe('data:image/png;base64,AAA')
  })
  test('a relative /uploads path is prefixed with API_BASE', () => {
    expect(mediaUrl('/uploads/profiles/a.jpg')).toMatch(/\/uploads\/profiles\/a\.jpg$/)
  })
})

describe('accountKindOf', () => {
  test('no user -> guest', () => {
    expect(accountKindOf(null)).toBe('guest')
  })
  test('server-provided accountKind is trusted first', () => {
    expect(accountKindOf({ accountKind: 'worker', contractorType: 'general_contractor' })).toBe('worker')
  })
  test('admin role -> admin', () => {
    expect(accountKindOf({ role: 'admin' })).toBe('admin')
  })
  test('general_contractor -> contractor', () => {
    expect(accountKindOf({ contractorType: 'general_contractor' })).toBe('contractor')
  })
  test('BUG: a subcontractor with no server accountKind falls back to "worker", same as find_work', () => {
    // accountKindOf has no subcontractor-specific branch, so without the
    // server's `accountKind` field a subcontractor is indistinguishable
    // from a find_work (pure worker) account on the client.
    expect(accountKindOf({ contractorType: 'subcontractor' })).toBe('worker')
  })
})

describe('permissionsOf / fallbackPermissions', () => {
  test('uses the server-computed permissions when present', () => {
    const user = { contractorType: 'find_work', permissions: { postProjects: true } }
    expect(permissionsOf(user).postProjects).toBe(true)
  })

  test('general_contractor fallback can post but not manageTeam... wait it can', () => {
    const perms = permissionsOf({ contractorType: 'general_contractor' })
    expect(perms.postProjects).toBe(true)
    expect(perms.manageTeam).toBe(true)
  })

  test('find_work fallback can apply but not post or manage a team', () => {
    const perms = permissionsOf({ contractorType: 'find_work' })
    expect(perms.applyToJobs).toBe(true)
    expect(perms.postProjects).toBe(false)
    expect(perms.manageTeam).toBe(false)
  })

  test('BUG: subcontractor fallback grants manageTeam, which the backend never allows', () => {
    // Backend buildPermissions() (backend/src/auth/permissions.js) only ever
    // sets manageTeam for an admin or a general_contractor — a subcontractor
    // gets postProjects/hire/etc but manageTeam stays false. The frontend's
    // fallbackPermissions() instead derives manageTeam from the same
    // `contractor` flag it uses for postProjects, and that flag is true for
    // subcontractors too, so a subcontractor falling back to this function
    // (e.g. a session saved before the user object carried `.permissions`)
    // would see manageTeam: true and could be shown UI (like the "Users &
    // Permissions" settings link) that the server will then 403 on.
    const perms = permissionsOf({ contractorType: 'subcontractor' })
    expect(perms.postProjects).toBe(true) // matches backend: true
    expect(perms.manageTeam).toBe(true) // backend says this should be false
  })
})

describe('canDo', () => {
  test('reads a single permission off the resolved permissions object', () => {
    expect(canDo('applyToJobs', { contractorType: 'find_work' })).toBe(true)
    expect(canDo('postProjects', { contractorType: 'find_work' })).toBe(false)
  })
  test('an unknown permission key is falsy, not a crash', () => {
    expect(canDo('flyToTheMoon', { contractorType: 'find_work' })).toBe(false)
  })
})
