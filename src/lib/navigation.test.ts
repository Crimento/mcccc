import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { getSettingMeta } from './catalog'
import { categories, compareSettingsForNavigation, getNavigation } from './navigation'
import { lifespanSpeciesForKey } from './lifespans'

const sample = JSON.parse(readFileSync(new URL('../../mc_settings.cfg', import.meta.url), 'utf8')) as Record<string, unknown>
const settings = Object.entries(sample).map(([key, value]) => getSettingMeta(key, value)).filter(setting => !setting.internal)

describe('menu navigation', () => {
  it('matches the requested module names and retains WooHoo and unknown imports', () => {
    expect(categories.map(category => category.label)).toEqual([
      'MCCC Settings', 'Create-a-Sim', 'Career', 'Cleaner', 'Clubs', 'Dresser',
      'Occult', 'Population', 'Pregnancy', 'Tuner', 'WooHoo', 'Other settings',
    ])
    expect(categories.find(category => category.id === 'core')?.menus).toEqual([
      {
        label: 'Age',
        children: [{
          label: 'Age Span Durations',
          children: [{ label: 'Humans' }, { label: 'Cats' }, { label: 'Dogs' }, { label: 'Horses' }],
        }],
      },
      { label: 'Auto-Save' },
      { label: 'Gameplay', children: [{ label: 'Death Settings' }, { label: 'Motive Decay' }, { label: 'Skill Settings' }] },
      { label: 'Money Settings' },
      {
        label: 'Notifications/Console/Menu Settings',
        children: [
          { label: 'Console Command Settings', children: [{ label: 'BuildBuy Settings' }] },
          { label: 'Logging Settings' },
          {
            label: 'Notification Settings',
            children: [
              { label: 'Aging/Death Notifications' },
              { label: 'MC Population Notifications' },
              { label: 'MC Pregnancy Notifications' },
              { label: 'Neighborhood Stories Settings' },
            ],
          },
          { label: 'Show Menu Settings' },
        ],
      },
      {
        label: 'Relationship Settings',
        children: [{
          label: 'Auto-Relationship Settings',
          children: [{ label: 'Breakup Settings' }, { label: 'Move-In Settings' }],
        }],
      },
      { label: 'More MCCC Settings' },
    ])
    expect(getSettingMeta('AgeSpanFuture', {})).toMatchObject({ category: 'other', menuPath: [], documented: false })
    expect(getSettingMeta('Pregnancy_Future', 1)).toMatchObject({ category: 'other', menuPath: [] })
  })

  it('accounts for every editable sample key exactly once, including core fallback settings', () => {
    const counts: Record<string, number> = {}
    for (const setting of settings) counts[setting.category] = (counts[setting.category] ?? 0) + 1
    expect(settings).toHaveLength(439)
    expect(new Set(settings.map(setting => setting.key)).size).toBe(439)
    expect(counts).toEqual({
      core: 114, appearance: 31, careers: 9, cleaner: 12, clubs: 5,
      dresser: 23, occult: 52, population: 45, pregnancy: 91, tuner: 22, woohoo: 35,
    })
    const core = settings.filter(setting => setting.category === 'core')
    expect(core.filter(setting => setting.menuPath[0] === 'Age')).toHaveLength(13)
    expect(core.filter(setting => setting.menuPath[0] === 'Auto-Save')).toHaveLength(7)
    expect(core.filter(setting => setting.menuPath[0] === 'Gameplay')).toHaveLength(28)
    expect(core.filter(setting => setting.menuPath[0] === 'Money Settings')).toHaveLength(8)
    expect(core.filter(setting => setting.menuPath[0] === 'Notifications/Console/Menu Settings')).toHaveLength(42)
    expect(core.filter(setting => setting.menuPath[0] === 'Relationship Settings')).toHaveLength(16)
    expect(core.filter(setting => setting.menuPath[0] === 'More MCCC Settings')).toHaveLength(0)
    const careers = settings.filter(setting => setting.category === 'careers')
    expect(careers.filter(setting => setting.menuPath[0] === 'School').sort(compareSettingsForNavigation).map(setting => setting.key)).toEqual([
      'Career_Homework_Speed', 'Career_ChildrenQuitSchool', 'Career_TeensQuitSchool',
    ])
    expect(careers.filter(setting => setting.menuPath[0] === 'University').sort(compareSettingsForNavigation).map(setting => setting.key)).toEqual([
      'Career_University_Difficulty_Adjustment', 'Career_University_Homework_Speed', 'Career_Decay_Ratio_SecretSociety',
    ])
    expect(careers.filter(setting => !setting.menuPath.length).sort(compareSettingsForNavigation).map(setting => setting.key)).toEqual([
      'Career_FillCareerInactiveOnly', 'Career_Difficulty_Adjustment',
    ])
  })

  it.each([
    ['Marriage_ManualConfirmation', 'pregnancy', ['Other Marriage']],
    ['Pregnancy_ManualConfirmation', 'pregnancy', ['Other Pregnancy']],
    ['Marriage_BypassDorms', 'pregnancy', ['Marriage Sim Selection']],
    ['Show_PetPregnancyNotificationType', 'pregnancy', ['Pet Pregnancy Settings']],
    ['Tuner_Child_Pay_Bills', 'core', ['Money Settings']],
    ['Relationship_MoveinHomeless', 'core', ['Relationship Settings', 'Auto-Relationship Settings', 'Move-In Settings']],
    ['Show_DeathNotificationType', 'core', ['Notifications/Console/Menu Settings', 'Notification Settings', 'Aging/Death Notifications']],
    ['Show_MarriageNotificationType', 'core', ['Notifications/Console/Menu Settings', 'Notification Settings', 'MC Pregnancy Notifications']],
    ['Pause_on_Zone', 'core', ['Gameplay']],
    ['Teleport_Sims_Overlap', 'core', ['Gameplay']],
    ['Sims_Are_Immortal', 'core', ['Gameplay', 'Death Settings']],
    ['Sim_Death_Only_On_Lot', 'core', ['Gameplay', 'Death Settings']],
    ['Pregnancy_BabyMotiveDecay', 'core', ['Gameplay', 'Motive Decay']],
    ['AgeSpanHorseShort', 'core', ['Age', 'Age Span Durations', 'Horses']],
    ['Career_LimitNS', 'careers', ['Neighborhood Stories Settings']],
  ])('routes %s by the observed menu rather than key prefixes or impact badges', (key, category, menuPath) => {
    expect(getSettingMeta(key as string, sample[key as string])).toMatchObject({ category, menuPath })
  })

  it('uses the first actual module path before package metadata and handles path spelling variants', () => {
    expect(getNavigation('future', {
      MenuPath: 'MCCC Settings > Notification Settings > MC Pregnancy > Other', Module: 'MC Pregnancy',
    })).toEqual({ category: 'core', menuPath: ['More MCCC Settings'] })
    expect(getNavigation('future', {
      MenuPath: '(MCCC > MC Population > Moving Settings', Module: 'MC Command Center',
    })).toEqual({ category: 'population', menuPath: [] })
    expect(getNavigation('future', {
      MenuPath: 'MCCC > MC Careers > Homework', Module: 'MC Command Center',
    })).toEqual({ category: 'careers', menuPath: [] })
    expect(getNavigation('future', {
      MenuPath: 'MCCC Settings->Auto-Save…->Confirmation', Module: 'MC Command Center',
    })).toEqual({ category: 'core', menuPath: ['Auto-Save'] })
    expect(getNavigation('future', {
      MenuPath: 'MCCC > Money Settings > Child Support', Module: 'MC Command Center',
    })).toEqual({ category: 'core', menuPath: ['More MCCC Settings'] })
  })

  it('orders distinct lifespan labels by species then Short, Normal, Long', () => {
    const ages = settings.filter(setting => setting.menuPath.includes('Age Span Durations'))
      .reverse().sort(compareSettingsForNavigation)
    expect(ages.map(setting => setting.key)).toEqual([
      'AgeSpanShort', 'AgeSpanNormal', 'AgeSpanLong',
      'AgeSpanCatShort', 'AgeSpanCatNormal', 'AgeSpanCatLong',
      'AgeSpanDogShort', 'AgeSpanDogNormal', 'AgeSpanDogLong',
      'AgeSpanHorseShort', 'AgeSpanHorseNormal', 'AgeSpanHorseLong',
    ])
    expect(ages.map(setting => setting.label)).toEqual(
      ['Human', 'Cat', 'Dog', 'Horse'].flatMap(species => ['Short', 'Normal', 'Long'].map(mode => `${species} lifespan — ${mode}`)),
    )
    expect(ages.map(setting => setting.menuPath)).toEqual(
      ['Humans', 'Cats', 'Dogs', 'Horses'].flatMap(species =>
        ['Short', 'Normal', 'Long'].map(() => ['Age', 'Age Span Durations', species])),
    )
    for (const setting of ages) {
      expect(lifespanSpeciesForKey(setting.key)?.label).toBe(setting.menuPath[2])
    }
    expect(lifespanSpeciesForKey('AgeSpanFuture')).toBeUndefined()
    expect(lifespanSpeciesForKey('AgeSpanHumanNormal')).toBeUndefined()
    expect(lifespanSpeciesForKey('AgeStopHuman')).toBeUndefined()
  })

  it('orders primary Sim motives before pets and uses supplied setting labels', () => {
    const motives = settings.filter(setting => setting.menuPath.includes('Motive Decay'))
      .sort(compareSettingsForNavigation)
    expect(motives.slice(0, 6).map(setting => setting.key)).toEqual([
      'MotiveDecay_Sims', 'Pregnancy_BabyMotiveDecay', 'MotiveDecay_Vampires',
      'MotiveDecay_Cats', 'MotiveDecay_Dogs', 'MotiveDecay_Horses',
    ])
    expect(motives.slice(0, 6).map(setting => setting.label)).toEqual(
      ['Sim', 'Baby', 'Vampire', 'Cat', 'Dog', 'Horse'].map(species => `${species} Motive Decay Percent`),
    )
    expect(getSettingMeta('Autosave_HexSlotNumber', '')).toMatchObject({ label: 'Slot Number', menuPath: ['Auto-Save'] })
    expect(getSettingMeta('Skill_Difficulty_Whitelist', '')).toMatchObject({ label: 'Skill Difficulty Include List', menuPath: ['Gameplay', 'Skill Settings'] })
  })

  it('returns independent menu paths for each setting', () => {
    getSettingMeta('AgeSpanNormal', {}).menuPath.push('Changed')
    expect(getSettingMeta('AgeSpanNormal', {}).menuPath).toEqual(['Age', 'Age Span Durations', 'Humans'])
  })
})

