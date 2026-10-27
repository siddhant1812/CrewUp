import { describe, expect, test } from 'vitest'
import {
  ALL_CATEGORIES,
  CONTRACTOR_CATEGORIES,
  SUBCONTRACTOR_CATEGORIES,
  categoriesFor,
  posterRoleLabel,
} from '../data/categories'

describe('categoriesFor', () => {
  test('general_contractor gets the project-type list', () => {
    expect(categoriesFor('general_contractor')).toBe(CONTRACTOR_CATEGORIES)
  })
  test('subcontractor gets the trade list', () => {
    expect(categoriesFor('subcontractor')).toBe(SUBCONTRACTOR_CATEGORIES)
  })
  test('find_work also gets the trade list (find_work never posts, so this is unused in the UI)', () => {
    expect(categoriesFor('find_work')).toBe(SUBCONTRACTOR_CATEGORIES)
  })
})

describe('ALL_CATEGORIES', () => {
  test('is the union of both category maps with no name collisions', () => {
    const contractorKeys = Object.keys(CONTRACTOR_CATEGORIES)
    const subKeys = Object.keys(SUBCONTRACTOR_CATEGORIES)
    const overlap = contractorKeys.filter((k) => subKeys.includes(k))
    expect(overlap).toEqual([])
    expect(Object.keys(ALL_CATEGORIES).length).toBe(contractorKeys.length + subKeys.length)
  })
})

describe('posterRoleLabel', () => {
  test('maps known roles to display labels', () => {
    expect(posterRoleLabel('contractor')).toBe('Contractor')
    expect(posterRoleLabel('subcontractor')).toBe('Subcontractor')
  })
  test('BUG: an unrecognized role (including undefined) silently becomes an empty string', () => {
    // Every caller does `posterRoleLabel(x) ? ... : null`, so this doesn't
    // crash anything, but a typo'd or future role value (e.g. "admin") is
    // indistinguishable from "no role at all" instead of surfacing as a bug.
    expect(posterRoleLabel('admin')).toBe('')
    expect(posterRoleLabel(undefined)).toBe('')
  })
})
