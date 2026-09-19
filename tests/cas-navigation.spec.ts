import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import type { SettingsRecord } from '../src/lib/config'
import { expandVisibleAppearanceGroups } from './helpers/appearance-templates'

const sample = JSON.parse(readFileSync(new URL('../mc_settings.cfg', import.meta.url), 'utf8')) as SettingsRecord
// The user's all-selected trait fixture is independent of the production option map.
const suppliedTraitIds = "27419,460574,252085,16823,140740,257365,27918,27916,16826,273755,157978,273756,140742,384182,9322,204492,204493,341881,16830,140744,16832,443222,16850,341153,126088,433147,157979,16848,16836,16838,27176,234414,140739,16841,341152,27917,9332,16843,27915,9337,231699,427231,16844,501609,272336,320965,16845,424535,140746,140745,125437,273757,124879,131783,257367,9599,9602,362090,27914,311267,379635,230745,27913,16857,9604,433541,16858,16833,341150,29571,284113,203542,284112,9617,453551,368744,251970,320988,232692,27454,361564,199561,16824,273758,396064,140743,383203,16860,9620,272629,102336,273759,132589,132627,273760,140741,341151".split(',')
const suppliedPetTraitIds = '171613,171597,158771,323824,171612,158770,322830,158769,171606,158211,323821,322878,322834,158772,323822,158693,171610,158765,322836,158201,171609,159977,171608,171607,323823,171605,322882,171601,158202,171604,322880,159976,327817,164046,171602,159972,158766,171611,171600,158210,171599,158767,158768,171603,171598'.split(',')
let importSequence = 0

async function importConfig(page: Page, config: SettingsRecord = sample) {
  const name = `cas-navigation-${++importSequence}.cfg`
  await page.getByLabel('Import config file').setInputFiles({
    name,
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(config)),
  })
  await expect(page.getByText(name, { exact: true })).toBeVisible()
  await page.locator('[data-category="appearance"]').click()
}

async function visibleKeys(page: Page) {
  return page.locator('article[data-setting]:visible').evaluateAll(rows => rows.map(row => row.getAttribute('data-setting')!))
}

async function openMenu(page: Page, path: string) {
  await page.locator(`[data-menu-path="${path}"]`).click()
  await expandVisibleAppearanceGroups(page)
}

async function exportConfig(page: Page): Promise<SettingsRecord> {
  await page.getByRole('button', { name: /^Export\b/ }).click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download mc_settings.cfg', exact: true }).click()
  const path = await (await downloadPromise).path()
  expect(path).not.toBeNull()
  await expect(page.getByRole('dialog')).toBeHidden()
  return JSON.parse(readFileSync(path!, 'utf8')) as SettingsRecord
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Your game. Your settings.' })).toBeVisible()
})

