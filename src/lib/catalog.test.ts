import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { getSettingMeta, presets } from './catalog'
import { notificationAudienceOptions } from './notification-audiences'
import { autosaveBlocks, autosaveKeys } from './autosave'
import { moneyBlocks, moneySettingKeys } from './money-settings'
import { personalityTraitOptions, petTraitOptions } from './trait-settings'

const sample = JSON.parse(readFileSync(new URL('../../mc_settings.cfg', import.meta.url), 'utf8')) as Record<string, unknown>

describe('setting control metadata', () => {
  it('treats the move-in age string as separate age choices', () => {
    const meta = getSettingMeta('Relationship_MoveinAges', sample.Relationship_MoveinAges)
    expect(meta.kind).toBe('multiselect')
    expect(meta.options).toEqual([
      { value: 'T', label: 'Teen' },
      { value: 'YA', label: 'Young adult' },
      { value: 'A', label: 'Adult' },
      { value: 'E', label: 'Elder' },
    ])
    expect(meta.options?.some((option) => option.value.includes(','))).toBe(false)
  })

  it.each([
    ['Dresser_RunOnAgeUp', ['I', 'TD', 'C', 'T', 'YA', 'A', 'E']],
    ['Dresser_MakeupAges', ['I', 'TD', 'C', 'T', 'YA', 'A', 'E']],
    ['Dresser_MultipleOutfitAges', ['I', 'TD', 'C', 'T', 'YA', 'A', 'E']],
    ['Occult_AbductionAges', ['C', 'T', 'YA', 'A', 'E']],
    ['Occult_AbductionPregnancyAges', ['T', 'YA', 'A', 'E']],
  ])('provides individual documented age codes for %s', (key, codes) => {
    const meta = getSettingMeta(key as string, sample[key as string])
    expect(meta.kind).toBe('multiselect')
    expect(meta.options?.map((option) => option.value)).toEqual(codes)
  })

  it('uses the reviewed infant adoption and High School lot codes', () => {
    expect(sample.Pregnancy_AdoptionAges).toContain('I')
    const ages = getSettingMeta('Pregnancy_AdoptionAges', sample.Pregnancy_AdoptionAges)
    expect(ages.kind).toBe('multiselect')
    expect(ages.options?.map((option) => option.value)).toEqual(['B', 'I', 'TD', 'C', 'T'])
    expect(ages.options?.slice(0, 2)).toEqual([{ value: 'B', label: 'Newborn' }, { value: 'I', label: 'Infant' }])
    const lots = getSettingMeta('Population_NumAdjustLot', sample.Population_NumAdjustLot)
    expect(lots.kind).toBe('multiselect')
    expect(lots.options).toContainEqual({ value: 'GYM', label: 'Gym', group: 'Base Game' })
    expect(lots.options).toContainEqual({ value: 'HSC', label: 'High School', group: 'High School Years' })
    expect(sample.Pregnancy_AdoptionAges).toBe('B,I,TD,C,T')
  })

  it.each([
    'Woohoo_RiskyWoohooPercents',
    'Occult_CustomPregnancyAlienHuman',
    'Pregnancy_CatAgePercentage',
    'Appearance_MaleFitLimits',
  ])('keeps ordered numeric or mixed CSV values as text: %s', (key) => {
    expect(typeof sample[key]).toBe('string')
    expect(getSettingMeta(key, sample[key]).kind).toBe('text')
  })

  it('represents pregnancy pause groups independently and keeps None as an empty selection', () => {
    const pause = getSettingMeta('Pregnancy_PauseSimsPregnancy', '')
    expect(pause).toMatchObject({ kind: 'multiselect', defaultValue: '', defaultLabel: 'None' })
    expect(pause.options?.map(option => option.value)).toEqual(['A', 'P', 'N'])
    expect(pause.emptySelectionLabel).toContain('No groups are paused')
    expect(pause.options?.some(option => option.value === '')).toBe(false)
    expect(getSettingMeta('Pregnancy_PauseSimsPregnancy', ['A', 'P']).kind).toBe('json')
  })

  it('distinguishes marriage approval dialogs from notification audience', () => {
    const approval = getSettingMeta('Marriage_ManualConfirmation', false)
    const notification = getSettingMeta('Show_MarriageNotificationType', '0')
    expect(approval.kind).toBe('boolean')
    expect(approval.impact?.level).toBe('interrupts')
    expect(notification.kind).toBe('select')
    expect(notification.impact?.level).toBe('gameplay')
    expect(notification.impact?.description).toContain('does not ask you to approve')
    expect(notification.options).toContainEqual({ value: '0', label: 'No notifications' })
    expect(notification.category).toBe('core')
    expect(notification.menuPath).toEqual([
      'Notifications/Console/Menu Settings', 'Notification Settings', 'MC Pregnancy Notifications',
    ])
  })

  it.each([
    [true, 'boolean'],
    [7, 'number'],
    ['FUTURE,CODE', 'text'],
    [{ future: true }, 'json'],
    [[1, 2], 'json'],
    [null, 'json'],
  ])('preserves unknown setting types for %j', (value, kind) => {
    const meta = getSettingMeta('Future_UnrecognizedSetting', value)
    expect(meta.documented).toBe(false)
    expect(meta.kind).toBe(kind)
    expect(meta.options).toBeUndefined()
  })

  it('does not coerce a recognized key when its imported type differs', () => {
    expect(getSettingMeta('Relationship_MoveinAges', ['YA', 'A']).kind).toBe('json')
    expect(getSettingMeta('Marriage_ManualConfirmation', 'future-value').kind).toBe('text')
    expect(getSettingMeta('Show_MarriageNotificationType', 0).kind).toBe('number')
  })
})

describe('confirmed Population lot and immortal choices', () => {
  it('exposes all 31 lot codes with their pack groups and independently confirmed expansion labels', () => {
    const lots = getSettingMeta('Population_NumAdjustLot', 'THR,HSC,FUTURE').options!
    expect(lots).toHaveLength(31)
    expect(new Set(lots.map(option => option.value))).toEqual(new Set(
      'BAR,WBY,GYM,LIB,LOU,PAR,POL,MUS,APT,ART,KAO,MYS,CAF,CLU,CHA,DAN,RES,SPA,BCH,SDY,MIX,ESP,CRM,CMM,RBM,DEB,MAK,MRK,GAR,THR,HSC'.split(','),
    ))
    for (const [value, label, group] of [
      ['MUS', 'Museum', 'Base Game'], ['APT', 'Apartments', 'City Living'], ['ART', 'Arts Center', 'City Living'],
      ['KAO', 'Karaoke Bar', 'City Living'], ['MYS', 'Myshuno Meadows', 'City Living'], ['BCH', 'Beach', 'Island Living'],
      ['CRM', 'College Cram', 'Discover University'], ['CMM', 'University Commons', 'Discover University'],
      ['RBM', 'Robot Building Meetup', 'Discover University'], ['ESP', 'eSports Tournament', 'Discover University'],
      ['MAK', 'Maker Space', 'Eco Lifestyle'], ['MRK', 'Marketplace', 'Eco Lifestyle'],
      ['THR', 'Thrift Store', 'High School Years'], ['HSC', 'High School', 'High School Years'],
    ]) expect(lots).toContainEqual({ value, label, group })
    expect(getSettingMeta('Population_NumAdjustLot', ['HSC']).options).toBeUndefined()
  })

  it('keeps all 12 immortal groups distinct, including similar pack abbreviations, without coercing other types', () => {
    const choices = getSettingMeta('Population_DisableImmortalSims', 'CTL,RNT,FUTURE').options!
    expect(choices.map(option => [option.value, option.label])).toEqual([
      ['CL', 'City Living'], ['CTL', 'Cottage Living'], ['RNT', 'For Rent'], ['GF', 'Get Famous'],
      ['GTW', 'Get To Work'], ['HOR', 'Horse Ranch'], ['JH', 'Jasmine Holiday'], ['BTU', 'Journey to Batuu'],
      ['SN', 'Seasons'], ['SV', 'Service Sims'], ['SE', 'Snowy Escape'], ['CLN', 'Tragic Clown'],
    ])
    expect(new Set(choices.map(option => option.value)).size).toBe(12)
    expect(getSettingMeta('Population_DisableImmortalSims', { CL: true }).options).toBeUndefined()
  })
})

