import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  applyPreset,
  changedKeys,
  cloneConfig,
  isEqual,
  parseConfig,
  serializeConfig,
  toggleCsvValue,
  validateNumericInput,
} from './config'

describe('config import and export', () => {
  it('round-trips the supplied MCCC config without changing any values or types', () => {
    const source = readFileSync(new URL('../../mc_settings.cfg', import.meta.url), 'utf8')
    const expected = JSON.parse(source)
    const imported = parseConfig(source)
    const exported = serializeConfig(imported)

    expect(parseConfig(exported)).toEqual(expected)
    expect(imported.Relationship_MoveinAges).toBe('YA,A,E')
    expect(imported.Autosave_HexSlotNumber).toBe('1111')
    expect(imported.Appearance_AF_Template).toMatchObject({ Belly: [-100, 100] })
    expect(exported.endsWith('\n')).toBe(true)
    expect(exported).toContain('\n    "Adopt_Neglected_Child":')
    expect(changedKeys(imported, parseConfig(exported))).toEqual([])
  })

  it('preserves unknown settings, numeric strings, nulls and nested arrays', () => {
    const config = parseConfig(JSON.stringify({
      FutureSetting: { value: '0012', nested: [[false, null], [1, '2']] },
      EmptyChoices: '',
    }))
    const restored = parseConfig(serializeConfig(config))
    expect(restored).toEqual(config)
    expect(restored.FutureSetting).toEqual({
      value: '0012', nested: [[false, null], [1, '2']],
    })
  })

  it('accepts a UTF-8 byte order mark', () => {
    expect(parseConfig('\uFEFF{"Enabled":true}')).toEqual({ Enabled: true })
  })

  it.each(['null', '[]', 'true', '1', '"config"'])('rejects non-object root %s', (source) => {
    expect(() => parseConfig(source)).toThrow(/JSON object/)
  })

  it.each(['', '{', '{"Enabled": true,}', 'not json'])('rejects malformed JSON %s', (source) => {
    expect(() => parseConfig(source)).toThrow(/not valid JSON/)
  })

  it.each(['__proto__', 'constructor', 'prototype'])('rejects unsafe key %s at any depth', (key) => {
    expect(() => parseConfig(`{"${key}":{}}`)).toThrow(/Unsafe setting key/)
    expect(() => parseConfig(`{"Unknown":[{"nested":{"${key}":true}}]}`))
      .toThrow(/Unsafe setting key/)
    expect(Object.hasOwn(Object.prototype, 'polluted')).toBe(false)
  })

  it('rejects numbers that JSON.parse overflows to Infinity', () => {
    expect(() => parseConfig('{"Unknown":[1e400]}')).toThrow(/Invalid value/)
  })
})

describe('changes and presets', () => {
  it('compares objects independently of key order and keeps value types distinct', () => {
    expect(isEqual({ a: 1, b: [false, null] }, { b: [false, null], a: 1 })).toBe(true)
    expect(isEqual('1', 1)).toBe(false)
    expect(isEqual([1, 2], [2, 1])).toBe(false)
    expect(isEqual([], {})).toBe(false)
    expect(isEqual(undefined, null)).toBe(false)
    expect(isEqual({ a: null }, { b: null })).toBe(false)
  })

  it('finds added, removed, nested and type-changing settings', () => {
    expect(changedKeys(
      { unchanged: { a: 1, b: 2 }, nested: [1], removed: true, type: '1' },
      { unchanged: { b: 2, a: 1 }, nested: [2], added: null, type: 1 },
    )).toEqual(['nested', 'removed', 'type', 'added'])
  })

  it('deep clones so later edits cannot mutate the original config', () => {
    const original = { nested: { values: [1, 2] } }
    const copy = cloneConfig(original)
    expect(copy).toEqual(original)
    expect(copy).not.toBe(original)
    expect(copy.nested).not.toBe(original.nested)
    expect((copy.nested as { values: number[] }).values).not.toBe(original.nested.values)
  })

  it('applies a partial preset while preserving unknown settings and both input objects', () => {
    const original = { Known: true, Future: { data: ['keep'] }, Nested: { old: 1 } }
    const patch = { Known: false, Nested: { replacement: 2 } }
    const result = applyPreset(original, patch)
    expect(result).toEqual({ Known: false, Future: { data: ['keep'] }, Nested: { replacement: 2 } })
    expect(original.Known).toBe(true)
    expect(result.Future).not.toBe(original.Future)
    expect(result.Nested).not.toBe(patch.Nested)
  })

  it('also rejects unsafe keys passed directly to presets', () => {
    const patch = JSON.parse('{"__proto__":{"polluted":true}}')
    expect(() => applyPreset({ Known: true }, patch)).toThrow(/Unsafe setting key/)
  })
})

describe('comma-separated multi-selects', () => {
  it('toggles individual ages while preserving unknown codes and string representation', () => {
    const initial = 'YA,A,E,FUTURE'
    const withoutAdult = toggleCsvValue(initial, 'A', false)
    expect(withoutAdult).toBe('YA,E,FUTURE')
    expect(toggleCsvValue(withoutAdult, 'A', true)).toBe('YA,E,FUTURE,A')
    expect(toggleCsvValue(initial, 'YA', true)).toBe(initial)
    expect(typeof withoutAdult).toBe('string')
  })

  it('deduplicates and handles empty or fully cleared selections', () => {
    expect(toggleCsvValue(' YA, A,YA,, E ', 'A', false)).toBe('YA,E')
    expect(toggleCsvValue('', 'YA', true)).toBe('YA')
    expect(toggleCsvValue('', 'YA', false)).toBe('')
    expect(toggleCsvValue('YA', 'YA', false)).toBe('')
  })
})

describe('numeric input validation', () => {
  it.each(['', ' ', 'NaN', 'Infinity', '-Infinity', '1e400', 'abc', '0x10', '2,5'])
    ('rejects invalid numeric input %s', (input) => {
      expect(validateNumericInput(input).valid).toBe(false)
      expect(validateNumericInput(input).value).toBeUndefined()
    })

  it('accepts zero, signed decimals, and exponent notation', () => {
    expect(validateNumericInput('0')).toEqual({ valid: true, value: 0 })
    expect(validateNumericInput(' -2.5 ')).toEqual({ valid: true, value: -2.5 })
    expect(validateNumericInput('1e2')).toEqual({ valid: true, value: 100 })
  })

  it('enforces inclusive ranges', () => {
    expect(validateNumericInput('9', { min: 10 }).valid).toBe(false)
    expect(validateNumericInput('21', { max: 20 }).valid).toBe(false)
    expect(validateNumericInput('10', { min: 10, max: 20 }).valid).toBe(true)
    expect(validateNumericInput('20', { min: 10, max: 20 }).valid).toBe(true)
  })

  it('enforces integer and fractional steps with the minimum as the step base', () => {
    expect(validateNumericInput('1.5', { step: 1 }).valid).toBe(false)
    expect(validateNumericInput('0.3', { step: 0.1 }).valid).toBe(true)
    expect(validateNumericInput('0.35', { step: 0.1 }).valid).toBe(false)
    expect(validateNumericInput('3', { min: 1, step: 2 }).valid).toBe(true)
    expect(validateNumericInput('2', { min: 1, step: 2 }).valid).toBe(false)
  })
})