test('Create-a-Sim menus retain every setting and narrow templates by gender and age', async ({ page }) => {
  await importConfig(page)
  await expandVisibleAppearanceGroups(page)
  const casKeys = Object.keys(sample).filter(key => /^(?:Appearance|CAS)_/.test(key))
  await expect(page.locator('article[data-setting]:visible')).toHaveCount(31)
  expect(new Set(await visibleKeys(page))).toEqual(new Set(casKeys))

  await openMenu(page, 'Define Appearance Template')
  await expect(page.locator('article[data-setting]:visible')).toHaveCount(8)
  const femaleKeys = ['TF', 'YAF', 'AF', 'EF'].map(age => `Appearance_${age}_Template`)
  const maleKeys = ['TM', 'YAM', 'AM', 'EM'].map(age => `Appearance_${age}_Template`)
  expect(await visibleKeys(page)).toEqual([...femaleKeys, ...maleKeys])
  await openMenu(page, 'Define Appearance Template/Female')
  expect(await visibleKeys(page)).toEqual(femaleKeys)
  await openMenu(page, 'Define Appearance Template/Female/Young Adult')
  expect(await visibleKeys(page)).toEqual(['Appearance_YAF_Template'])
  await openMenu(page, 'Define Appearance Template/Female/Teen')
  expect(await visibleKeys(page)).toEqual(['Appearance_TF_Template'])
  await openMenu(page, 'Define Appearance Template/Male/Teen')
  expect(await visibleKeys(page)).toEqual(['Appearance_TM_Template'])

  await openMenu(page, 'Fit/Fat limits')
  expect(await visibleKeys(page)).toEqual([
    'Appearance_FemaleFitLimits', 'Appearance_FemaleLeanLimits',
    'Appearance_MaleFitLimits', 'Appearance_MaleLeanLimits',
  ])
  for (const gender of ['Female', 'Male']) {
    await openMenu(page, `Fit/Fat limits/${gender}`)
    expect(await visibleKeys(page)).toEqual([`Appearance_${gender}FitLimits`, `Appearance_${gender}LeanLimits`])
  }

  await openMenu(page, 'Set Default Walkstyle')
  await expect(page.locator('article[data-setting]:visible')).toHaveCount(8)
  expect(await visibleKeys(page)).toEqual(['TM', 'YAM', 'AM', 'EM', 'TF', 'YAF', 'AF', 'EF'].map(profile => `Appearance_DefaultWalkstyle_${profile}`))
  const maleWalkstyle = page.locator('[data-setting="Appearance_DefaultWalkstyle_TM"]').getByRole('combobox')
  const femaleWalkstyle = page.locator('[data-setting="Appearance_DefaultWalkstyle_AF"]')
  await expect(maleWalkstyle).toHaveText('Default walkstyle')
  await maleWalkstyle.click()
  await page.getByRole('option', { name: 'Swagger', exact: true }).click()
  await femaleWalkstyle.getByRole('combobox').click()
  await page.getByRole('option', { name: 'Perky', exact: true }).click()
  expect(await exportConfig(page)).toEqual({ ...sample, Appearance_DefaultWalkstyle_TM: 'SW', Appearance_DefaultWalkstyle_AF: 'P' })
  await femaleWalkstyle.getByRole('button', { name: /^Undo / }).click()
  await openMenu(page, 'Set Default Walkstyle/Male/Teen')
  expect(await visibleKeys(page)).toEqual(['Appearance_DefaultWalkstyle_TM'])
  await expect(maleWalkstyle).toHaveText('Swagger')
  await maleWalkstyle.click()
  await page.getByRole('option', { name: 'Default walkstyle', exact: true }).click()
  await expect(maleWalkstyle).toHaveText('Default walkstyle')
  await openMenu(page, 'Exclude Traits')
  expect(new Set(await visibleKeys(page))).toEqual(new Set(['CAS_Trait_Blacklist', 'CAS_Pet_Trait_Blacklist']))
  await expect(page.locator('article[data-setting]:visible').getByRole('combobox')).toHaveCount(0)
  const petTraits = page.locator('[data-setting="CAS_Pet_Trait_Blacklist"]')
  const editPetTraits = petTraits.getByRole('button', { name: 'Edit traits for Exclude Pet Traits', exact: true })
  await expect(editPetTraits).toHaveAttribute('aria-expanded', 'false')
  await editPetTraits.click()
  await expect(petTraits.getByRole('checkbox')).toHaveCount(45)
  await expect(petTraits.getByRole('checkbox', { checked: true })).toHaveCount(0)
  const traits = page.locator('[data-setting="CAS_Trait_Blacklist"]')
  const editTraits = traits.getByRole('button', { name: 'Edit traits for Personality Traits', exact: true })
  await expect(editTraits).toHaveAttribute('aria-expanded', 'false')
  await editTraits.click()
  await expect(traits.getByRole('checkbox')).toHaveCount(97)
  await expect(traits.getByRole('checkbox', { checked: true })).toHaveCount(0)
  expect(await exportConfig(page)).toEqual(sample)
})