describe('WooHoo pregnancy recipient choices', () => {
  it('provides independent CSV choices and the distinct defaults for each recipient setting', () => {
    const same = getSettingMeta('Woohoo_SameSexPregnantSim', 'T,I,FUTURE')
    const opposite = getSettingMeta('Woohoo_OppositeSexPregnantSim', 'F,M,T,I,FUTURE')
    expect(same).toMatchObject({ kind: 'multiselect', defaultValue: 'T', defaultLabel: 'Target' })
    expect(same.options).toEqual([{ value: 'T', label: 'Target' }, { value: 'I', label: 'Initiator' }])
    expect(opposite).toMatchObject({ kind: 'multiselect', defaultValue: 'F', defaultLabel: 'Female' })
    expect(opposite.options?.map(option => option.value)).toEqual(['F', 'M', 'T', 'I'])
    expect(opposite.options?.some(option => option.value.includes(','))).toBe(false)
    expect(getSettingMeta('Woohoo_SameSexPregnantSim', '').kind).toBe('multiselect')
    expect(getSettingMeta('Woohoo_OppositeSexPregnantSim', '').kind).toBe('multiselect')
  })

  it('keeps unexpected JSON types and future recipient keys in their original generic controls', () => {
    for (const key of ['Woohoo_SameSexPregnantSim', 'Woohoo_OppositeSexPregnantSim']) {
      for (const [value, kind] of [[0, 'number'], [false, 'boolean'], [['T', 'I'], 'json'], [{ future: 'F' }, 'json'], [null, 'json']] as const) {
        const meta = getSettingMeta(key, value)
        expect(meta.kind).toBe(kind)
        expect(meta.options).toBeUndefined()
      }
    }
    expect(getSettingMeta('Woohoo_FuturePregnantSim', 'T,I').kind).toBe('text')
  })
})

describe('pregnancy choices and ranges', () => {
  it('supports an imported legacy offspring-gender CSV independently of the current percentages object', () => {
    expect(Object.hasOwn(sample, 'Pregnancy_OffspringGender')).toBe(false)
    const meta = getSettingMeta('Pregnancy_OffspringGender', 'M,F,FUTURE')
    expect(meta).toMatchObject({
      kind: 'multiselect', defaultValue: 'M,F', defaultLabel: 'Male and Female',
      category: 'pregnancy', menuPath: ['Offspring'], documentationSource: 'official',
      options: [{ value: 'M', label: 'Male' }, { value: 'F', label: 'Female' }],
    })
    const current = { M: 40, F: 60, Future: '0007' }
    expect(getSettingMeta('Pregnancy_OffspringGenderPercents', current).kind).toBe('json')
    expect(current).toEqual({ M: 40, F: 60, Future: '0007' })
    expect(getSettingMeta('Pregnancy_OffspringGender', ['M', 'F']).kind).toBe('json')
    expect(getSettingMeta('Pregnancy_OffspringGender', 0).options).toBeUndefined()
  })

  it('offers relationship and male-pregnancy codes without changing unexpected imported types', () => {
    for (const [key, codes] of [
      ['Pregnancy_RelationshipOnly', ['N', 'M', 'S', 'W']],
      ['Pregnancy_AllowMalePregnancy', ['N', 'Y', 'S']],
    ] as const) {
      const meta = getSettingMeta(key, 'future:choice')
      expect(meta.kind).toBe('select')
      expect(meta.options?.map(option => option.value)).toEqual(codes)
      expect(getSettingMeta(key, 0)).toMatchObject({ kind: 'number' })
      expect(getSettingMeta(key, 0).options).toBeUndefined()
      expect(getSettingMeta(key, ['N'])).toMatchObject({ kind: 'json' })
    }
    const ages = getSettingMeta('Pregnancy_PetPartnerAge', 'A,FUTURE')
    expect(ages.kind).toBe('multiselect')
    expect(ages.options?.map(option => option.value)).toEqual(['A', 'E'])
    expect(getSettingMeta('Pregnancy_PetPartnerAge', { age: 'A' }).kind).toBe('json')
  })

  it('bounds pet litter counts and maximum-age days without rewriting numeric strings', () => {
    expect(getSettingMeta('Pregnancy_PetMaxOffspring', 3))
      .toMatchObject({ kind: 'number', min: 1, max: 6, step: 1, defaultValue: 3 })
    expect(getSettingMeta('Pregnancy_AgeUpDaysLimit', 0))
      .toMatchObject({ kind: 'number', min: 0, max: 10, step: 1, unit: 'days', defaultValue: 0 })
    for (const key of ['Pregnancy_PetMaxOffspring', 'Pregnancy_AgeUpDaysLimit']) {
      const text = getSettingMeta(key, '0003')
      expect(text.kind).toBe('text')
      expect(text.min).toBeUndefined()
      expect(text.max).toBeUndefined()
    }
  })

  it('keeps each confirmed enum meaning separate and only applies choices to strings', () => {
    const adoption = getSettingMeta('Pregnancy_NameInactiveAdoption', 'future:rename')
    const offspring = getSettingMeta('Pregnancy_NameInactiveOffspring', 'A')
    expect(adoption.kind).toBe('select')
    expect(adoption.options).toEqual(offspring.options)
    expect(adoption.options).toContainEqual({ value: 'R', label: 'Related to Active Household' })
    expect(getSettingMeta('Pregnancy_OffspringTraitsType', 'N').options)
      .toContainEqual({ value: 'N', label: 'Inherit no Traits' })
    expect(getSettingMeta('Marriage_ManualRenameSpouses', 'A').options)
      .toContainEqual({ value: 'A', label: 'None' })
    expect(getSettingMeta('Marriage_SameNeighborhood', 'P').options)
      .toContainEqual({ value: 'P', label: 'Prefer Partners In Same Neighborhood' })
    for (const key of ['Pregnancy_NameInactiveAdoption', 'Pregnancy_NameInactiveOffspring',
      'Pregnancy_OffspringTraitsType', 'Marriage_ManualRenameSpouses', 'Marriage_SameNeighborhood']) {
      expect(getSettingMeta(key, 0)).toMatchObject({ kind: 'number' })
      expect(getSettingMeta(key, 0).options).toBeUndefined()
      expect(getSettingMeta(key, { future: 'A' })).toMatchObject({ kind: 'json' })
    }
  })

  it('bounds numeric offspring counts and mood duration without coercing imported types', () => {
    expect(getSettingMeta('Pregnancy_MaxOffspring', 3))
      .toMatchObject({ kind: 'number', min: 1, max: 6, step: 1, defaultValue: 3 })
    const duration = getSettingMeta('Pregnancy_RandomMoodDuration', 1.5)
    expect(duration).toMatchObject({ kind: 'number', min: 1, max: 23, unit: 'Sim hours' })
    expect(duration.step).toBeUndefined()
    for (const key of ['Pregnancy_MaxOffspring', 'Pregnancy_RandomMoodDuration']) {
      const malformed = getSettingMeta(key, '0003')
      expect(malformed.kind).toBe('text')
      expect(malformed.min).toBeUndefined()
      expect(malformed.max).toBeUndefined()
    }
    const saved = { '2': [80, 20], future: { encoded: '0007' } }
    expect(getSettingMeta('Pregnancy_PercentWeights', saved).kind).toBe('json')
    expect(saved).toEqual({ '2': [80, 20], future: { encoded: '0007' } })
  })
})

