import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { getOccultPregnancyFields } from './occult-pregnancy'

const sample = JSON.parse(readFileSync(new URL('../../mc_settings.cfg', import.meta.url), 'utf8')) as Record<string, unknown>

describe('occult pregnancy CSV fields', () => {
  it('covers all 24 supplied combinations without exposing inactive sentinel positions', () => {
    const entries = Object.entries(sample).filter(([key]) => key.startsWith('Occult_CustomPregnancy'))
    expect(entries).toHaveLength(24)
    for (const [key, value] of entries) {
      const tokens = (value as string).split(',')
      const fields = getOccultPregnancyFields(key, value)
      expect(fields, key).toMatchObject({ min: 0, max: 100, step: 1, unit: '%', tokenCount: tokens.length, totalMax: 100, remainderLabel: 'Human' })
      const active = tokens.flatMap((token, index) => Number(token) >= 0 ? [index] : [])
      expect(new Set(fields!.indices), key).toEqual(new Set(active))
      expect(fields!.labels).toHaveLength(active.length)
    }
  })

  it('orders controls by the selected species while retaining their actual storage positions', () => {
    expect(getOccultPregnancyFields('Occult_CustomPregnancyFairyAlien', sample.Occult_CustomPregnancyFairyAlien))
      .toMatchObject({ labels: ['Fairy', 'Hybrid', 'Alien'], indices: [6, 1, 0] })
    expect(getOccultPregnancyFields('Occult_CustomPregnancyMermaidVampire', sample.Occult_CustomPregnancyMermaidVampire))
      .toMatchObject({ labels: ['Mermaid', 'Vampire'], indices: [3, 2] })
    expect(getOccultPregnancyFields('Occult_CustomPregnancyWerewolfWitch', sample.Occult_CustomPregnancyWerewolfWitch))
      .toMatchObject({ labels: ['Werewolf', 'Spellcaster'], indices: [5, 4] })
    expect(getOccultPregnancyFields('Occult_CustomPregnancyHybridHuman', sample.Occult_CustomPregnancyHybridHuman))
      .toMatchObject({ labels: ['Alien', 'Hybrid'], indices: [0, 1] })
  })

  it('retains imported decimals and outliers while applying the budget only to selected outcome positions', () => {
    expect(getOccultPregnancyFields('Occult_CustomPregnancyVampireHuman', '-1,-1, 050.5,-1,-1,-1,777.00'))
      .toMatchObject({ labels: ['Vampire'], indices: [2], tokenCount: 7, totalMax: 100, remainderLabel: 'Human' })
    expect(getOccultPregnancyFields('Occult_CustomPregnancyAlienHuman', '080, 80.5,-1,-1,-1,-1'))
      .toMatchObject({ labels: ['Alien', 'Hybrid'], indices: [0, 1], tokenCount: 6, totalMax: 100 })
    // An existing out-of-range number is not silently removed during import.
    expect(getOccultPregnancyFields('Occult_CustomPregnancyAlienHuman', '-5,125,-1,-1,-1,-1')).toBeDefined()
  })

  it('keeps unknown keys, incompatible shapes and nonnumeric tokens out of numeric controls', () => {
    for (const key of ['Occult_CustomPregnancyFutureHuman', 'Occult_CustomPregnancyFairyHybrid', 'constructor']) {
      expect(getOccultPregnancyFields(key, '0,0,-1,-1,-1,-1,50')).toBeUndefined()
    }
    for (const value of [
      null, false, [0, 100, -1, -1, -1, -1],
      '0,100,-1,-1,-1', '0,100,-1,-1,-1,-1,0,0',
      '0,100,-1,-1,-1,-1,FUTURE', '0,100,,-1,-1,-1', '0,100,-1,-1,-1,1e400',
    ]) {
      expect(getOccultPregnancyFields('Occult_CustomPregnancyAlienHuman', value)).toBeUndefined()
    }
    expect(getOccultPregnancyFields('Occult_CustomPregnancyFairyHuman', '-1,-1,-1,-1,-1,50')).toBeUndefined()
  })

  it('returns fresh labels and indices so edits cannot change later lookups', () => {
    const first = getOccultPregnancyFields('Occult_CustomPregnancyFairyAlien', sample.Occult_CustomPregnancyFairyAlien)!
    first.labels[0] = 'Changed'
    first.indices![0] = 0
    first.max = 5
    first.totalMax = 5
    first.remainderLabel = 'Changed'
    expect(getOccultPregnancyFields('Occult_CustomPregnancyFairyAlien', sample.Occult_CustomPregnancyFairyAlien))
      .toMatchObject({ labels: ['Fairy', 'Hybrid', 'Alien'], indices: [6, 1, 0], max: 100, totalMax: 100, remainderLabel: 'Human' })
  })
})