test('offspring variance preserves saved values and invalid drafts while its parent toggle and other inheritance settings stay independent', async ({ page }) => {
  const source = {
    ...sample,
    Appearance_UseParentAppearance: false,
    Appearance_ParentAppearanceVariance: 37,
    Appearance_UseParentSkinTones: false,
    Appearance_UseParentFacialDetails: false,
    CAS_BypassBlueBabies: false,
    Future_Offspring_Data: { raw: '0037', values: [null, false] },
  }
  await importConfig(page, source)
  await openMenu(page, 'Offspring')
  const group = page.locator('[data-appearance-offspring-group]')
  await expect(group.locator('article[data-setting]:visible')).toHaveCount(5)
  const variance = group.locator('[data-setting="Appearance_ParentAppearanceVariance"]')
  const precise = variance.getByRole('textbox', { name: 'Parent Values Variance Percent', exact: true })
  const slider = variance.getByRole('slider')
  const parent = group.locator('[data-setting="Appearance_UseParentAppearance"]').getByRole('switch')
  const skin = group.locator('[data-setting="Appearance_UseParentSkinTones"]').getByRole('switch')
  await expect(precise).toHaveValue('37')
  await expect(precise).toBeDisabled()
  await expect(slider).toBeDisabled()
  for (const key of ['Appearance_UseParentSkinTones', 'Appearance_UseParentFacialDetails', 'CAS_BypassBlueBabies']) {
    const toggle = group.locator(`[data-setting="${key}"]`).getByRole('switch')
    await expect(toggle).toBeEnabled()
    await toggle.check()
  }
  const independentEdits = {
    ...source, Appearance_UseParentSkinTones: true, Appearance_UseParentFacialDetails: true, CAS_BypassBlueBabies: true,
  }
  expect(await exportConfig(page)).toEqual(independentEdits)

  await parent.check()
  await expect(precise).toBeEnabled()
  await expect(slider).toHaveAttribute('aria-valuemin', '0')
  await expect(slider).toHaveAttribute('aria-valuemax', '100')
  await precise.fill('0')
  await expect(slider).toHaveAttribute('aria-valuenow', '0')
  await precise.fill('100')
  expect(await exportConfig(page)).toEqual({ ...independentEdits, Appearance_UseParentAppearance: true, Appearance_ParentAppearanceVariance: 100 })

  await precise.fill('101')
  await skin.uncheck()
  await parent.uncheck()
  await expect(precise).toBeDisabled()
  await expect(precise).toHaveValue('101')
  await expect(precise).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeDisabled()
  const search = page.getByRole('textbox', { name: 'Search settings' })
  await search.fill('Appearance_FemaleFitLimits')
  await expect(variance).toBeHidden()
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeDisabled()
  await search.fill('Appearance_ParentAppearanceVariance')
  await expect(precise).toHaveValue('101')
  await expect(precise).toHaveAttribute('aria-invalid', 'true')
  const enable = group.getByRole('button', { name: 'Turn on Use Parent Physical Attributes', exact: true })
  await expect(enable).toBeVisible()
  await variance.getByRole('button', { name: 'Undo Parent Values Variance Percent', exact: true }).click()
  await expect(precise).toHaveValue('37')
  await expect(precise).toBeDisabled()
  const remainingEdits = { ...independentEdits, Appearance_UseParentSkinTones: false }
  expect(await exportConfig(page)).toEqual(remainingEdits)

  await enable.click()
  await expect(precise).toBeEnabled()
  await expect(precise).toHaveValue('37')
  await precise.fill('-1')
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeDisabled()
  await variance.getByRole('button', { name: 'Undo Parent Values Variance Percent', exact: true }).click()
  expect(await exportConfig(page)).toEqual({ ...remainingEdits, Appearance_UseParentAppearance: true })
})