describe('trait metadata', () => {
  it('provides independent personality and pet choices with fresh option objects for each control', () => {
    const meta = getSettingMeta('CAS_Trait_Blacklist', 'MODDED_TRAIT')
    expect(meta).toMatchObject({ kind: 'multiselect', label: 'Personality Traits', options: personalityTraitOptions })
    const pets = getSettingMeta('CAS_Pet_Trait_Blacklist', '27419,MODDED_PET')
    expect(pets).toMatchObject({ kind: 'multiselect', label: 'Exclude Pet Traits', options: petTraitOptions })
    expect(pets.options!.some(option => option.value === '27419')).toBe(false)
    expect(meta.options!.some(option => option.value === '171613')).toBe(false)
    meta.options![0]!.label = 'Changed in one control'
    pets.options![0]!.label = 'Changed in another control'
    expect(getSettingMeta('CAS_Trait_Blacklist', '').options![0]).toEqual({ value: '27419', label: 'Active' })
    expect(getSettingMeta('CAS_Pet_Trait_Blacklist', '').options![0]).toEqual({ value: '171613', label: 'Active (Dogs)' })
  })

  it('retains non-string lists as their original types in both catalogues', () => {
    for (const key of ['CAS_Trait_Blacklist', 'CAS_Pet_Trait_Blacklist']) {
      for (const [value, kind] of [
        [27419, 'number'], [false, 'boolean'], [[27419], 'json'],
        [{ trait: '27419' }, 'json'], [null, 'json'],
      ] as const) {
        const meta = getSettingMeta(key, value)
        expect(meta.kind).toBe(kind)
        expect(meta.options).toBeUndefined()
      }
    }
  })
})

describe('auto-relationship controls', () => {
  it('exposes confirmed numeric choices for known and unfamiliar saved numbers', () => {
    const moveout = getSettingMeta('Relationship_BreakupMoveoutSim', 1)
    expect(moveout.kind).toBe('select')
    expect(moveout.options).toEqual([
      { value: '0', label: 'None' }, { value: '1', label: 'Male Sim' },
      { value: '2', label: 'Female Sim' }, { value: '3', label: 'Random Sim' },
    ])
    const romance = getSettingMeta('Relationship_MoveinRomanceAmt', 50)
    expect(romance.kind).toBe('select')
    expect(romance.options).toEqual([
      { value: '25', label: 'Lovers' }, { value: '50', label: 'Sweethearts' },
      { value: '75', label: 'Soul Mates' }, { value: '100', label: 'True Lovers' },
    ])
    // Unknown imported numbers retain the same editor; the control adds their current value.
    expect(getSettingMeta(moveout.key, 999)).toMatchObject({ kind: 'select', options: moveout.options })
    expect(getSettingMeta(romance.key, 37)).toMatchObject({ kind: 'select', options: romance.options })
    expect(getSettingMeta('Relationship_FutureNumericChoice', 1).options).toBeUndefined()
  })

  it('does not interpret strings, booleans, or structured values as numeric choices', () => {
    for (const key of ['Relationship_BreakupMoveoutSim', 'Relationship_MoveinRomanceAmt']) {
      for (const [value, kind] of [
        [String(sample[key]), 'text'], ['', 'text'], [false, 'boolean'],
        [[1, 50], 'json'], [{ choice: 1 }, 'json'], [null, 'json'],
      ] as const) {
        const meta = getSettingMeta(key, value)
        expect(meta.kind).toBe(kind)
        expect(meta.options).toBeUndefined()
      }
    }
  })

  it('bounds only the four numeric chance fields and leaves imported text untouched', () => {
    for (const key of [
      'Relationship_BreakupPercent', 'Relationship_BreakupMarriagePercent',
      'Relationship_BreakupMoveoutOffspring', 'Relationship_MoveinPercent',
    ]) {
      expect(getSettingMeta(key, 0)).toMatchObject({ kind: 'number', min: 0, max: 100, step: 1, unit: '%' })
      const text = getSettingMeta(key, '0100')
      expect(text.kind).toBe('text')
      expect(text.min).toBeUndefined()
      expect(text.max).toBeUndefined()
      expect(text.unit).toBeUndefined()
    }
    expect(getSettingMeta('Relationship_BreakupPercentFuture', 0).max).toBeUndefined()
    expect(getSettingMeta('Relationship_MoveinRomanceAmt', 50).unit).toBeUndefined()
  })
})

describe('autosave metadata', () => {
  it('uses confirmed interval codes and returns independent choices for unfamiliar values', () => {
    const expected = [
      { value: 'PM', label: 'Pre-Midnight Alarm' },
      { value: 'RH', label: 'Real Hours' },
      { value: 'SD', label: 'Sim Day' },
      { value: 'SH', label: 'Sim Hour' },
    ]
    const meta = getSettingMeta('Autosave_IntervalType', 'FUTURE_INTERVAL')
    expect(meta.kind).toBe('select')
    expect(meta.options).toEqual(expected)
    meta.options![0]!.label = 'Changed by one control'
    meta.options!.pop()
    expect(getSettingMeta('Autosave_IntervalType', 'RH').options).toEqual(expected)
  })

  it('adds integer slider bounds only to numeric interval and save-count values', () => {
    for (const [key, max] of [['Autosave_IntervalAmount', 24], ['Autosave_MaxSaveNumber', 10]] as const) {
      expect(getSettingMeta(key, 1)).toMatchObject({ kind: 'number', min: 1, max, step: 1 })
      const importedText = getSettingMeta(key, '1')
      expect(importedText.kind).toBe('text')
      expect(importedText.min).toBeUndefined()
      expect(importedText.max).toBeUndefined()
      expect(importedText.step).toBeUndefined()
    }
    // The interval amount's unit depends on its sibling interval type.
    expect(getSettingMeta('Autosave_IntervalAmount', 1).unit).toBeUndefined()
  })

  it('retains non-string interval types without attaching dropdown choices', () => {
    for (const [value, kind] of [[4, 'number'], [false, 'boolean'], [['RH'], 'json'], [null, 'json']] as const) {
      const meta = getSettingMeta('Autosave_IntervalType', value)
      expect(meta.kind).toBe(kind)
      expect(meta.options).toBeUndefined()
    }
  })

  it('groups only the seven editable saved keys and leaves the internal value unconstrained', () => {
    const listedKeys = autosaveBlocks.flatMap(block => block.keys)
    expect(listedKeys).toHaveLength(7)
    expect(autosaveKeys.size).toBe(7)
    expect([...autosaveKeys].sort()).toEqual(Object.keys(sample)
      .filter(key => key.startsWith('Autosave_') && key !== 'Autosave_CurrentSaveNumber').sort())
    expect(autosaveKeys.has('Autosave_CurrentSaveNumber')).toBe(false)
    expect(autosaveKeys.has('Autosave_FutureSetting')).toBe(false)
    const internal = getSettingMeta('Autosave_CurrentSaveNumber', 47)
    expect(internal).toMatchObject({ internal: true, kind: 'number', documented: false })
    expect(internal.min).toBeUndefined()
    expect(internal.max).toBeUndefined()
  })

  it('keeps save names and hexadecimal slot strings free of invented constraints', () => {
    for (const key of ['Autosave_Name', 'Autosave_HexSlotNumber']) {
      const meta = getSettingMeta(key, sample[key])
      expect(meta.kind).toBe('text')
      expect(meta.options).toBeUndefined()
      expect(meta.min).toBeUndefined()
      expect(meta.max).toBeUndefined()
    }
  })
})

