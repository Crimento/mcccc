import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import reference from '../data/settings-reference.json'
import { categories, compareSettingsForNavigation, getNavigation } from './navigation'

const sample = JSON.parse(readFileSync(new URL('../../mc_settings.cfg', import.meta.url), 'utf8')) as Record<string, unknown>
function settingNavigation(key: string) {
  const result = getNavigation(key, reference.find(entry => entry.SettingName === key))
  return { ...result, key, label: result.label ?? key }
}
const population = Object.keys(sample).map(settingNavigation)
  .filter(setting => setting.category === 'population').sort(compareSettingsForNavigation)

describe('Population navigation', () => {
  it('places all 45 existing settings in the supplied hierarchy once', () => {
    expect(population).toHaveLength(45)
    expect(new Set(population.map(setting => setting.key)).size).toBe(45)
    const counts: Record<string, number> = {}
    for (const setting of population) {
      const path = setting.menuPath.join('/') || 'root'
      counts[path] = (counts[path] ?? 0) + 1
    }
    expect(counts).toEqual({
      root: 1,
      'Moving Settings': 13,
      'Populating Settings': 9,
      'Populating Settings/Import Tray Settings': 7,
      'Populating Settings/CAS Custom Gender Settings': 3,
      'Random Lot Challenges': 4,
      'Neighborhood Stories Settings': 1,
      'Other Settings': 7,
    })
    expect(categories.find(category => category.id === 'population')!.menus).toEqual([
      { label: 'Moving Settings' },
      { label: 'Populating Settings', children: [{ label: 'Import Tray Settings' }, { label: 'CAS Custom Gender Settings' }] },
      { label: 'Random Lot Challenges' },
      { label: 'Neighborhood Stories Settings' },
      { label: 'Other Settings' },
    ])
  })

  it('preserves menu order, including chronological population percentages and custom gender controls', () => {
    expect(population.filter(setting => setting.menuPath.join('/') === 'Populating Settings').map(setting => setting.key)).toEqual([
      'Population_PercentBaby', 'Population_PercentInfant', 'Population_PercentToddler', 'Population_PercentChild',
      'Population_PercentAdult', 'Population_PercentElder', 'Population_PercentMale', 'Population_ButlerAges', 'Population_RunDresser',
    ])
    expect(population.filter(setting => setting.menuPath[1] === 'Import Tray Settings').map(setting => setting.key)).toEqual([
      'Population_RandomUseTraySimPercent', 'Population_RandomLimitHouseholdType', 'Population_UseTagsOnImportSims',
      'Population_RandomUseTrayGenderSet', 'Population_RandomUseTrayOutfits', 'Population_ImportSimNameChoice', 'Population_ImportBypassAppearance',
    ])
    expect(population.filter(setting => setting.menuPath[1] === 'CAS Custom Gender Settings').map(setting => setting.key)).toEqual([
      'Population_MatchCasToFrame', 'Population_PercentFemaleFrame', 'Population_PercentMaleFrame',
    ])
    expect(population.filter(setting => setting.menuPath[0] === 'Random Lot Challenges').map(setting => setting.key)).toEqual([
      'Population_RandomChallengeLotType', 'Population_RandomChallengeTimeUnits', 'Population_RandomChallengeMaxTime', 'Population_RandomChallengeMaxNum',
    ])
  })

  it('uses the observed dorm setting, correct vampire label, and actual module ownership', () => {
    expect(settingNavigation('Population_MovingBypassDorms')).toMatchObject({
      category: 'population', menuPath: ['Moving Settings'], label: 'Bypass Dorm Residents',
    })
    expect(settingNavigation('Population_EnforceVampireHomes')).toMatchObject({
      category: 'population', menuPath: ['Moving Settings'], label: 'Enforce Vampire Homes',
    })
    expect(settingNavigation('Population_MoveTeenDependent').menuPath).toEqual(['Moving Settings'])
    expect(settingNavigation('Show_MovingNotificationType').category).toBe('core')
    expect(settingNavigation('Show_HouseEmptyNotification').category).toBe('core')
    expect(settingNavigation('Population_Future').category).toBe('other')
  })

  it('keeps encoded option groups as individual settings rather than fabricated menu keys', () => {
    expect(population.filter(setting => !setting.menuPath.length).map(setting => setting.key)).toEqual(['Population_BarNights'])
    expect(settingNavigation('Population_BarNights').label).toBe('Enable or Disable Bar Nights')
    for (const key of ['Population_NumAdjustLot', 'Population_DisableImmortalSims']) {
      expect(population.filter(setting => setting.key === key)).toHaveLength(1)
      expect(settingNavigation(key).menuPath).toEqual(['Other Settings'])
      expect(typeof sample[key]).toBe('string')
    }
    expect(population.every(setting => setting.menuPath.length <= 2)).toBe(true)
  })
})
