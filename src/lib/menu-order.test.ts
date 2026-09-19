import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { JsonValue } from './config'
import { menuOrderEntries, moveMenuEntry, type MenuMove } from './menu-order'

const sample = JSON.parse(readFileSync(new URL('../../mc_settings.cfg', import.meta.url), 'utf8')) as Record<string, JsonValue>

describe('menu ordering', () => {
  it('matches the confirmed sample labels in saved numeric order rather than object key order', () => {
    const value = sample.Menu_Order!
    const entries = menuOrderEntries(value)!
    expect(entries.map(entry => entry.label)).toEqual([
      'Modify Household in CAS', 'Modify in CAS', 'Sim Commands', 'MC CAS',
      'MC Cheats', 'MC Cleaner', 'MC Control', 'Self Command', 'MC Dresser',
      'MC Pregnancy', 'MC Tuner', 'Sim Flags', 'Flag Active Sims', 'Relationships',
    ])
    expect(entries.map(entry => entry.position)).toEqual(Array.from({ length: 14 }, (_, index) => index))
    expect(entries[0]!.key).not.toBe(Object.keys(value!)[0])
  })

  it('sorts the current positions even when known labels and object keys imply a different order', () => {
    const value = { '0xC0B3CF8C': '99', '0x3FA9FDC1': 4, FUTURE_MENU: '0008' }
    expect(menuOrderEntries(value)).toEqual([
      { key: '0x3FA9FDC1', label: 'Modify in CAS', position: 4 },
      { key: 'FUTURE_MENU', label: 'Unknown menu (FUTURE_MENU)', position: 8 },
      { key: '0xC0B3CF8C', label: 'Modify Household in CAS', position: 99 },
    ])
    expect(value.FUTURE_MENU).toBe('0008')
  })

  it.each([
    ['up', 'C', ['A', 'C', 'B', 'D']],
    ['down', 'B', ['A', 'C', 'B', 'D']],
    ['top', 'C', ['C', 'A', 'B', 'D']],
    ['bottom', 'B', ['A', 'C', 'D', 'B']],
  ] as const)('moves %s through existing sparse slots without mutating the input', (move, key, order) => {
    const value = Object.freeze({ D: '0100', B: 7, A: '0002', C: 50 })
    const changed = moveMenuEntry(value, key, move) as Record<string, JsonValue>
    expect(menuOrderEntries(changed)!.map(entry => entry.key)).toEqual(order)
    expect(menuOrderEntries(changed)!.map(entry => entry.position)).toEqual([2, 7, 50, 100])
    expect(Object.keys(changed)).toEqual(Object.keys(value))
    for (const entryKey of Object.keys(value)) expect(typeof changed[entryKey]).toBe(typeof value[entryKey as keyof typeof value])
    expect(value).toEqual({ D: '0100', B: 7, A: '0002', C: 50 })
  })

  it('preserves unmodified raw string positions and only canonicalizes moved strings', () => {
    const value = { UNCHANGED: '0000', FIRST: '0005', SECOND: 90, LAST: '0999' }
    expect(moveMenuEntry(value, 'SECOND', 'up')).toEqual({ UNCHANGED: '0000', FIRST: '90', SECOND: 5, LAST: '0999' })
    expect(menuOrderEntries(moveMenuEntry(value, 'SECOND', 'up'))![1]!.label).toBe('Unknown menu (SECOND)')
  })

  it('allows a safe integer boundary slot without adding or reindexing positions', () => {
    const value = { LAST: Number.MAX_SAFE_INTEGER, FIRST: '0' }
    expect(moveMenuEntry(value, 'LAST', 'top')).toEqual({ LAST: 0, FIRST: String(Number.MAX_SAFE_INTEGER) })
  })

  it('returns the original input for boundary, absent-key, or unknown moves', () => {
    const value = { FIRST: '0', LAST: '10' }
    for (const [key, move] of [
      ['FIRST', 'up'], ['FIRST', 'top'], ['LAST', 'down'], ['LAST', 'bottom'], ['MISSING', 'up'],
      ['FIRST', 'sideways'],
    ]) expect(moveMenuEntry(value, key!, move as MenuMove)).toBe(value)
    const single = { ONLY: '0010' }
    for (const move of ['up', 'down', 'top', 'bottom'] as const) expect(moveMenuEntry(single, 'ONLY', move)).toBe(single)
  })

  it.each([
    null, false, 1, '0', [], {},
    { A: '' }, { A: ' 1' }, { A: '1 ' }, { A: '+1' }, { A: '-0' },
    { A: '1.0' }, { A: '1e2' }, { A: '0x10' }, { A: -1 }, { A: 0.5 },
    { A: null }, { A: false }, { A: [0] }, { A: { position: 0 } },
    { A: Number.POSITIVE_INFINITY }, { A: Number.NaN },
    { A: Number.MAX_SAFE_INTEGER + 1 }, { A: '9007199254740993' },
    { A: 1, B: '01' }, { A: '0', B: '000' },
  ] satisfies JsonValue[])('falls back without rewriting malformed or duplicate positions: %j', value => {
    expect(menuOrderEntries(value)).toBeNull()
    expect(moveMenuEntry(value, 'A', 'bottom')).toBe(value)
  })
})