describe('money setting metadata', () => {
  it('adds confirmed percent bounds only to numeric bill adjustments', () => {
    for (const key of ['Bill_AmountPercentApartment', 'Bill_Amount_Percent']) {
      expect(getSettingMeta(key, 0)).toMatchObject({ kind: 'number', min: -100, max: 1000, step: 1, unit: '%' })
      for (const [value, kind] of [['0', 'text'], [false, 'boolean'], [[0], 'json'], [null, 'json']] as const) {
        const meta = getSettingMeta(key, value)
        expect(meta.kind).toBe(kind)
        expect(meta.min).toBeUndefined()
        expect(meta.max).toBeUndefined()
        expect(meta.unit).toBeUndefined()
      }
    }
    expect(getSettingMeta('Pay_Child_Support_Percent', 1))
      .toMatchObject({ min: 1, max: 1000, step: 1, unit: '%' })
  })

  it('offers only confirmed inheritance codes without inferring older reference labels', () => {
    const meta = getSettingMeta('Inherit_Sim_Type', 'UNREVIEWED_CODE')
    expect(meta).toMatchObject({ kind: 'select', defaultValue: '0', defaultLabel: 'None', documentationSource: 'in-game' })
    expect(meta.options).toEqual([
      { value: '0', label: 'None' }, { value: 'AL', label: 'All' },
      { value: 'A', label: 'Active Only' }, { value: 'N', label: 'NPC Only' },
    ])
    expect(meta.description).not.toContain('Played Only')
    meta.options![0]!.label = 'Changed by one control'
    expect(getSettingMeta('Inherit_Sim_Type', '0').options![0]).toEqual({ value: '0', label: 'None' })
    for (const [value, kind] of [[0, 'number'], [false, 'boolean'], [['AL'], 'json'], [null, 'json']] as const) {
      const imported = getSettingMeta('Inherit_Sim_Type', value)
      expect(imported.kind).toBe(kind)
      expect(imported.options).toBeUndefined()
    }
  })

  it('keeps all eight existing money keys distinct, without adding future or related keys', () => {
    expect(moneyBlocks.flatMap(block => block.keys)).toHaveLength(8)
    expect(moneySettingKeys.size).toBe(8)
    for (const key of moneySettingKeys) {
      expect(Object.hasOwn(sample, key)).toBe(true)
      expect(getSettingMeta(key, sample[key]).menuPath).toEqual(['Money Settings'])
    }
    expect(moneySettingKeys.has('Inherit_FutureSetting')).toBe(false)
    expect(moneySettingKeys.has('Career_Difficulty_Adjustment')).toBe(false)
    expect(getSettingMeta('Pay_Child_Support_Type', 'N').options?.map(option => option.value))
      .toEqual(['N', 'A', 'M', 'U'])
  })
})

describe('notification audience metadata', () => {
  it('documents the current death audience without aliasing the older official setting', () => {
    const current = getSettingMeta('Show_DeathNotificationType', '0')
    expect(current).toMatchObject({
      key: 'Show_DeathNotificationType', kind: 'select', documented: true,
      documentationSource: 'in-game', defaultValue: '0', defaultLabel: 'None',
    })
    expect(current.options?.map(option => option.value)).toEqual(['0', 'N', 'P', 'R', 'AF', 'AR', 'AL'])
    expect(current.options).toContainEqual({ value: 'AL', label: 'All' })

    const legacy = getSettingMeta('Show_DeathNotifications', 'AL')
    expect(legacy).toMatchObject({
      key: 'Show_DeathNotifications', kind: 'select', documented: true, documentationSource: 'official',
    })
    expect(legacy.sourceNote).toBeUndefined()
    expect(legacy.options).toContainEqual({ value: 'AL', label: 'All Sims outside the active household' })
    expect(getSettingMeta('Show_MarriageNotificationType', 'AL').options)
      .toContainEqual({ value: 'AL', label: 'All Sims outside the active household' })
  })

  it('retains unusual imported death-setting types without attaching string choices', () => {
    for (const [value, kind] of [
      [0, 'number'], [false, 'boolean'], [['AL'], 'json'], [{ audience: 'AL' }, 'json'], [null, 'json'],
    ] as const) {
      const meta = getSettingMeta('Show_DeathNotificationType', value)
      expect(meta.kind).toBe(kind)
      expect(meta.options).toBeUndefined()
    }
  })

  it('isolates returned audience options and per-setting label overrides', () => {
    const expected = notificationAudienceOptions()
    const changed = notificationAudienceOptions()
    changed[0]!.label = 'Changed by one control'
    changed.pop()
    const override = notificationAudienceOptions(['AL'], { AL: 'Only this audience' })
    expect(override).toEqual([{ value: 'AL', label: 'Only this audience' }])
    expect(notificationAudienceOptions()).toEqual(expected)

    const first = getSettingMeta('Show_DeathNotificationType', '0')
    first.options![0]!.label = 'Changed by another control'
    first.options!.pop()
    expect(getSettingMeta('Show_DeathNotificationType', '0').options).toEqual(expected)
  })

  it('keeps neighborhood-story and pet audiences within their own supported subsets', () => {
    for (const key of ['Show_NSDeathType', 'Show_NSPregnancyType']) {
      const options = getSettingMeta(key, '0').options
      expect(options?.map(option => option.value)).toEqual(['0', 'N', 'P', 'R', 'AL'])
      expect(options).toContainEqual({ value: 'AL', label: 'All' })
    }
    const pregnancy = getSettingMeta('Show_PetPregnancyNotificationType', '0').options
    const death = getSettingMeta('Show_PetDeathNotificationType', '0').options
    expect(pregnancy?.map(option => option.value)).toEqual(['0', 'N', 'P', 'R', 'AL'])
    expect(death?.map(option => option.value)).toEqual(['0', 'N', 'P', 'AL'])
    expect(pregnancy).toContainEqual({ value: 'P', label: 'Played / active pets' })
    expect(death).toContainEqual({ value: 'P', label: 'Played pets' })
    expect(death).toContainEqual({ value: 'AL', label: 'All pets outside the active household' })
  })
})

