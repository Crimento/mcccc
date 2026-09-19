import { describe, expect, it } from 'vitest'
import type { JsonValue } from './config'
import {
  addMarriageTraitPair,
  isMarriageTraitPair,
  removeMarriageTraitPair,
  updateMarriageTraitPair,
} from './marriage-traits'

const neat = '16858'
const paranoid = '203542'
const hugeId = '900719925474099312345678901234567890'

describe('marriage trait pair editing', () => {
  it('recognizes exact two-string shapes without coercing unknown or padded IDs', () => {
    expect(isMarriageTraitPair([neat, paranoid])).toBe(true)
    expect(isMarriageTraitPair([` ${neat}\t`, hugeId])).toBe(true)
    expect(isMarriageTraitPair(['MODDED_TRAIT', '00016858'])).toBe(true)
    for (const value of [
      null, true, 1, '16858,203542', [], [neat], [neat, paranoid, neat],
      [16858, paranoid], [neat, null], ['', paranoid], [neat, ' \t '], { first: neat, second: paranoid },
    ] satisfies JsonValue[]) expect(isMarriageTraitPair(value)).toBe(false)
  })

  it('changes only the selected pair side and preserves sibling objects and raw strings', () => {
    const originalPair: [string, string] = [neat, ` ${hugeId}\t`]
    const malformed = { future: [false, null, '001'] }
    const unknownPair: [string, string] = ['00016858', 'MODDED_TRAIT']
    const values: JsonValue[] = [originalPair, malformed, unknownPair, 9]
    Object.freeze(originalPair)
    Object.freeze(values)

    const next = updateMarriageTraitPair(values, 0, 0, paranoid)
    expect(next).not.toBe(values)
    expect(next[0]).toEqual([paranoid, ` ${hugeId}\t`])
    expect(next[0]).not.toBe(originalPair)
    expect(next[1]).toBe(malformed)
    expect(next[2]).toBe(unknownPair)
    expect(next[3]).toBe(9)
    expect(originalPair).toEqual([neat, ` ${hugeId}\t`])
  })

  it('allows a deliberate canonical replacement without normalizing the other side', () => {
    const values: JsonValue[] = [[` ${neat} `, ` ${paranoid} `]]
    expect(updateMarriageTraitPair(values, 0, 0, neat)).toEqual([[neat, ` ${paranoid} `]])
    expect(updateMarriageTraitPair(values, 0, 1, neat)).toEqual([[` ${neat} `, neat]])
  })

  it('allows identical traits, duplicate pairs and preserved reverse order', () => {
    const values: JsonValue[] = [[neat, paranoid], [paranoid, neat], [neat, neat]]
    const next = addMarriageTraitPair(values, neat, neat)
    expect(next).toEqual([[neat, paranoid], [paranoid, neat], [neat, neat], [neat, neat]])
    expect(next[0]).toBe(values[0])
    expect(values).toHaveLength(3)
    expect(updateMarriageTraitPair(values, 0, 1, neat)).toEqual([[neat, neat], [paranoid, neat], [neat, neat]])
    expect(addMarriageTraitPair([], neat, paranoid)).toEqual([[neat, paranoid]])
  })

  it('rejects unknown, pet, padded and inexact code injections', () => {
    const values: JsonValue[] = [[neat, paranoid]]
    for (const code of [hugeId, 'MODDED_TRAIT', '171610', ` ${neat} `, '00016858', '']) {
      expect(updateMarriageTraitPair(values, 0, 0, code)).toBe(values)
      expect(addMarriageTraitPair(values, code, paranoid)).toBe(values)
      expect(addMarriageTraitPair(values, neat, code)).toBe(values)
    }
    expect(updateMarriageTraitPair(values, 0, 0, neat)).toBe(values)
  })

  it('preserves malformed entries and rejects invalid indices or positions', () => {
    const values: JsonValue[] = [[neat, paranoid], ['', neat], [neat, 203542], { future: true }, [neat]]
    for (let index = 1; index < values.length; index++) {
      expect(updateMarriageTraitPair(values, index, 0, paranoid)).toBe(values)
      expect(removeMarriageTraitPair(values, index)).toBe(values)
    }
    for (const index of [-1, 0.5, values.length, NaN, Infinity]) {
      expect(updateMarriageTraitPair(values, index, 0, paranoid)).toBe(values)
      expect(removeMarriageTraitPair(values, index)).toBe(values)
    }
    expect(updateMarriageTraitPair(values, 0, 2 as 0 | 1, paranoid)).toBe(values)
    expect(removeMarriageTraitPair([], 0)).toEqual([])
  })

  it('explicitly removes valid unknown pairs while keeping every other entry untouched', () => {
    const knownPair: [string, string] = [neat, paranoid]
    const unknownPair: [string, string] = [` ${hugeId} `, 'MODDED_TRAIT']
    const malformed = { untouched: ['0000', null] }
    const values: JsonValue[] = [knownPair, unknownPair, malformed]
    Object.freeze(unknownPair)
    Object.freeze(values)
    const next = removeMarriageTraitPair(values, 1)
    expect(next).toEqual([knownPair, malformed])
    expect(next[0]).toBe(knownPair)
    expect(next[1]).toBe(malformed)
    expect(values).toHaveLength(3)
  })
})
