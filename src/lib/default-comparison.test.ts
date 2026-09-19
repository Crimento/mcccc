import { describe, expect, it, vi } from 'vitest'
import { getSettingMeta } from './catalog'
import { compareSettingDefault } from './default-comparison'
import { changedKeys, type JsonValue } from './config'
import snapshot from '../data/default-settings.json'

vi.mock('../data/settings-reference.json', async importOriginal => {
  const original = await importOriginal<{ default: Record<string, string>[] }>()
  return { default: [...original.default, ...Object.entries({
    Test_Enabled: 'Enabled', Test_Disabled: 'Disabled', Test_Scientific: '1e2',
    Test_Fraction: '.5', Test_Incomplete: '{"known": 1, ...}', Test_NonFinite: '1e999', Test_Prose: 'All lot abbreviations.',
  }).map(([SettingName, DefaultValue]) => ({ SettingName, DefaultValue, Description: '', MenuPath: '', Module: '' }))] }
})

const compare = (key: string, value: JsonValue) => compareSettingDefault(getSettingMeta(key, value), value)
const humanDefault = { Baby: 0, Infant: 0, Toddler: 0, Child: 0, Teen: 0, YoungAdult: 0, Adult: 0, Elder: 0 }

describe('comparison against documented defaults', () => {
  it('prioritizes curated defaults, keeps import changes separate and never mutates saved values', () => {
    const meta = { ...getSettingMeta('Test_Reviewed', 30), defaultValue: 30, defaultLabel: 'Reviewed speed' }
    expect(compareSettingDefault(meta, 30)).toEqual({ status: 'default', label: 'Reviewed speed', source: 'reference' })
    expect(compare('Game_Time_Speed', 30).status).toBe('different')
    const imported = Object.freeze({ Game_Time_Speed: 50, Show_Notifications: true })
    expect(changedKeys(imported, imported)).toEqual([])
    expect(compare('Game_Time_Speed', imported.Game_Time_Speed).status).toBe('different')
    expect(imported).toEqual({ Game_Time_Speed: 50, Show_Notifications: true })
  })

  it('accepts complete boolean and numeric literals but does not equate mismatched saved types', () => {
    for (const [key, value] of [
      ['Test_Enabled', true], ['Test_Disabled', false], ['Test_Scientific', 100], ['Test_Fraction', 0.5],
      ['Show_Notifications', true], ['Woohoo_BirthControlDuration', 2],
    ] as const) expect(compare(key, value).status, key).toBe('default')
    expect(compare('Test_Enabled', false).status).toBe('different')
    for (const [key, value] of [
      ['Test_Enabled', 'true'], ['Game_Time_Speed', '25'], ['Show_Notifications', 1],
      ['Game_Time_Speed', null], ['Game_Time_Speed', Number.NaN],
    ] as const) expect(compare(key, value).status, key).toBe('unknown')
  })

  it('resolves verified choice labels and codes without changing numeric or string storage types', () => {
    expect(compare('Dresser_FacialHairAges', 'YA')).toMatchObject({ status: 'default', label: 'Young adult' })
    expect(compare('Show_MovingNotificationType', '0').status).toBe('default')
    expect(compare('Show_MovingNotificationType', 0).status).toBe('unknown')
    expect(compare('Relationship_BreakupMoveoutSim', 1)).toMatchObject({ status: 'default', label: 'Male Sim' })
    expect(compare('Relationship_BreakupMoveoutSim', '1').status).toBe('unknown')
    expect(compare('Show_MovingNotificationType', 'FUTURE')).toMatchObject({ status: 'different' })
    expect(compare('Autosave_HexSlotNumber', '1111').status).toBe('default')
    expect(compare('Autosave_HexSlotNumber', 1111).status).toBe('unknown')
  })

  it('compares multiselects as independent sets while retaining unfamiliar codes as real differences', () => {
    expect(compare('Population_BarNights', ' SI, LA,KN,GH,AL,BE,GU,GU ').status).toBe('default')
    expect(compare('Dresser_MakeupOutfits', 'SW,SL,AT,P,F,E').status).toBe('default')
    expect(compare('Population_BarNights', 'SI,LA,KN,GH,AL,BE,GU,FUTURE').status).toBe('different')
    expect(compare('Marriage_DaysToRun', '').status).toBe('default')
    expect(compare('Marriage_DaysToRun', 'MO').status).toBe('different')
    expect(compare('Population_BarNights', ['GU', 'BE']).status).toBe('unknown')
  })

  it('compares all ordered numeric CSV positions, including inactive values, without treating future positions as defaults', () => {
    expect(compare('Occult_CustomPregnancyMermaidAlien', ' 0,0.0,-1,050,-1,-1').status).toBe('default')
    expect(compare('Occult_CustomPregnancyMermaidAlien', '50,0,-1,0,-1,-1').status).toBe('different')
    expect(compare('Occult_CustomPregnancyMermaidAlien', '0,0,0,50,-1,-1').status).toBe('different')
    expect(compare('Occult_CustomPregnancyMermaidAlien', '0,0,-1,50,-1,-1,7').status).toBe('unknown')
    expect(compare('Occult_CustomPregnancyMermaidAlien', '0,0,-1,future,-1,-1').status).toBe('unknown')
    expect(compare('Marriage_AgePercentage', '020,20.0, 20,20').status).toBe('default')
    expect(compare('Appearance_FemaleFitLimits', '-100.0, 100').status).toBe('default')
  })

  it('does not infer factory settings from incomplete prose, a display label or an unfamiliar key', () => {
    for (const [key, value] of [
      ['Menu_Order', {}], ['Test_Prose', 'BAR,GYM'], ['Test_Incomplete', { known: 1 }],
      ['Future_Setting', false], ['Test_NonFinite', 0],
    ] as const) expect(compare(key, value)).toMatchObject({ status: 'unknown', reason: expect.any(String) })
    const meta = { ...getSettingMeta('Future_Setting', 0), defaultLabel: '0' }
    expect(compareSettingDefault(meta, 0).status).toBe('unknown')
  })

  it('treats lifespan zero sentinels as defaults while keeping explicit durations and uncertain shapes separate', () => {
    expect(compare('AgeSpanNormal', humanDefault)).toMatchObject({ status: 'default', label: 'EA default (0 for every age)' })
    expect(compare('AgeSpanNormal', { ...humanDefault, Adult: 42 }).status).toBe('different')
    expect(compare('AgeSpanHorseShort', { Elder: 0, Adult: 0, Child: 0 }).status).toBe('default')
    for (const value of [{ Adult: 0 }, { ...humanDefault, FutureAge: 0 }, { ...humanDefault, Baby: '0' }, 0]) {
      expect(compare('AgeSpanNormal', value).status).toBe('unknown')
    }
  })

  it('compares fully documented body ranges and preserves unknown or missing body fields as unknown', () => {
    const fields = getSettingMeta('Appearance_AF_Template', {}).rangeFields!
    const ranges = Object.fromEntries(Object.keys(fields).map(key => [key, [-100, 100]]))
    expect(compare('Appearance_AF_Template', ranges).status).toBe('default')
    expect(compare('Appearance_AF_Template', { ...ranges, Belly: [-50, 100] }).status).toBe('different')
    expect(compare('Appearance_AF_Template', { ...ranges, FutureBody: [-100, 100] }).status).toBe('unknown')
    expect(compare('Appearance_AF_Template', { Belly: [-100, 100] }).status).toBe('unknown')
  })

  it('ignores object property order but retains nested array order and requires complete known objects', () => {
    expect(compare('Pregnancy_OffspringGenderPercents', { F: 50, M: 50 }).status).toBe('default')
    expect(compare('Pregnancy_OffspringGenderPercents', { F: 49, M: 51 }).status).toBe('different')
    expect(compare('Pregnancy_OffspringGenderPercents', { F: 49, M: 51, Future: 0 }).status).toBe('unknown')
    const weights = { '1': [100], '2': [90, 10], '3': [89, 10, 1], '4': [75, 15, 7, 3], '5': [55, 25, 13, 5, 2], '6': [35, 30, 18, 11, 4, 2] }
    expect(compare('Pregnancy_PercentWeights', weights).status).toBe('default')
    expect(compare('Pregnancy_PercentWeights', { ...weights, '2': [10, 90] }).status).toBe('different')
    expect(compare('Pregnancy_PercentWeights', { ...weights, '7': [100] }).status).toBe('unknown')
    expect(compare('Marriage_RequiredTraitsList', []).status).toBe('default')
    expect(compare('Marriage_RequiredTraitsList', [['123', '456']]).status).toBe('different')
  })

  it('uses every exact freshly recreated snapshot value before older defaults and retains legacy reference fallback', () => {
    expect(Object.keys(snapshot)).toHaveLength(439)
    for (const [key, value] of Object.entries(snapshot)) {
      expect(compare(key, value), key).toMatchObject({ status: 'default', source: 'snapshot' })
    }
    // These supplied values differ from the older downloaded reference.
    expect(compare('Occult_CustomPregnancyAlienHybrid', '100,0,-1,-1,-1,-1').status).toBe('default')
    expect(compare('Pregnancy_AdoptionAges', 'B,I,TD,C,T').status).toBe('default')
    expect(compare('Occult_OccultTypeAgeMultiplier', {
      A: [100, 100, 100, 100, 100], FR: [100, 100, 135.72, 131, 214.5], MM: [100, 100, 100, 100, 335],
      V: [100, 100, 100, 100, 100], WT: [100, 100, 100, 100, 100], WW: [100, 100, 100, 100, 100],
    }).status).toBe('default')
    const conflictingReference = { ...getSettingMeta('Game_Time_Speed', 25), defaultValue: 30, defaultLabel: 'Old default' }
    expect(compareSettingDefault(conflictingReference, 25)).toMatchObject({ status: 'default', source: 'snapshot', label: '25' })
    expect(compare('Pregnancy_OffspringGender', 'F,M')).toMatchObject({ status: 'default', source: 'reference' })
    expect(compare('Pregnancy_OffspringGender', 'F')).toMatchObject({ status: 'different', source: 'reference' })
    expect(compare('Population_NumAdjustLot', 'BAR,GYM')).toMatchObject({ status: 'different', source: 'snapshot' })
  })
})