describe('Population reviewed controls', () => {
  it('applies the new dropdowns only to stored strings and preserves genuine empty choices', () => {
    for (const key of [
      'Population_MoveOutEldersType', 'Population_RandomLimitHouseholdType', 'Population_UseTagsOnImportSims',
      'Population_ImportSimNameChoice', 'Population_RandomChallengeLotType', 'Population_RandomChallengeTimeUnits',
    ]) {
      const unknown = getSettingMeta(key, 'FUTURE_VALUE')
      expect(unknown.kind).toBe('select')
      expect(unknown.options?.some(option => option.value === 'FUTURE_VALUE')).toBe(false)
      for (const [value, kind] of [[0, 'number'], [false, 'boolean'], [['A'], 'json'], [{ future: 'A' }, 'json'], [null, 'json']] as const) {
        const imported = getSettingMeta(key, value)
        expect(imported.kind).toBe(kind)
        expect(imported.options).toBeUndefined()
      }
    }
    for (const key of ['Population_MoveOutEldersType', 'Population_UseTagsOnImportSims']) {
      expect(getSettingMeta(key, '').options?.some(option => option.value === '')).toBe(true)
    }
    expect(getSettingMeta('Population_UseTagsOnImportSimsFuture', '').options).toBeUndefined()
  })

  it('bounds numeric housing limits while retaining numeric-string imports and the homeless sentinel', () => {
    for (const [key, min] of [['Population_MaximumHomeless', -1], ['Population_OpenHouses', 0]] as const) {
      expect(getSettingMeta(key, min)).toMatchObject({ kind: 'number', min, max: 100, step: 1 })
      const text = getSettingMeta(key, '001')
      expect(text.kind).toBe('text')
      expect(text.min).toBeUndefined()
      expect(text.max).toBeUndefined()
    }
    expect(getSettingMeta('Population_MaximumHomeless', -1).valueLabels?.['-1']).toBe('Unlimited')
  })
})

describe('Cleaner metadata', () => {
  it('offers household choices only for complete string pairs and keeps unfamiliar relationship suffixes intact', () => {
    const suffix = ' C,025,FUTURE_RULE, '
    const meta = getSettingMeta('Cleaner_CleanRelationships', `FUTURE_HOUSEHOLD,${suffix}`)
    expect(meta).toMatchObject({ kind: 'select', label: 'Households to Clean' })
    expect(meta.options?.map(option => option.value)).toEqual(['A', 'AO', 'N', 'P', 'PO'].map(code => `${code},${suffix}`))
    for (const value of ['N', 'N,', 'N, \t ', ',A']) {
      expect(getSettingMeta('Cleaner_CleanRelationships', value).kind).toBe('text')
      expect(getSettingMeta('Cleaner_CleanRelationships', value).options).toBeUndefined()
    }
    for (const key of ['Cleaner_CleanRelationships', 'Cleaner_CleanPetRelationships']) {
      for (const [value, kind] of [[25, 'number'], [false, 'boolean'], [['N', 'A'], 'json'], [{ future: 'A' }, 'json'], [null, 'json']] as const) {
        const imported = getSettingMeta(key, value)
        expect(imported.kind).toBe(kind)
        expect(imported.options).toBeUndefined()
      }
    }
  })

  it('bounds only numeric relationship counts and makes the exact item definition key read-only for every imported type', () => {
    expect(getSettingMeta('Cleaner_LeaveRelationshipCount', 0)).toMatchObject({ kind: 'number', min: 0, max: 100, step: 1 })
    const text = getSettingMeta('Cleaner_LeaveRelationshipCount', '007')
    expect(text.kind).toBe('text')
    expect(text.min).toBeUndefined()
    expect(text.max).toBeUndefined()
    for (const value of [{ future: [null, '0007'] }, ['future'], '0007', 7, false, null]) {
      expect(getSettingMeta('Cleaner_ItemCleaner', value).readOnlyReason).toEqual(expect.any(String))
      expect(getSettingMeta('Cleaner_ItemCleaner', value).readOnlyReason?.length).toBeGreaterThan(0)
    }
    expect(getSettingMeta('Cleaner_ItemCleanerFuture', {}).readOnlyReason).toBeUndefined()
  })
})

describe('Tuner archive metadata', () => {
  it('bounds numeric archive sizes without inventing a zero sentinel or coercing imported types', () => {
    const archive = getSettingMeta('Tuner_MaximumArchive', 50)
    expect(archive).toMatchObject({ kind: 'number', min: 0, max: 200, step: 1, defaultValue: 50 })
    expect(getSettingMeta('Tuner_MaximumArchive', 0).valueLabels).toBeUndefined()
    for (const [value, kind] of [['0050', 'text'], [false, 'boolean'], [[50], 'json'], [{ future: 50 }, 'json'], [null, 'json']] as const) {
      const meta = getSettingMeta('Tuner_MaximumArchive', value)
      expect(meta.kind).toBe(kind)
      expect(meta.min).toBeUndefined()
      expect(meta.max).toBeUndefined()
      expect(meta.step).toBeUndefined()
    }
    expect(getSettingMeta('Tuner_MaximumArchiveFuture', 50).max).toBeUndefined()
  })
})

describe('education metadata', () => {
  it('uses the confirmed integer ranges only for numeric homework and Secret Society values', () => {
    const ranges = [
      ['Career_Homework_Speed', -3, 50, undefined],
      ['Career_University_Homework_Speed', -3, 50, undefined],
      ['Career_Decay_Ratio_SecretSociety', 0, 500, '%'],
    ] as const
    for (const [key, min, max, unit] of ranges) {
      expect(getSettingMeta(key, 0)).toMatchObject({ kind: 'number', min, max, step: 1 })
      expect(getSettingMeta(key, max).unit).toBe(unit)
      for (const [value, kind] of [['0037', 'text'], [false, 'boolean'], [[37], 'json'], [{ future: 37 }, 'json'], [null, 'json']] as const) {
        const meta = getSettingMeta(key, value)
        expect(meta.kind).toBe(kind)
        expect(meta.min).toBeUndefined()
        expect(meta.max).toBeUndefined()
        expect(meta.step).toBeUndefined()
        expect(meta.unit).toBeUndefined()
      }
    }
    expect(getSettingMeta('Career_Homework_SpeedFuture', 0).max).toBeUndefined()
  })
})

describe('walkstyle metadata', () => {
  const keys = ['TM', 'YAM', 'AM', 'EM', 'TF', 'YAF', 'AF', 'EF'].map(profile => `Appearance_DefaultWalkstyle_${profile}`)
  const choices = [
    { value: '', label: 'Default walkstyle' },
    { value: 'B', label: 'Bouncy' }, { value: 'CR', label: 'Creepy' },
    { value: 'F', label: 'Feminine' }, { value: 'G', label: 'Goofy' },
    { value: 'P', label: 'Perky' }, { value: 'SL', label: 'Sluggish' },
    { value: 'SN', label: 'Snooty' }, { value: 'SW', label: 'Swagger' },
    { value: 'T', label: 'Tough' },
  ]

  it('shares the confirmed string choices, including an empty default, across only the eight walkstyle profiles', () => {
    for (const key of keys) {
      expect(getSettingMeta(key, '')).toMatchObject({ kind: 'select', options: choices })
      expect(getSettingMeta(key, '00042')).toMatchObject({ kind: 'select', options: choices })
    }
    const first = getSettingMeta(keys[0]!, '')
    first.options![0]!.label = 'Changed in one control'
    expect(getSettingMeta(keys[1]!, '').options).toEqual(choices)
    expect(getSettingMeta('Appearance_DefaultWalkstyle_Future', '')).toMatchObject({ kind: 'text' })
    expect(getSettingMeta('Appearance_DefaultWalkstyle_Future', '').options).toBeUndefined()
  })

  it('keeps non-string saved walkstyles in their original generic controls', () => {
    for (const key of keys) {
      for (const [value, kind] of [[0, 'number'], [false, 'boolean'], [['B'], 'json'], [{ future: 'SW' }, 'json'], [null, 'json']] as const) {
        const meta = getSettingMeta(key, value)
        expect(meta.kind).toBe(kind)
        expect(meta.options).toBeUndefined()
      }
    }
  })
})

