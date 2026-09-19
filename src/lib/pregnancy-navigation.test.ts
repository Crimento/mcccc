import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import reference from '../data/settings-reference.json'
import { categories, compareSettingsForNavigation, getNavigation, type MenuNode } from './navigation'

const sample = JSON.parse(readFileSync(new URL('../../mc_settings.cfg', import.meta.url), 'utf8')) as Record<string, unknown>
function settingNavigation(key: string) {
  const result = getNavigation(key, reference.find(entry => entry.SettingName === key))
  return { ...result, key, label: result.label ?? key }
}
const pregnancy = Object.keys(sample).map(settingNavigation)
  .filter(setting => setting.category === 'pregnancy').sort(compareSettingsForNavigation)
const menus = categories.find(category => category.id === 'pregnancy')!.menus!

function keysAt(path: string[]) {
  return pregnancy.filter(setting => setting.menuPath.join('/') === path.join('/')).map(setting => setting.key)
}

describe('Pregnancy navigation', () => {
  it('places all 91 existing settings under the ten supplied menus exactly once', () => {
    expect(pregnancy).toHaveLength(91)
    expect(new Set(pregnancy.map(setting => setting.key)).size).toBe(91)
    const counts: Record<string, number> = {}
    for (const setting of pregnancy) {
      const path = setting.menuPath.join('/') || 'root'
      counts[path] = (counts[path] ?? 0) + 1
    }
    expect(counts).toEqual({
      'Adoption Settings': 5,
      'Marriage Sim Selection': 11,
      'Neighborhood Stories Settings': 4,
      Offspring: 9,
      'Other Marriage': 10,
      'Other Pregnancy': 11,
      'Partner Sim Selection': 10,
      'Pet Pregnancy Settings': 6,
      'Pet Pregnancy Settings/Pregnancy Percentage': 3,
      'Pregnant Sim Selection': 13,
      'Spouse Sim Selection': 7,
      'Spouse Sim Selection/Marriage Trait Limits': 2,
    })
    expect(menus).toEqual([
      { label: 'Adoption Settings' },
      { label: 'Marriage Sim Selection' },
      { label: 'Neighborhood Stories Settings' },
      { label: 'Offspring' },
      { label: 'Other Marriage' },
      { label: 'Other Pregnancy' },
      { label: 'Partner Sim Selection' },
      { label: 'Pet Pregnancy Settings', children: [{ label: 'Pregnancy Percentage' }] },
      { label: 'Pregnant Sim Selection' },
      { label: 'Spouse Sim Selection', children: [{ label: 'Marriage Trait Limits' }] },
    ])
    const validPaths = new Set<string>()
    function visit(nodes: MenuNode[], parent: string[] = []) {
      for (const node of nodes) {
        const path = [...parent, node.label]
        validPaths.add(path.join('/'))
        if (node.children) visit(node.children, path)
      }
    }
    visit(menus)
    expect(pregnancy.every(setting => validPaths.has(setting.menuPath.join('/')))).toBe(true)
  })

  it('keeps adoption, marriage selection, and pregnancy selection in the requested order', () => {
    expect(keysAt(['Adoption Settings'])).toEqual([
      'Pregnancy_AdoptionAges', 'Pregnancy_AdoptionPercentMale', 'Pregnancy_OppositeSexAdoptionPercent',
      'Pregnancy_NameInactiveAdoption', 'Pregnancy_SameSexAdoptionPercent',
    ])
    expect(keysAt(['Marriage Sim Selection'])).toEqual([
      'Marriage_AllowHomeless', 'Marriage_BypassDorms', 'Marriage_BypassPlayedHouseholds', 'Marriage_BypassRenters',
      'Marriage_BypassRobots', 'Marriage_BypassActiveRomanticInterest', 'Marriage_DaysToRun',
      'Marriage_FlagGenderPreferencePercent', 'Marriage_AgePercentage', 'Marriage_UseGenderPreference', 'Marriage_TargetSimAges',
    ])
    expect(keysAt(['Pregnant Sim Selection'])).toEqual([
      'Pregnancy_AllowHomeless', 'Pregnancy_BypassDorms', 'Pregnancy_BypassPlayedHouseholds', 'Pregnancy_BypassRenters',
      'Pregnancy_BypassRobots', 'Pregnancy_BypassActiveRomanticInterest', 'Pregnancy_AgeUpDaysLimit',
      'Pregnancy_DaysToRun', 'Pregnancy_FlagGenderPreferencePercent', 'Pregnancy_AllowMalePregnancy',
      'Pregnancy_AgePercentage', 'Pregnancy_UseGenderPreference', 'Pregnancy_TargetSimAges',
    ])
    expect(keysAt(['Other Pregnancy'])).toEqual([
      'Pregnancy_AgeWhenPregnant', 'Pregnancy_AutoMarryPercent', 'Pregnancy_BypassBusinessOwnerMoveouts',
      'Pregnancy_ManualConfirmation', 'Pregnancy_PauseSimsPregnancy', 'Pregnancy_PauseOnPlayableLabor', 'Pregnancy_Duration',
      'Pregnancy_RandomMoodDuration', 'Pregnancy_UseFrameForGender', 'Pregnancy_UseRandomMoods', 'Pregnancy_UseTraitsForPregnancy',
    ])
  })

  it('normalizes legacy menu spellings and separates the two manual confirmation settings', () => {
    expect(settingNavigation('Pregnancy_NSAdoptChildLimit').menuPath).toEqual(['Neighborhood Stories Settings'])
    expect(settingNavigation('Pregnancy_NSAdoptPetLimit').menuPath).toEqual(['Neighborhood Stories Settings'])
    expect(settingNavigation('Pregnancy_BypassBusinessOwnerMoveouts').menuPath).toEqual(['Other Pregnancy'])
    expect(settingNavigation('Marriage_ManualRenameSpouses').menuPath).toEqual(['Other Marriage'])
    for (const [key, path] of [
      ['Marriage_ManualConfirmation', 'Other Marriage'],
      ['Pregnancy_ManualConfirmation', 'Other Pregnancy'],
    ]) {
      expect(settingNavigation(key!)).toMatchObject({
        category: 'pregnancy', menuPath: [path], label: 'Manual Confirmation',
      })
    }
    expect(settingNavigation('Pregnancy_IdenticalOffspringChance').label).toBe('Identical Offspring Chance')
    expect(settingNavigation('Pregnancy_BypassRenters').label).toBe('Bypass Renters')
    expect(settingNavigation('Marriage_FlagGenderPreferencePercent').label).toBe('Flag Gender Preference Percent')
  })

  it('keeps encoded species, trait lists, gender proportions, and offspring weights as their actual keys', () => {
    expect(keysAt(['Pet Pregnancy Settings', 'Pregnancy Percentage'])).toEqual([
      'Pregnancy_CatAgePercentage', 'Pregnancy_DogAgePercentage', 'Pregnancy_HorseAgePercentage',
    ])
    expect(keysAt(['Spouse Sim Selection', 'Marriage Trait Limits'])).toEqual([
      'Marriage_RequiredTraitsList', 'Marriage_ConflictTraitsList',
    ])
    for (const key of ['Pregnancy_OffspringGenderPercents', 'Pregnancy_PercentWeights']) {
      expect(pregnancy.filter(setting => setting.key === key)).toHaveLength(1)
      expect(settingNavigation(key).menuPath).toEqual(['Offspring'])
      expect(typeof sample[key]).toBe('object')
    }
    expect(keysAt(['Offspring'])).not.toContain('Pregnancy_OffspringGender')
    expect(keysAt(['Other Pregnancy'])).toContain('Pregnancy_PauseSimsPregnancy')
    expect(keysAt(['Other Pregnancy'])).toContain('Pregnancy_PauseOnPlayableLabor')
    expect(settingNavigation('Pregnancy_Future').category).toBe('other')
  })

  it('preserves actual module ownership for motive decay and notifications', () => {
    expect(settingNavigation('Pregnancy_BabyMotiveDecay')).toMatchObject({
      category: 'core', menuPath: ['Gameplay', 'Motive Decay'],
    })
    expect(settingNavigation('Show_PetPregnancyNotificationType')).toMatchObject({
      category: 'pregnancy', menuPath: ['Pet Pregnancy Settings'], label: 'Show Pregnancy Notifications',
    })
    for (const key of ['Show_MarriageNotificationType', 'Show_BirthNotificationType', 'Show_PregnancyNotificationType']) {
      expect(settingNavigation(key).category).toBe('core')
      expect(pregnancy.some(setting => setting.key === key)).toBe(false)
    }
    expect(pregnancy.filter(setting => setting.key.startsWith('Marriage_'))).toHaveLength(30)
  })
})