describe('Create-a-Sim navigation', () => {
  const appearance = settings.filter(setting => setting.category === 'appearance')

  it('places all 31 settings once in the requested hierarchy without an empty fallback branch', () => {
    const groups: Record<string, number> = {}
    for (const setting of appearance) {
      const group = setting.menuPath[0] ?? 'root'
      groups[group] = (groups[group] ?? 0) + 1
    }
    expect(appearance).toHaveLength(31)
    expect(new Set(appearance.map(setting => setting.key)).size).toBe(31)
    expect(groups).toEqual({
      root: 4,
      'Define Appearance Template': 8,
      'Exclude Traits': 2,
      'Fit/Fat limits': 4,
      Offspring: 5,
      'Set Default Walkstyle': 8,
    })
    expect(categories.find(category => category.id === 'appearance')?.menus?.map(menu => menu.label)).toEqual([
      'Define Appearance Template', 'Exclude Traits', 'Fit/Fat limits', 'Offspring', 'Set Default Walkstyle',
    ])
    expect(getSettingMeta('Full_Edit_CAS', true)).toMatchObject({
      category: 'core', menuPath: ['Notifications/Console/Menu Settings', 'Console Command Settings'],
    })
    expect(getSettingMeta('Appearance_Future_Template', {})).toMatchObject({ category: 'other', menuPath: [] })
  })

  it('orders the direct settings and offspring leaves as supplied', () => {
    expect(appearance.filter(setting => !setting.menuPath.length).sort(compareSettingsForNavigation).map(setting => setting.key)).toEqual([
      'Appearance_ApplyTemplate', 'CAS_AutoCelebrityWalkstyle', 'Appearance_AgeupChangeWalkstyle', 'Appearance_MonitorPhysique',
    ])
    expect(appearance.filter(setting => setting.menuPath[0] === 'Offspring').sort(compareSettingsForNavigation).map(setting => setting.key)).toEqual([
      'Appearance_UseParentAppearance', 'Appearance_ParentAppearanceVariance', 'Appearance_UseParentSkinTones',
      'Appearance_UseParentFacialDetails', 'CAS_BypassBlueBabies',
    ])
  })

  it('keeps all eight templates, including both Teen settings, in gender and age order', () => {
    const templates = appearance.filter(setting => setting.menuPath[0] === 'Define Appearance Template')
      .reverse().sort(compareSettingsForNavigation)
    expect(templates.map(setting => setting.key)).toEqual([
      'Appearance_TF_Template', 'Appearance_YAF_Template', 'Appearance_AF_Template', 'Appearance_EF_Template',
      'Appearance_TM_Template', 'Appearance_YAM_Template', 'Appearance_AM_Template', 'Appearance_EM_Template',
    ])
    expect(templates.map(setting => setting.menuPath)).toEqual(['Female', 'Male'].flatMap(gender =>
      ['Teen', 'Young Adult', 'Adult', 'Elder'].map(age => ['Define Appearance Template', gender, age]),
    ))
    expect(getSettingMeta('Appearance_AF_Template', sample.Appearance_AF_Template).label).toBe('Adult female body ranges')
    const nodes = categories.find(category => category.id === 'appearance')!.menus![0]!
    expect(nodes.children?.map(node => node.label)).toEqual(['Female', 'Male'])
    for (const gender of nodes.children!) {
      expect(gender.children?.map(node => node.label)).toEqual(['Teen', 'Young Adult', 'Adult', 'Elder'])
      expect(gender.children?.every(node => !node.children)).toBe(true)
    }
  })

  it('retains gender and age routes for all eight selectable default walkstyles', () => {
    const walkstyles = appearance.filter(setting => setting.menuPath[0] === 'Set Default Walkstyle')
      .sort(compareSettingsForNavigation)
    expect(walkstyles.map(setting => setting.key)).toEqual([
      'Appearance_DefaultWalkstyle_TF', 'Appearance_DefaultWalkstyle_YAF', 'Appearance_DefaultWalkstyle_AF', 'Appearance_DefaultWalkstyle_EF',
      'Appearance_DefaultWalkstyle_TM', 'Appearance_DefaultWalkstyle_YAM', 'Appearance_DefaultWalkstyle_AM', 'Appearance_DefaultWalkstyle_EM',
    ])
    expect(walkstyles.map(setting => setting.menuPath)).toEqual(['Female', 'Male'].flatMap(gender =>
      ['Teen', 'Young Adult', 'Adult', 'Elder'].map(age => ['Set Default Walkstyle', gender, age]),
    ))
    for (const setting of walkstyles) {
      expect(setting.kind).toBe('select')
    }
    const application = getSettingMeta('Appearance_ApplyTemplate', '')
    expect(application).toMatchObject({ kind: 'select', category: 'appearance', menuPath: [] })
    expect(application.options?.map(option => option.value)).toEqual(['', 'A', 'Z'])
  })

  it('keeps the supplied trait and fit/fat leaf labels in their groups', () => {
    const traitSettings = appearance.filter(setting => setting.menuPath[0] === 'Exclude Traits').sort(compareSettingsForNavigation)
    expect(traitSettings.map(setting => setting.label)).toEqual(['Personality Traits', 'Exclude Pet Traits'])
    const limitsMenu = categories.find(category => category.id === 'appearance')!.menus!.find(menu => menu.label === 'Fit/Fat limits')!
    expect(limitsMenu.children?.map(menu => menu.label)).toEqual(['Female', 'Male'])
    for (const gender of ['Female', 'Male']) {
      const bounds = appearance.filter(setting => setting.menuPath[0] === 'Fit/Fat limits' && setting.menuPath[1] === gender)
        .sort(compareSettingsForNavigation)
      expect(bounds.map(setting => setting.label)).toEqual(['Fit limits', 'Fat limits'])
      expect(bounds.map(setting => setting.key)).toEqual([`Appearance_${gender}FitLimits`, `Appearance_${gender}LeanLimits`])
      expect(bounds.map(setting => setting.menuPath)).toEqual([['Fit/Fat limits', gender], ['Fit/Fat limits', gender]])
      expect(bounds.every(setting => setting.kind === 'text' && setting.range?.min === -100 && setting.range.max === 100)).toBe(true)
    }
  })
})
