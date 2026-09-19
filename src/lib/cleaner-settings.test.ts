import { describe, expect, it } from 'vitest'
import { cleanerHouseholdOptions, parsePetRelationship } from './cleaner-settings'

describe('Cleaner household choices', () => {
  it('changes only the household prefix and preserves the complete relationship suffix byte for byte', () => {
    const suffix = ' C,025,FUTURE_RULE,  '
    const options = cleanerHouseholdOptions(`FUTURE_HOUSEHOLD,${suffix}`)
    expect(options).toEqual([
      { value: `A,${suffix}`, label: 'Include Active Household' },
      { value: `AO,${suffix}`, label: 'Include Active Sims Only' },
      { value: `N,${suffix}`, label: 'Include NPC Households' },
      { value: `P,${suffix}`, label: 'Include Played Households' },
      { value: `PO,${suffix}`, label: 'Include Played Sims Only' },
    ])
    expect(cleanerHouseholdOptions('N,A')?.map(option => option.value)).toEqual(['A,A', 'AO,A', 'N,A', 'P,A', 'PO,A'])
    options![0]!.label = 'Changed locally'
    expect(cleanerHouseholdOptions('N,F')?.[0]).toEqual({ value: 'A,F', label: 'Include Active Household' })
  })

  it('keeps incomplete pairs in the generic editor instead of manufacturing a suffix', () => {
    for (const malformed of ['', 'N', ',A', 'N,', 'N, \t ']) {
      expect(cleanerHouseholdOptions(malformed)).toBeUndefined()
    }
  })
})

describe('Cleaner pet relationship parsing', () => {
  it('recognizes confirmed modes and finite custom values without rewriting their raw level token', () => {
    for (const mode of ['A', 'F', 'Z']) {
      expect(parsePetRelationship(` ${mode}\t`)).toMatchObject({ mode })
    }
    expect(parsePetRelationship(' C, 025\t')).toMatchObject({ mode: 'C', rawLevel: ' 025\t', level: 25 })
    expect(parsePetRelationship('C,25.5')).toMatchObject({ mode: 'C', rawLevel: '25.5', level: 25.5 })
    // Imported outliers remain readable data; the editor validates subsequent edits.
    expect(parsePetRelationship('C,-1')).toMatchObject({ mode: 'C', level: -1 })
    expect(parsePetRelationship('C,101')).toMatchObject({ mode: 'C', level: 101 })
  })

  it('leaves unknown modes and malformed custom encodings intact for fallback display', () => {
    for (const malformed of ['', 'FUTURE_MODE', 'A,25', 'C', 'C,', 'C,   ', 'C,unknown', 'C,NaN', 'C,Infinity', 'C,25,F']) {
      expect(parsePetRelationship(malformed)).toBeNull()
    }
  })
})
