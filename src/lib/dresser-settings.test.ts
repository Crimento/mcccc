import { describe, expect, it } from 'vitest'
import { situationOutfitEntries, situationOutfitUnknownEntries, updateSituationOutfit } from './dresser-settings'

describe('Dresser situation outfit rules', () => {
  it('interprets all twelve supplied codes without confusing the City Walkby code with an outfit code', () => {
    const source = 'V:E,RF:E,D:E,HF:E,SF:E,CW:AT,SRN:E,IL:E,UNV:E,THR:E,HOR:E,RNT:E'
    const rows = situationOutfitEntries(source)
    expect(rows.map(row => [row.code, row.label])).toEqual([
      ['CW', 'City Walkby Situations'], ['D', 'Date Situations'], ['RNT', 'For Rent Street Loungers'],
      ['HOR', 'Horse Ranch Dance Hall'], ['HF', 'Humor Festival Situations'], ['IL', 'Island Living Situations'],
      ['SRN', 'Rain Walkby Situations'], ['RF', 'Romantic Festival Situations'], ['SF', 'Spice Festival Situations'],
      ['THR', 'Thrift Store Situations'], ['UNV', 'University Situations'], ['V', 'Vampire Situations'],
    ])
    expect(rows.find(row => row.code === 'CW')).toMatchObject({ values: ['AT'], ambiguous: false })
    expect(rows.filter(row => row.code !== 'CW').every(row => row.values.length === 1 && row.values[0] === 'E' && !row.ambiguous)).toBe(true)
    expect(situationOutfitUnknownEntries(source)).toEqual([])
  })

  it('updates every matching duplicate while preserving surrounding whitespace and every unrelated raw token', () => {
    const original = ' V : E \t,RF:E, CW : AT ,CW: F\t, X : HW ,broken::value,,D:SL'
    const city = situationOutfitEntries(original).find(row => row.code === 'CW')!
    expect(new Set(city.values)).toEqual(new Set(['AT', 'F']))
    expect(city.ambiguous).toBe(true)
    expect(updateSituationOutfit(original, 'CW', 'CW')).toBe(' V : E \t,RF:E, CW : CW ,CW: CW\t, X : HW ,broken::value,,D:SL')
    expect(updateSituationOutfit(original, 'CW', null)).toBe(' V : E \t,RF:E, X : HW ,broken::value,,D:SL')
    expect(situationOutfitEntries('D:F,D:F').find(row => row.code === 'D')?.ambiguous).toBe(false)
  })

  it('keeps unknown or malformed entries opaque and rejects non-standard outfit arguments, including makeup-only categories', () => {
    const original = ' X : HW ,broken::value,V:,D:FUTURE'
    expect(situationOutfitUnknownEntries(original)).toEqual([' X : HW ', 'broken::value', 'V:'])
    expect(situationOutfitEntries(original).find(row => row.code === 'D')?.values).toEqual(['FUTURE'])
    for (const code of ['X', ' CW ', 'FUTURE', '']) expect(updateSituationOutfit(original, code, 'E')).toBe(original)
    for (const outfit of ['FUTURE', ' E ', '', 'B', 'BT', 'C', 'SI', 'SP']) expect(updateSituationOutfit(original, 'D', outfit)).toBe(original)
  })

  it('adds only the explicitly selected override and removes it without filling other absent rows', () => {
    const rows = situationOutfitEntries('')
    expect(rows).toHaveLength(12)
    expect(rows.every(row => row.values.length === 0 && !row.ambiguous)).toBe(true)
    expect(updateSituationOutfit('', 'V', null)).toBe('')
    expect(updateSituationOutfit('', 'V', 'F')).toBe('V:F')
    expect(updateSituationOutfit('V:F', 'V', null)).toBe('')
    expect(updateSituationOutfit('MODDED:HW,', 'D', 'F')).toBe('MODDED:HW,,D:F')
  })
})