describe('appearance template application metadata', () => {
  it('uses the documented trigger codes while preserving unknown strings and other imported types', () => {
    for (const value of ['', 'FUTURE_TRIGGER']) {
      const meta = getSettingMeta('Appearance_ApplyTemplate', value)
      expect(meta).toMatchObject({ kind: 'select', defaultValue: '', defaultLabel: 'Manual' })
      expect(meta.options).toEqual([
        { value: '', label: 'Manual' }, { value: 'A', label: 'On age-up' }, { value: 'Z', label: 'On zone-in' },
      ])
    }
    for (const [value, kind] of [[0, 'number'], [false, 'boolean'], [['A'], 'json'], [{ future: 'Z' }, 'json'], [null, 'json']] as const) {
      const meta = getSettingMeta('Appearance_ApplyTemplate', value)
      expect(meta.kind).toBe(kind)
      expect(meta.options).toBeUndefined()
    }
  })
})

describe('offspring appearance metadata', () => {
  it('bounds numeric parent variance without interpreting imported text or structured values as percentages', () => {
    const key = 'Appearance_ParentAppearanceVariance'
    for (const value of [0, 100]) {
      expect(getSettingMeta(key, value)).toMatchObject({ kind: 'number', min: 0, max: 100, step: 1, unit: '%' })
    }
    for (const [value, kind] of [
      ['0037', 'text'], [false, 'boolean'], [[37], 'json'], [{ future: 37 }, 'json'], [null, 'json'],
    ] as const) {
      const meta = getSettingMeta(key, value)
      expect(meta.kind).toBe(kind)
      expect(meta.min).toBeUndefined()
      expect(meta.max).toBeUndefined()
      expect(meta.step).toBeUndefined()
      expect(meta.unit).toBeUndefined()
    }
    expect(getSettingMeta(`${key}Future`, 37).max).toBeUndefined()
  })
})

describe('range slider metadata', () => {
  const bodyBounds = { min: -100, max: 100, step: 1 }
  const templateBounds = { ...bodyBounds, allowOutOfRange: true }

  it('orders body fields from top to bottom with the matching chest field for each gender', () => {
    const commonStart = ['Neck', 'Shoulders', 'ChestDepth']
    const commonEnd = ['ChestSize', 'UpperArms', 'LowerArms', 'Belly', 'Waist', 'Hips', 'Butt', 'UpperLegs', 'LowerLegs', 'Feet']
    expect(Object.keys(getSettingMeta('Appearance_AF_Template', {}).rangeFields!))
      .toEqual([...commonStart, 'ChestLift', ...commonEnd])
    expect(Object.keys(getSettingMeta('Appearance_AM_Template', {}).rangeFields!))
      .toEqual([...commonStart, 'ChestExpand', ...commonEnd])
  })

  it.each([
    'Appearance_FemaleFitLimits',
    'Appearance_FemaleLeanLimits',
    'Appearance_MaleFitLimits',
    'Appearance_MaleLeanLimits',
  ])('marks only the appearance limit domain without changing its CSV type: %s', (key) => {
    const meta = getSettingMeta(key, sample[key])
    expect(meta.kind).toBe('text')
    expect(meta.range).toEqual(bodyBounds)
    expect(meta.range?.allowOutOfRange).toBeUndefined()
    expect(meta.rangeFields).toBeUndefined()
    expect(typeof sample[key]).toBe('string')
  })

  it.each(['AF', 'AM', 'EF', 'EM', 'TF', 'TM', 'YAF', 'YAM'])('covers the exact imported %s template body fields', (ageGender) => {
    const key = `Appearance_${ageGender}_Template`
    const meta = getSettingMeta(key, sample[key])
    expect(meta.kind).toBe('json')
    expect(meta.range).toBeUndefined()
    expect(Object.keys(meta.rangeFields ?? {}).sort()).toEqual(Object.keys(sample[key] as object).sort())
    for (const bounds of Object.values(meta.rangeFields ?? {})) expect(bounds).toEqual(templateBounds)
    expect(meta.rangeFields?.Belly).toEqual(templateBounds)
    expect(meta.rangeFields?.[ageGender.endsWith('F') ? 'ChestLift' : 'ChestExpand']).toEqual(templateBounds)
    expect(meta.rangeFields?.[ageGender.endsWith('F') ? 'ChestExpand' : 'ChestLift']).toBeUndefined()
  })

  it('does not guess that unknown template children or newly named templates are ranges', () => {
    const meta = getSettingMeta('Appearance_AF_Template', { Belly: [-100, 100], FuturePart: [1, 2] })
    expect(meta.rangeFields?.Belly).toEqual(templateBounds)
    expect(meta.rangeFields?.FuturePart).toBeUndefined()
    expect(getSettingMeta('Appearance_Future_Template', { Belly: [-100, 100] }).rangeFields).toBeUndefined()
  })

  it.each([false, 5, [-100, 100], { lower: -100, upper: 100 }, null])('does not assign CSV sliders to unusual imported types: %j', (value) => {
    expect(getSettingMeta('Appearance_FemaleFitLimits', value).range).toBeUndefined()
  })

  it.each([false, 5, '-100,100', [-100, 100], null])('does not assign child ranges to a non-object template: %j', (value) => {
    expect(getSettingMeta('Appearance_AF_Template', value).rangeFields).toBeUndefined()
  })

  it.each([
    ['Pregnancy_CatAgePercentage', '20,20'],
    ['Woohoo_RiskyWoohooPercents', '0,0,0,0'],
    ['Cleaner_CleanRelationships', 'N,A'],
    ['Unknown_CsvPair', '-100,100'],
    ['Unknown_ArrayPair', [-100, 100]],
    ['Unknown_ObjectPair', { Belly: [-100, 100] }],
    ['Menu_Order', { first: [0, 1] }],
  ])('keeps unrelated positional data out of the range slider model: %s', (key, value) => {
    const meta = getSettingMeta(key as string, value)
    expect(meta.range).toBeUndefined()
    expect(meta.rangeFields).toBeUndefined()
  })

  it('returns independent bounds so a control cannot mutate later metadata', () => {
    const csv = getSettingMeta('Appearance_FemaleFitLimits', '-100,100')
    const template = getSettingMeta('Appearance_AF_Template', { Belly: [-100, 100] })
    csv.range!.min = 0
    template.rangeFields!.Belly!.max = 25
    expect(getSettingMeta('Appearance_FemaleFitLimits', '-100,100').range).toEqual(bodyBounds)
    expect(getSettingMeta('Appearance_AF_Template', {}).rangeFields?.Belly).toEqual(templateBounds)
  })

  it.each([
    ['Pregnancy_MaxHouseholdChildren', 1, 50],
    ['Pregnancy_PetMaxHouseholdChildren', 1, 50],
    ['Population_RandomChallengeMaxTime', 1, 100],
  ])('exposes explicitly documented numeric limits for %s', (key, min, max) => {
    const meta = getSettingMeta(key as string, sample[key as string])
    expect(meta).toMatchObject({ kind: 'number', min, max, step: 1 })
    expect(getSettingMeta(key as string, 'future-value').min).toBeUndefined()
  })
})