test('all supplied personality traits stay selected and preserve unknown raw IDs through search, edits and Undo', async ({ page }) => {
  const hugeId = '900719925474099312345678901234567890'
  const unknown = `, 00027419 ,MODDED_TRAIT,${hugeId},MODDED_TRAIT,`
  const source = {
    ...sample,
    CAS_Trait_Blacklist: `${suppliedTraitIds.join(',')}${unknown}`,
    CAS_Pet_Trait_Blacklist: '  FUTURE_PET  ',
    Future_Trait_Data: { raw: '0007', values: [null, false] },
  }
  await importConfig(page, source)
  await openMenu(page, 'Exclude Traits')
  const traits = page.locator('[data-setting="CAS_Trait_Blacklist"]')
  await traits.getByRole('button', { name: 'Edit traits for Personality Traits', exact: true }).click()
  await expect(traits.getByRole('checkbox')).toHaveCount(97)
  await expect(traits.getByRole('checkbox', { checked: true })).toHaveCount(97)
  await expect(traits.getByRole('checkbox', { name: /00027419|MODDED_TRAIT|9007199254740993/ })).toHaveCount(0)
  expect(await exportConfig(page)).toEqual(source)

  const search = traits.getByRole('searchbox', { name: 'Search traits for Personality Traits', exact: true })
  await search.fill('Wise')
  await expect(traits.getByRole('checkbox')).toHaveCount(1)
  await traits.getByRole('checkbox', { name: 'Personality Traits: Wise', exact: true }).uncheck()
  await traits.getByRole('button', { name: 'Close traits for Personality Traits', exact: true }).click()
  await traits.getByRole('button', { name: 'Edit traits for Personality Traits', exact: true }).click()
  await expect(search).toHaveValue('Wise')
  await expect(traits.getByRole('checkbox', { name: 'Personality Traits: Wise', exact: true })).not.toBeChecked()
  expect(await exportConfig(page)).toEqual({
    ...source, CAS_Trait_Blacklist: `${suppliedTraitIds.filter(id => id !== '341151').join(',')}${unknown}`,
  })
  await traits.getByRole('button', { name: 'Undo Personality Traits', exact: true }).click()
  expect(await exportConfig(page)).toEqual(source)

  const malformed = {
    CAS_Trait_Blacklist: { future: ['27419', null], code: '0007' },
    CAS_Pet_Trait_Blacklist: '  FUTURE_PET  ',
    Future_Trait_Data: { raw: '0007', values: [null, false] },
  }
  await importConfig(page, malformed)
  await openMenu(page, 'Exclude Traits')
  await expect(traits.getByRole('button', { name: 'Edit traits for Personality Traits', exact: true })).toHaveCount(0)
  await expect(traits.getByRole('button', { name: 'Edit details for Personality Traits', exact: true })).toBeVisible()
  await expect(traits.getByRole('checkbox')).toHaveCount(0)
  await expect(page.locator('article[data-setting]:visible')).toHaveCount(2)
  expect(await exportConfig(page)).toEqual(malformed)
})

