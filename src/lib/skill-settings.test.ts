import { describe, expect, it } from 'vitest'
import { skillListKeys, skillOptions, skillSettingKeys, toggleKnownSkill } from './skill-settings'

describe('known skill selection', () => {
  const charisma = '16699'
  const cooking = '16705'
  const hugeId = '123456789012345678901234567890'

  it('preserves unknown raw tokens, duplicates, empty fields and large IDs when appending', () => {
    const original = `  MODDED_SKILL ,${hugeId}, 0016699 ,MODDED_SKILL,,\t${hugeId}\t,`
    expect(toggleKnownSkill(original, charisma, true)).toBe(`${original},${charisma}`)
    expect(toggleKnownSkill(toggleKnownSkill(original, charisma, true), charisma, false)).toBe(original)
  })

  it('recognizes padded known IDs without rewriting their representation', () => {
    const original = `  ${charisma}\t,${hugeId},${charisma}, ${cooking} `
    expect(toggleKnownSkill(original, charisma, true)).toBe(original)
    expect(toggleKnownSkill(original, cooking, true)).toBe(original)
    expect(toggleKnownSkill(original, charisma, false)).toBe(`${hugeId}, ${cooking} `)
  })

  it('removes only the selected known segments while preserving other raw fields', () => {
    const original = `${charisma}, ${hugeId} ,${cooking},${charisma},, ${hugeId} ,`
    expect(toggleKnownSkill(original, charisma, false)).toBe(` ${hugeId} ,${cooking},, ${hugeId} ,`)
  })

  it('handles empty lists and no-op selections without introducing extra separators', () => {
    expect(toggleKnownSkill('', charisma, true)).toBe(charisma)
    expect(toggleKnownSkill('', charisma, false)).toBe('')
    expect(toggleKnownSkill(charisma, charisma, false)).toBe('')
    expect(toggleKnownSkill(` ${hugeId} ,,`, charisma, false)).toBe(` ${hugeId} ,,`)
    expect(toggleKnownSkill(charisma, charisma, true)).toBe(charisma)
  })

  it('cannot add or remove unverified, modded, or inexact code arguments', () => {
    const original = `${charisma},999999993,999999994, ${hugeId} ,MODDED_SKILL`
    for (const code of ['999999993', '999999994', hugeId, 'MODDED_SKILL', ` ${charisma} `, '', '0016699']) {
      expect(toggleKnownSkill(original, code, true)).toBe(original)
      expect(toggleKnownSkill(original, code, false)).toBe(original)
      expect(toggleKnownSkill('', code, true)).toBe('')
    }
  })

  it('keeps config-specific unknown IDs separate between independent inputs', () => {
    const first = toggleKnownSkill('CUSTOM_A', charisma, true)
    const second = toggleKnownSkill('CUSTOM_B', charisma, true)
    expect(first).toBe(`CUSTOM_A,${charisma}`)
    expect(second).toBe(`CUSTOM_B,${charisma}`)
    expect(toggleKnownSkill(second, 'CUSTOM_A', true)).toBe(second)
  })

  it('scopes known options and grouping to the reviewed skills and exact settings', () => {
    expect(skillOptions).toHaveLength(62)
    expect(new Set(skillOptions.map(option => option.value)).size).toBe(62)
    const labels = skillOptions.map(option => option.label)
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b)))
    for (const option of [
      { value: '274197', label: 'Entrepreneur' },
      { value: '231908', label: 'Fabrication' },
      { value: '192655', label: 'Media Production' },
      { value: '255249', label: 'Medium' },
    ]) {
      expect(skillOptions).toContainEqual(option)
      expect(toggleKnownSkill('', option.value, true)).toBe(option.value)
    }
    expect(skillListKeys.size).toBe(4)
    expect(skillSettingKeys.size).toBe(5)
    for (const key of skillListKeys) expect(skillSettingKeys.has(key)).toBe(true)
    expect(skillListKeys.has('Skill_Difficulty_Adjustment')).toBe(false)
    expect(skillSettingKeys.has('Skill_FutureSetting')).toBe(false)
  })
})