describe('Occult control metadata', () => {
  it('provides explicit disguise codes and numeric abduction hours while retaining other imported types', () => {
    const disguise = getSettingMeta('Occult_ForceAlienDisguiseType', '')
    expect(disguise.kind).toBe('select')
    expect(disguise.options?.map(option => option.value)).toEqual(['', 'H', 'A'])
    expect(disguise.options?.[0]?.label).toMatch(/^Default/)
    expect(getSettingMeta('Occult_ForceAlienDisguiseType', 'FUTURE').options).toEqual(disguise.options)
    for (const [value, kind] of [[0, 'number'], [false, 'boolean'], [['H'], 'json'], [{ future: 'A' }, 'json'], [null, 'json']] as const) {
      const imported = getSettingMeta('Occult_ForceAlienDisguiseType', value)
      expect(imported.kind).toBe(kind)
      expect(imported.options).toBeUndefined()
    }
    expect(getSettingMeta('Occult_TimeBetweenAbductions', 24)).toMatchObject({ kind: 'number', min: 1, max: 24, step: 1, unit: 'hours' })
    const text = getSettingMeta('Occult_TimeBetweenAbductions', '024')
    expect(text.kind).toBe('text')
    expect(text.min).toBeUndefined()
    expect(text.max).toBeUndefined()
  })

  it('applies the Human remainder only to verified pregnancy outcomes, keeping unrelated rolls independent', () => {
    const pregnancy = getSettingMeta('Occult_CustomPregnancyWitchAlien', sample.Occult_CustomPregnancyWitchAlien)
    expect(pregnancy.csvNumbers).toMatchObject({ indices: [4, 1, 0], totalMax: 100, remainderLabel: 'Human' })
    for (const key of ['Occult_AgePercentage', 'Occult_RiskyVampPercentages']) {
      const fields = getSettingMeta(key, '30,30,30,30').csvNumbers
      expect(fields?.labels).toHaveLength(4)
      expect(fields?.totalMax).toBeUndefined()
      expect(fields?.remainderLabel).toBeUndefined()
    }
  })
})

describe('abduction controls', () => {
  it('provides the confirmed pregnancy and pollinator gender dropdowns while preserving unexpected types', () => {
    const meta = getSettingMeta('Occult_AbductionPregnancyGenders', sample.Occult_AbductionPregnancyGenders)
    expect(meta).toMatchObject({ kind: 'select', label: 'Abduction Pregnancy Genders' })
    expect(meta.options).toEqual([{ value: 'M', label: 'Male' }, { value: 'F', label: 'Female' }])
    expect(getSettingMeta('Occult_AlienPollinatorGenders', 'F')).toMatchObject({ kind: 'select', options: meta.options })
    expect(getSettingMeta('Occult_AlienPollinatorGenders', ['M', 'F'])).toMatchObject({ kind: 'json' })
    expect(getSettingMeta('Occult_AbductionPregnancyGenders', ['M', 'F'])).toMatchObject({ kind: 'json' })
    expect(getSettingMeta('Occult_AbductionPregnancyGenders', ['M', 'F']).options).toBeUndefined()
  })

  it.each([
    ['Occult_AbductionStartHour', 'Abduction Start Time', 0, 23],
    ['Occult_AbductionDuration', 'Abduction Time Length', 1, 24],
  ] as const)('adds hour bounds only to numeric %s values while preserving the official label', (key, label, min, max) => {
    expect(getSettingMeta(key, sample[key])).toMatchObject({ kind: 'number', label, min, max, step: 1, unit: 'hours' })
    const changedType = getSettingMeta(key, String(sample[key]))
    expect(changedType.kind).toBe('text')
    expect(changedType.min).toBeUndefined()
    expect(changedType.max).toBeUndefined()
    expect(changedType.unit).toBeUndefined()
    expect(getSettingMeta(`${key}Future`, 10).unit).toBeUndefined()
  })

  it('describes four independent chances while preserving the CSV representation and a total above 100', () => {
    const value = sample.Occult_AgePercentage
    expect(value).toBe('30,30,30,30')
    const meta = getSettingMeta('Occult_AgePercentage', value)
    expect(meta).toMatchObject({ kind: 'text', label: 'Abduction Pregnancy Percent' })
    expect(meta.csvNumbers).toEqual({
      labels: ['Teen', 'Young Adult', 'Adult', 'Elder'], min: 0, max: 100, step: 1, unit: '%',
    })
    expect(meta.range).toBeUndefined()
    expect(meta.options).toBeUndefined()
    expect(value).toBe('30,30,30,30')
  })

  it('does not infer numeric CSV fields from unrelated settings or unexpected value types', () => {
    for (const key of ['Pregnancy_FutureAgePercentage', 'Occult_FuturePercentage', 'Unknown_Numbers']) {
      expect(getSettingMeta(key, '30,30,30,30').csvNumbers).toBeUndefined()
    }
    for (const value of [false, 30, [30, 30, 30, 30], { Teen: 30 }, null]) {
      expect(getSettingMeta('Occult_AgePercentage', value).csvNumbers).toBeUndefined()
    }
  })

  it('returns independent CSV field labels and bounds', () => {
    const first = getSettingMeta('Occult_AgePercentage', '30,30,30,30')
    first.csvNumbers!.labels[0] = 'Changed'
    first.csvNumbers!.max = 25
    expect(getSettingMeta('Occult_AgePercentage', '30,30,30,30').csvNumbers).toEqual({
      labels: ['Teen', 'Young Adult', 'Adult', 'Elder'], min: 0, max: 100, step: 1, unit: '%',
    })
  })
})

describe('dresser control metadata', () => {
  it('assigns four ordered independent facial-hair chances without coercing imported types', () => {
    const meta = getSettingMeta('Dresser_FacialHairPercent', '030, 40,50.0,60')
    expect(meta).toMatchObject({ kind: 'text', label: 'Facial Hair Percents' })
    expect(meta.csvNumbers).toEqual({
      labels: ['Teen', 'Young Adult', 'Adult', 'Elder'], min: 0, max: 100, step: 1, unit: '%',
    })
    expect(meta.options).toBeUndefined()
    meta.csvNumbers!.labels[0] = 'Changed'
    meta.csvNumbers!.max = 25
    expect(getSettingMeta('Dresser_FacialHairPercent', '').csvNumbers).toMatchObject({
      labels: ['Teen', 'Young Adult', 'Adult', 'Elder'], max: 100,
    })
    const differentType = getSettingMeta('Dresser_FacialHairPercent', [30, 40, 50, 60])
    expect(differentType.kind).toBe('json')
    expect(differentType.csvNumbers).toBeUndefined()
  })

  it('uses independent makeup gender choices and all 13 confirmed makeup outfit codes', () => {
    expect(getSettingMeta('Dresser_MultipleOutfitAges', 'I,TD,C,T,YA,A,E'))
      .toMatchObject({ kind: 'multiselect', defaultValue: 'C,T,YA,A,E' })
    const genders = getSettingMeta('Dresser_MakeupGenders', 'F,FUTURE')
    expect(genders.kind).toBe('multiselect')
    expect(genders.options).toEqual([{ value: 'M', label: 'Male' }, { value: 'F', label: 'Female' }])
    expect(getSettingMeta('Dresser_MakeupGenders', ['F']).options).toBeUndefined()
    const outfits = getSettingMeta('Dresser_MakeupOutfits', sample.Dresser_MakeupOutfits)
    expect(outfits.kind).toBe('multiselect')
    expect(outfits.options).toHaveLength(13)
    expect(new Set(outfits.options?.map(option => option.value)))
      .toEqual(new Set('E,AT,F,P,SL,SW,C,B,SI,SP,HW,CW,BT'.split(',')))
    expect(outfits.options).toContainEqual({ value: 'SL', label: 'Sleep' })
    expect(outfits.options).toContainEqual({ value: 'HW', label: 'Hot Weather' })
    expect(outfits.options).toContainEqual({ value: 'CW', label: 'Cold Weather' })
    for (const [value, label] of [['B', 'Bathing'], ['BT', 'Batuu'], ['C', 'Career'], ['SI', 'Situation'], ['SP', 'Special']]) {
      expect(outfits.options).toContainEqual({ value, label })
    }
    const situations = getSettingMeta('Dresser_ReplaceSituationOutfits', 'opaque::0007|future')
    expect(situations.kind).toBe('text')
    expect(situations.options).toBeUndefined()
  })

  it('provides an empty keep-career choice and standard outfits only for string values of the two confirmed keys', () => {
    for (const key of ['Dresser_ChangeOutfitAfterCareerF', 'Dresser_ChangeOutfitAfterCareerM']) {
      const meta = getSettingMeta(key, '')
      expect(meta.kind).toBe('select')
      expect(meta.options?.[0]).toEqual({ value: '', label: 'Keep career outfit' })
      expect(meta.options?.map(option => option.value)).toEqual(['', 'E', 'F', 'AT', 'SL', 'P', 'SW', 'HW', 'CW'])
      expect(getSettingMeta(key, 'FUTURE_OUTFIT').options).toEqual(meta.options)
      for (const [value, kind] of [[7, 'number'], [false, 'boolean'], [['E'], 'json'], [{ future: 'HW' }, 'json'], [null, 'json']] as const) {
        const imported = getSettingMeta(key, value)
        expect(imported.kind).toBe(kind)
        expect(imported.options).toBeUndefined()
      }
    }
    expect(getSettingMeta('Dresser_ChangeOutfitAfterCareerFuture', '').options).toBeUndefined()
  })

  it('bounds the reviewed numeric outfit fields without coercing imported numeric strings', () => {
    for (const [key, min, max, unit] of [
      ['Dresser_PercentUseCustomSkinTone', 0, 100, '%'],
      ['Dresser_PercentMultipleOutfits', 0, 100, '%'],
      ['Dresser_MaximumMultipleOutfits', 1, 5, undefined],
    ] as const) {
      expect(getSettingMeta(key, min)).toMatchObject({ kind: 'number', min, max, step: 1 })
      expect(getSettingMeta(key, max).unit).toBe(unit)
      const imported = getSettingMeta(key, '003')
      expect(imported.kind).toBe('text')
      expect(imported.min).toBeUndefined()
      expect(imported.max).toBeUndefined()
      expect(imported.step).toBeUndefined()
      expect(imported.unit).toBeUndefined()
    }
  })
})