test('pet traits distinguish species and preserve personality choices, unknown raw IDs and malformed imports', async ({ page }) => {
  const unknown = ', 00171610 ,MODDED_PET,900719925474099312345678901234567890,MODDED_PET,27419,'
  const source = {
    ...sample,
    CAS_Pet_Trait_Blacklist: `${suppliedPetTraitIds.join(',')}${unknown}`,
    CAS_Trait_Blacklist: ' 27419,341151,FUTURE_PERSONALITY ',
    Future_Pet_Data: { raw: '0007', values: [null, false] },
  }
  await importConfig(page, source)
  await openMenu(page, 'Exclude Traits')
  const pets = page.locator('[data-setting="CAS_Pet_Trait_Blacklist"]')
  await pets.getByRole('button', { name: 'Edit traits for Exclude Pet Traits', exact: true }).click()
  await expect(pets.getByRole('checkbox')).toHaveCount(45)
  await expect(pets.getByRole('checkbox', { checked: true })).toHaveCount(45)
  await expect(pets.getByRole('checkbox', { name: /00171610|MODDED_PET|9007199254740993/ })).toHaveCount(0)
  await expect(pets.getByRole('checkbox', { name: 'Exclude Pet Traits: Active', exact: true })).toHaveCount(0)
  expect(await exportConfig(page)).toEqual(source)

  const search = pets.getByRole('searchbox', { name: 'Search traits for Exclude Pet Traits', exact: true })
  for (const [species, count] of [['Cats', 17], ['Dogs', 17], ['Horses', 11]] as const) {
    await search.fill(species)
    await expect(pets.getByRole('checkbox')).toHaveCount(count)
    await expect(pets.getByRole('checkbox', { checked: true })).toHaveCount(count)
  }
  await search.fill('Friendly')
  await expect(pets.getByRole('checkbox')).toHaveCount(3)
  await pets.getByRole('checkbox', { name: 'Exclude Pet Traits: Friendly (Dogs)', exact: true }).uncheck()
  await expect(pets.getByRole('checkbox', { name: 'Exclude Pet Traits: Friendly (Cats)', exact: true })).toBeChecked()
  await expect(pets.getByRole('checkbox', { name: 'Exclude Pet Traits: Friendly (Horses)', exact: true })).toBeChecked()
  expect(await exportConfig(page)).toEqual({
    ...source, CAS_Pet_Trait_Blacklist: `${suppliedPetTraitIds.filter(id => id !== '171610').join(',')}${unknown}`,
  })

  await search.fill('Glutton')
  await expect(pets.getByRole('checkbox')).toHaveCount(2)
  await pets.getByRole('checkbox', { name: 'Exclude Pet Traits: Glutton (Cats)', exact: true }).uncheck()
  await expect(pets.getByRole('checkbox', { name: 'Exclude Pet Traits: Glutton (Dogs)', exact: true })).toBeChecked()
  await pets.getByRole('button', { name: 'Close traits for Exclude Pet Traits', exact: true }).click()
  await pets.getByRole('button', { name: 'Edit traits for Exclude Pet Traits', exact: true }).click()
  await expect(search).toHaveValue('Glutton')
  await expect(pets.getByRole('checkbox', { name: 'Exclude Pet Traits: Glutton (Cats)', exact: true })).not.toBeChecked()
  expect(await exportConfig(page)).toEqual({
    ...source, CAS_Pet_Trait_Blacklist: `${suppliedPetTraitIds.filter(id => !['171610', '159977'].includes(id)).join(',')}${unknown}`,
  })
  await pets.getByRole('button', { name: 'Undo Exclude Pet Traits', exact: true }).click()
  expect(await exportConfig(page)).toEqual(source)

  const malformed = {
    CAS_Pet_Trait_Blacklist: [171610, '0007', null],
    CAS_Trait_Blacklist: '27419',
    Future_Pet_Data: source.Future_Pet_Data,
  }
  await importConfig(page, malformed)
  await openMenu(page, 'Exclude Traits')
  await expect(pets.getByRole('button', { name: 'Edit traits for Exclude Pet Traits', exact: true })).toHaveCount(0)
  await expect(pets.getByRole('button', { name: 'Edit details for Exclude Pet Traits', exact: true })).toBeVisible()
  await expect(pets.getByRole('checkbox')).toHaveCount(0)
  await expect(page.locator('article[data-setting]:visible')).toHaveCount(2)
  expect(await exportConfig(page)).toEqual(malformed)
})

