import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import reference from '../data/settings-reference.json'
import { categories, compareSettingsForNavigation, getNavigation } from './navigation'

const sample = JSON.parse(readFileSync(new URL('../../mc_settings.cfg', import.meta.url), 'utf8')) as Record<string, unknown>
function settingNavigation(key: string) {
  const result = getNavigation(key, reference.find(entry => entry.SettingName === key))
  return { ...result, key, label: result.label ?? key }
}
const occult = Object.keys(sample).map(settingNavigation)
  .filter(setting => setting.category === 'occult').sort(compareSettingsForNavigation)

describe('Occult navigation', () => {
  it('preserves 52 unique storage keys and keeps the three shared keys at the module root', () => {
    expect(occult).toHaveLength(52)
    expect(new Set(occult.map(setting => setting.key)).size).toBe(52)
    expect(occult.filter(setting => !setting.menuPath.length).map(setting => setting.key)).toEqual([
      'Occult_OccultTypeAgeMultiplier', 'Occult_OccultTypeMaximumAge', 'Occult_UseCustomPregnancy',
    ])
    const counts: Record<string, number> = {}
    for (const setting of occult.filter(setting => setting.menuPath.length)) {
      counts[setting.menuPath[0]!] = (counts[setting.menuPath[0]!] ?? 0) + 1
    }
    expect(counts).toEqual({ Aliens: 17, Fairies: 7, Mermaids: 5, Spellcasters: 5, Vampires: 9, Werewolves: 6 })
  })

  it('defines species order with shared aging and pregnancy projection destinations', () => {
    const menus = categories.find(category => category.id === 'occult')!.menus!
    expect(menus.map(menu => menu.label)).toEqual(['Aliens', 'Fairies', 'Mermaids', 'Spellcasters', 'Vampires', 'Werewolves'])
    for (const menu of menus) {
      expect(menu.children?.map(child => child.label)).toContain('Aging Settings')
      const pregnancy = menu.children?.find(child => child.label === 'Other Pregnancy')
      expect(pregnancy?.children?.map(child => child.label)).toEqual(['Custom Percentages'])
    }
    expect(menus[0]!.children?.map(menu => menu.label)).toEqual([
      'Abduction Pregnancy Settings', 'Abduction Settings', 'Aging Settings', 'Other Pregnancy',
    ])
    expect(menus[4]!.children?.map(menu => menu.label)).toEqual(['Aging Settings', 'Other Pregnancy', 'Risky Vampirism'])
  })

  it('assigns all 24 pairing strings to their matching single-setting menu leaves', () => {
    const pairs = occult.filter(setting => setting.key.startsWith('Occult_CustomPregnancy'))
    expect(pairs).toHaveLength(24)
    for (const setting of pairs) {
      expect(setting.menuPath).toHaveLength(4)
      expect(setting.menuPath.slice(1, 3)).toEqual(['Other Pregnancy', 'Custom Percentages'])
      expect(setting.menuPath[3]).toBe(setting.label)
      expect(typeof sample[setting.key]).toBe('string')
      expect(pairs.filter(other => other.menuPath.join('/') === setting.menuPath.join('/'))).toHaveLength(1)
    }
    expect(pairs.filter(setting => setting.menuPath[0] === 'Aliens').map(setting => setting.label)).toEqual([
      'Alien and Hybrid', 'Hybrid', 'Alien and Human', 'Hybrid and Human',
    ])
    expect(pairs.filter(setting => setting.menuPath[0] === 'Fairies').map(setting => setting.label)).toEqual([
      'Fairy and Human', 'Fairy and Alien', 'Fairy and Vampire', 'Fairy and Mermaid', 'Fairy and Spellcaster', 'Fairy and Werewolf',
    ])
  })

  it.each([
    ['Occult_IgnoreCasOnAbduction', ['Aliens', 'Abduction Pregnancy Settings']],
    ['Occult_VampireSkillOnAgeUp', ['Vampires']],
    ['Occult_CustomPregnancyFairyVampire', ['Fairies', 'Other Pregnancy', 'Custom Percentages', 'Fairy and Vampire']],
    ['Occult_CustomPregnancyWitchHuman', ['Spellcasters', 'Other Pregnancy', 'Custom Percentages', 'Spellcaster and Human']],
    ['Occult_CustomPregnancyWerewolfWitch', ['Werewolves', 'Other Pregnancy', 'Custom Percentages', 'Werewolf and Spellcaster']],
  ])('correctly routes %s despite reference spelling or legacy key names', (key, menuPath) => {
    expect(settingNavigation(key as string).menuPath).toEqual(menuPath)
  })

  it('keeps abduction and risky-vampirism controls in the requested order', () => {
    expect(occult.filter(setting => setting.menuPath[1] === 'Abduction Pregnancy Settings').map(setting => setting.key)).toEqual([
      'Occult_AgePercentage', 'Occult_AbductionPregnancyAges', 'Occult_AbductionPregnancyGenders',
      'Occult_AlienPollinatorGenders', 'Occult_IgnoreCasOnAbduction',
    ])
    expect(occult.filter(setting => setting.menuPath[1] === 'Abduction Settings').map(setting => setting.key)).toEqual([
      'Occult_AbductionAges', 'Occult_AlienFrequency', 'Occult_AbductionStartHour', 'Occult_AbductionDuration',
      'Occult_AbductionAllowNPC', 'Occult_TimeBetweenAbductions',
    ])
    expect(occult.filter(setting => setting.menuPath[1] === 'Risky Vampirism').map(setting => setting.key)).toEqual([
      'Occult_RiskyVampNeedCreation', 'Occult_RiskyVampPercentages', 'Occult_RiskyVampNotification',
    ])
  })
})