describe('horse lifespan observations', () => {
  it.each([
    ['Short', [3.5, 25, 6.5]],
    ['Normal', [7, 50, 13]],
    ['Long', [28, 200, 52]],
  ] as const)('describes the existing %s key with age-specific EA defaults and bounds', (mode, defaults) => {
    const key = `AgeSpanHorse${mode}`
    expect(Object.hasOwn(sample, key)).toBe(true)
    const meta = getSettingMeta(key, sample[key])
    expect(meta).toMatchObject({
      label: `Horse lifespan — ${mode}`,
      kind: 'json',
      category: 'core',
      section: 'Horse lifespans',
      documented: true,
      documentationSource: 'in-game',
    })
    expect(meta.description).toContain(`game uses the ${mode} lifespan`)
    expect(meta.description).toContain('0 to use the EA default')
    expect(meta.sourceNote).toContain('in-game screenshot and reported defaults')
    expect(meta.sourceNote).toContain('version was not recorded')
    expect(Object.keys(meta.numericFields ?? {})).toEqual(['Child', 'Adult', 'Elder'])
    expect(Object.values(meta.numericFields ?? {})).toEqual(defaults.map((defaultValue) => ({
      min: 1, max: 1000, defaultValue, defaultSentinel: 0, unit: 'days', sliderStep: 1,
    })))
    expect(meta.step).toBeUndefined()
    expect(Object.values(meta.numericFields ?? {}).every((field) => !Object.hasOwn(field, 'step'))).toBe(true)
    expect(sample[key]).toEqual({ Adult: 0, Child: 0, Elder: 0 })
  })

  it('keeps observed metadata separate from official documentation and unknown settings', () => {
    const official = getSettingMeta('Autosave_Name', sample.Autosave_Name)
    expect(official.documented).toBe(true)
    expect(official.documentationSource).toBe('official')
    expect(official.sourceNote).toBeUndefined()
    expect(official.numericFields).toBeUndefined()
    const unknown = getSettingMeta('Future_UnrecognizedSetting', {})
    expect(unknown.documented).toBe(false)
    expect(unknown.documentationSource).toBeUndefined()
    expect(unknown.sourceNote).toBeUndefined()
    expect(unknown.numericFields).toBeUndefined()
  })

  it.each([
    'AgeSpanHorse', 'AgeSpanHorsesShort', 'AgeSpanHorse_Short',
    'AgeSpanHorseCustom', 'AgeSpanHorseNormal.Child',
  ])('does not invent metadata for a speculative alias: %s', (key) => {
    const meta = getSettingMeta(key, { Child: 0, Adult: 0, Elder: 0 })
    expect(meta.documented).toBe(false)
    expect(meta.numericFields).toBeUndefined()
    expect(meta.documentationSource).toBeUndefined()
  })

  it.each([false, 3.5, '0', [0, 0, 0], null])('does not attach child numeric controls to an unusual parent type: %j', (value) => {
    expect(getSettingMeta('AgeSpanHorseShort', value).numericFields).toBeUndefined()
  })

  it('does not infer new age fields or mutate imported durations', () => {
    const value = { Child: 3.5, Adult: 50.25, Elder: 0, FutureAge: 12 }
    const before = structuredClone(value)
    const meta = getSettingMeta('AgeSpanHorseShort', value)
    expect(meta.numericFields?.Child?.defaultValue).toBe(3.5)
    expect(meta.numericFields?.FutureAge).toBeUndefined()
    expect(value).toEqual(before)
  })

  it('clones every numeric field when returning metadata', () => {
    const first = getSettingMeta('AgeSpanHorseShort', {})
    first.numericFields!.Child!.defaultValue = 99
    first.numericFields!.Adult!.min = 0
    first.numericFields!.Elder!.max = 7
    const second = getSettingMeta('AgeSpanHorseShort', {})
    expect(second.numericFields?.Child?.defaultValue).toBe(3.5)
    expect(second.numericFields?.Adult?.min).toBe(1)
    expect(second.numericFields?.Elder?.max).toBe(1000)
  })
})

describe('presets are deliberate partial patches', () => {
  it('quiet play removes approval dialogs without changing relationship automation or the notification feed', () => {
    expect(presets.find((preset) => preset.id === 'quiet-play')?.changes).toEqual({
      Marriage_ManualConfirmation: false,
      Pregnancy_ManualConfirmation: false,
    })
  })

  it('quiet notifications changes only the wall-post master switch', () => {
    expect(presets.find((preset) => preset.id === 'quiet-notifications')?.changes).toEqual({
      Show_Notifications: false,
    })
  })

  it('manual review enables both approval dialogs', () => {
    expect(presets.find((preset) => preset.id === 'review-random-events')?.changes).toEqual({
      Marriage_ManualConfirmation: true,
      Pregnancy_ManualConfirmation: true,
    })
  })

  it('uses documented keys and retains the JSON types from the real sample', () => {
    for (const preset of presets) {
      for (const [key, value] of Object.entries(preset.changes)) {
        expect(Object.hasOwn(sample, key)).toBe(true)
        expect(typeof value).toBe(typeof sample[key])
        expect(getSettingMeta(key, value).documented).toBe(true)
      }
    }
  })
})