test('body edits survive CAS branch changes while invalid drafts and unfamiliar values are preserved', async ({ page }) => {
  const template = {
    ...Object.fromEntries(Object.entries(sample.Appearance_YAF_Template as SettingsRecord).reverse()),
    Future_Body: [-250, 500],
    Future_Details: { code: '0007', flags: [false, null] },
    Future_Empty: '',
  }
  const source = {
    ...sample,
    Appearance_YAF_Template: template,
    Appearance_DefaultWalkstyle_YAF: '00042',
  }
  await importConfig(page, source)
  await openMenu(page, 'Define Appearance Template/Female/Young Adult')
  const body = page.locator('[data-setting="Appearance_YAF_Template"]')
  const firstBodyFields = await body.getByRole('slider', { name: /: Minimum$/ }).evaluateAll(sliders => sliders
    .slice(0, 5)
    .map(slider => slider.getAttribute('aria-label')!.split(':').at(-2)!.trim().replace(/\s/g, '')))
  expect(firstBodyFields).toEqual(['Neck', 'Shoulders', 'ChestDepth', 'ChestLift', 'ChestSize'])
  await expect(body.getByRole('textbox', { name: /: Future Empty$/ })).toHaveValue('')
  await body.getByRole('slider', { name: /: Belly: Minimum$/ }).press('ArrowRight')
  await expect(body.getByRole('textbox', { name: /: Belly: Minimum$/ })).toHaveValue('-99')
  const maximum = body.getByRole('textbox', { name: /: Belly: Maximum$/, includeHidden: true })
  await maximum.fill('-150')
  await expect(maximum).toHaveAttribute('aria-invalid', 'true')
  await body.getByRole('textbox', { name: /: Butt: Minimum$/ }).fill('-90')
  await expect(maximum).toHaveValue('-150')
  await expect(maximum).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeDisabled()
  await page.getByRole('button', { name: 'Hide details for Female appearance templates', exact: true }).click()
  await expect(maximum).toBeAttached()
  await expect(maximum).toBeHidden()
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeDisabled()
  await expandVisibleAppearanceGroups(page)
  await expect(maximum).toHaveValue('-150')
  await expect(maximum).toHaveAttribute('aria-invalid', 'true')

  await openMenu(page, 'Define Appearance Template/Male/Teen')
  await page.locator('[data-setting="Appearance_TM_Template"]').getByRole('textbox', { name: /: Belly: Maximum$/ }).fill('80')
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeDisabled()

  await openMenu(page, 'Set Default Walkstyle/Female/Young Adult')
  const walkstyle = page.locator('[data-setting="Appearance_DefaultWalkstyle_YAF"]')
  await expect(walkstyle.getByRole('combobox')).toHaveText('00042 (from file)')
  await expect(walkstyle.getByRole('textbox')).toHaveCount(0)
  await expect(body).toBeAttached()
  await expect(body).toBeHidden()
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeDisabled()

  await openMenu(page, 'Define Appearance Template/Female/Young Adult')
  await expect(maximum).toBeVisible()
  await expect(maximum).toHaveValue('-150')
  await expect(maximum).toHaveAttribute('aria-invalid', 'true')
  await maximum.fill('90')
  await expect(body.getByRole('slider', { name: /Future/ })).toHaveCount(0)
  expect(await exportConfig(page)).toEqual({
    ...source,
    Appearance_YAF_Template: { ...template, Belly: [-99, 90], Butt: [-90, 100] },
    Appearance_TM_Template: { ...(sample.Appearance_TM_Template as SettingsRecord), Belly: [-100, 80] },
  })
})

test('partial appearance groups preserve independent profiles, raw JSON, and malformed fields without inserting missing keys', async ({ page }) => {
  const teenFemale = {
    Belly: [-100, 100], Neck: ['future', '001'], Future_Empty: '',
    Future_Info: { flag: true }, heading: '0001', 'raw-json': '0002',
  }
  const youngFemale = { Belly: [-100, 100], Future_Body: [-250, 500] }
  const teenMale = { Belly: [-100, 100], ChestLift: [1, 2] }
  const source = {
    Appearance_TF_Template: teenFemale,
    Appearance_YAF_Template: youngFemale,
    Appearance_TM_Template: teenMale,
    Appearance_AM_Template: 'future-template',
    Appearance_DefaultWalkstyle_TM: 73,
    Appearance_DefaultWalkstyle_TF: { future: ['SW', null], code: '0007' },
    Appearance_DefaultWalkstyle_EM: 'FUTURE_WALK',
    Future_Appearance_Data: { raw: '0007', values: [null, false] },
  }
  await importConfig(page, source)
  await openMenu(page, 'Define Appearance Template')
  await expect(page.locator('article[data-setting]:visible')).toHaveCount(4)
  for (const suffix of ['AF', 'EF', 'YAM', 'EM']) {
    await expect(page.locator(`[data-setting="Appearance_${suffix}_Template"]`)).toHaveCount(0)
  }
  const female = page.locator('[data-setting="Appearance_TF_Template"]')
  const young = page.locator('[data-setting="Appearance_YAF_Template"]')
  const male = page.locator('[data-setting="Appearance_TM_Template"]')
  await expect(female.getByRole('slider', { name: /: Neck:/ })).toHaveCount(0)
  await expect(female.getByRole('textbox', { name: /: Future Empty$/ })).toHaveValue('')
  await expect(male.getByRole('slider', { name: /: Chest Lift:/ })).toHaveCount(0)
  await expect(page.locator('[data-setting="Appearance_AM_Template"]').getByRole('textbox', { name: 'Adult male body ranges', exact: true }))
    .toHaveValue('future-template')
  expect(await exportConfig(page)).toEqual(source)

  await female.getByRole('slider', { name: /: Belly: Minimum$/ }).press('ArrowRight')
  await young.getByRole('textbox', { name: /: Belly: Maximum$/ }).fill('90')
  await male.getByRole('textbox', { name: /: Belly: Minimum$/ }).fill('-75')
  await female.getByRole('button', { name: 'Undo Teen female body ranges', exact: true }).click()
  await expect(female.getByRole('textbox', { name: /: Belly: Minimum$/ })).toHaveValue('-100')
  await expect(young.getByRole('textbox', { name: /: Belly: Maximum$/ })).toHaveValue('90')
  await expect(male.getByRole('textbox', { name: /: Belly: Minimum$/ })).toHaveValue('-75')
  await male.getByRole('button', { name: 'Edit JSON for Teen male body ranges', exact: true }).click()
  const raw = male.getByRole('textbox', { name: 'Teen male body ranges JSON', exact: true })
  expect(JSON.parse(await raw.inputValue())).toEqual({ ...teenMale, Belly: [-75, 100] })
  await raw.fill(JSON.stringify({ ...teenMale, Belly: [-75, 80] }))
  await male.getByRole('button', { name: 'Use fields for Teen male body ranges', exact: true }).click()
  await expect(male.getByRole('textbox', { name: /: Belly: Maximum$/ })).toHaveValue('80')
  const ids = await page.locator('[id]').evaluateAll(elements => elements.map(element => element.id))
  expect(new Set(ids).size).toBe(ids.length)
  await openMenu(page, 'Set Default Walkstyle')
  expect(await visibleKeys(page)).toEqual(['Appearance_DefaultWalkstyle_TM', 'Appearance_DefaultWalkstyle_EM', 'Appearance_DefaultWalkstyle_TF'])
  const numericWalkstyle = page.locator('[data-setting="Appearance_DefaultWalkstyle_TM"]')
  await expect(numericWalkstyle.getByRole('textbox')).toHaveValue('73')
  await expect(numericWalkstyle.getByRole('combobox')).toHaveCount(0)
  const structuredWalkstyle = page.locator('[data-setting="Appearance_DefaultWalkstyle_TF"]')
  await expect(structuredWalkstyle.getByRole('button', { name: /^Edit details for/ })).toBeVisible()
  await expect(structuredWalkstyle.getByRole('combobox')).toHaveCount(0)
  const unknownWalkstyle = page.locator('[data-setting="Appearance_DefaultWalkstyle_EM"]').getByRole('combobox')
  await expect(unknownWalkstyle).toHaveText('FUTURE_WALK (from file)')
  await unknownWalkstyle.click()
  await page.getByRole('option', { name: 'Goofy', exact: true }).click()
  expect(await exportConfig(page)).toEqual({
    ...source,
    Appearance_YAF_Template: { ...youngFemale, Belly: [-100, 90] },
    Appearance_TM_Template: { ...teenMale, Belly: [-75, 80] },
    Appearance_DefaultWalkstyle_EM: 'G',
  })
})
