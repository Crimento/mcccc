import { readFileSync } from 'node:fs'
import { expect, test, type Locator, type Page } from '@playwright/test'
import type { SettingsRecord } from '../src/lib/config'

const sample = JSON.parse(readFileSync(new URL('../mc_settings.cfg', import.meta.url), 'utf8')) as SettingsRecord

async function importConfig(page: Page, config: SettingsRecord = sample, name = 'pregnancy.cfg') {
  await page.getByLabel('Import config file').setInputFiles({
    name, mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(config)),
  })
  await expect(page.getByText(name, { exact: true })).toBeVisible()
  await page.locator('[data-category="pregnancy"]').click()
}

async function choose(page: Page, row: Locator, label: string) {
  await row.getByRole('combobox').click()
  await page.getByRole('option', { name: label, exact: true }).click()
}

async function openMenu(page: Page, path: string, count: number) {
  await page.locator(`[data-menu-path="${path}"]`).click()
  await expect(page.locator('article[data-setting]:visible')).toHaveCount(count)
  return page.locator('article[data-setting]:visible').evaluateAll(rows => rows.map(row => row.getAttribute('data-setting')!))
}

async function findSetting(page: Page, key: string) {
  await page.getByRole('textbox', { name: 'Search settings' }).fill(key)
  const row = page.locator(`[data-setting="${key}"]`)
  await expect(row).toBeVisible()
  return row
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

test('Pregnancy menus retain all 91 settings and weekday choices preserve stored codes and blank defaults', async ({ page }) => {
  const source = { ...sample, Marriage_DaysToRun: 'FUTURE_DAY' }
  await importConfig(page, source)
  await page.getByRole('button', { name: 'Show all', exact: true }).click()
  const rows = page.locator('article[data-setting]:visible')
  await expect(rows).toHaveCount(91)
  const allKeys = await rows.evaluateAll(nodes => nodes.map(node => node.getAttribute('data-setting')!))
  const expectedKeys = Object.keys(sample).filter(key =>
    ((key.startsWith('Pregnancy_') || key.startsWith('Marriage_')) && key !== 'Pregnancy_BabyMotiveDecay')
    || key === 'Show_PetPregnancyNotificationType')
  expect(new Set(allKeys)).toEqual(new Set(expectedKeys))
  const menuGroups = page.locator('[data-pregnancy-settings-group]')
  const groupedRows = menuGroups.locator('article[data-setting]')
  const offspringRows = page.locator('[data-offspring-settings-group] article[data-setting]')
  await expect(menuGroups).toHaveCount(9)
  await expect(groupedRows).toHaveCount(82)
  await expect(offspringRows).toHaveCount(9)
  const groupedKeys = await groupedRows.evaluateAll(nodes => nodes.map(node => node.getAttribute('data-setting')!))
  const offspringKeys = await offspringRows.evaluateAll(nodes => nodes.map(node => node.getAttribute('data-setting')!))
  expect(new Set(groupedKeys).size).toBe(82)
  expect(new Set([...groupedKeys, ...offspringKeys]).size).toBe(91)
  expect(new Set([...groupedKeys, ...offspringKeys])).toEqual(new Set(allKeys))

  const impactNotes = [
    ['Marriage_FlagGenderPreferencePercent', 'Can set lasting gender-preference flags', 'Existing flags need to be cleared manually in MCCC.'],
    ['Pregnancy_FlagGenderPreferencePercent', 'Can set lasting gender-preference flags', 'Existing flags need to be cleared manually in MCCC.'],
    ['Marriage_ManualConfirmation', 'Asks before random marriages', 'marriage notification posts are controlled separately.'],
    ['Pregnancy_ManualConfirmation', 'Asks before random pregnancies', 'This does not control Neighborhood Stories or manually started pregnancies.'],
    ['Pregnancy_PauseOnPlayableLabor', 'Shows a labor dialog', 'so you can switch households for the birth.'],
    ['Marriage_ManualRenameSpouses', 'Can open a name selection dialog', 'active and Ancestral households are excluded.'],
    ['Pregnancy_NameInactiveAdoption', 'Can open adoption naming dialogs', 'outside the active household.'],
  ] as const
  for (const [key, title, detail] of impactNotes) {
    const row = menuGroups.locator(`[data-setting="${key}"]`)
    await expect(row).toHaveCount(1)
    await expect(row.getByText(title, { exact: true })).toHaveCount(1)
    await expect(row).toContainText(detail)
  }
  await expect(page.locator('[data-setting="Pregnancy_NameInactiveOffspring"]')
    .getByText('Can open baby naming dialogs', { exact: true })).toHaveCount(1)

  const branches = [
    ['Adoption Settings', 5], ['Marriage Sim Selection', 11], ['Neighborhood Stories Settings', 4],
    ['Offspring', 9], ['Other Marriage', 10], ['Other Pregnancy', 11], ['Partner Sim Selection', 10],
    ['Pet Pregnancy Settings', 9], ['Pregnant Sim Selection', 13], ['Spouse Sim Selection', 9],
  ] as const
  const covered: string[] = []
  for (const [path, count] of branches) {
    covered.push(...await openMenu(page, path, count))
    const visibleGroups = page.locator('[data-pregnancy-settings-group]:visible')
    await expect(visibleGroups).toHaveCount(path === 'Offspring' ? 0 : 1)
    if (path !== 'Offspring') await expect(visibleGroups.locator('article[data-setting]:visible')).toHaveCount(count)
  }
  expect(covered).toHaveLength(91)
  expect(new Set(covered)).toEqual(new Set(allKeys))
  expect(new Set(await openMenu(page, 'Spouse Sim Selection/Marriage Trait Limits', 2))).toEqual(new Set([
    'Marriage_RequiredTraitsList', 'Marriage_ConflictTraitsList',
  ]))
  await openMenu(page, 'Pet Pregnancy Settings', 9)
  expect(new Set(await openMenu(page, 'Pet Pregnancy Settings/Pregnancy Percentage', 3))).toEqual(new Set([
    'Pregnancy_CatAgePercentage', 'Pregnancy_DogAgePercentage', 'Pregnancy_HorseAgePercentage',
  ]))

  await page.locator('[data-category="core"]').click()
  await page.locator('[data-menu-path="Gameplay"]').click()
  await page.locator('[data-menu-path="Gameplay/Motive Decay"]').click()
  await expect(page.locator('[data-setting="Pregnancy_BabyMotiveDecay"]')).toBeVisible()
  await page.locator('[data-category="pregnancy"]').click()
  await openMenu(page, 'Pregnant Sim Selection', 13)
  const pregnancyDays = page.locator('[data-setting="Pregnancy_DaysToRun"]')
  await expect(pregnancyDays.getByRole('checkbox', { checked: true })).toHaveCount(0)
  await expect(pregnancyDays).toContainText('Using MCCC’s default schedule for the current aging speed.')
  expect(await exportConfig(page)).toEqual(source)

  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  for (const key of ['Pregnancy_DaysToRun', 'Marriage_DaysToRun']) {
    const row = await findSetting(page, key)
    const labels = await row.getByRole('checkbox').evaluateAll(choices =>
      choices.slice(0, 7).map(choice => choice.getAttribute('aria-label')!.split(': ').at(-1)))
    expect(labels).toEqual(weekdays)
    const chosen = key === 'Pregnancy_DaysToRun' ? ['Tuesday', 'Thursday'] : ['Saturday', 'Sunday']
    for (const label of chosen) await row.getByRole('checkbox', { name: new RegExp(`: ${label}$`) }).check()
  }
  await expect(page.locator('[data-setting="Marriage_DaysToRun"]').getByRole('checkbox', { name: /FUTURE_DAY \(from file\)/ })).toBeChecked()
  expect(await exportConfig(page)).toEqual({ ...source, Pregnancy_DaysToRun: 'TU,TH', Marriage_DaysToRun: 'FUTURE_DAY,SA,SU' })
})

test('adoption choices and Neighborhood Stories limits retain sentinel meanings and invalid drafts through filtering', async ({ page }) => {
  const source = {
    ...sample,
    Pregnancy_AdoptionAges: 'I,FUTURE_AGE',
    Pregnancy_PauseSimsPregnancy: 'future:pause:0007',
    Pregnancy_OffspringTraitsType: 'future:traits:0003',
    Pregnancy_NameInactiveAdoption: 'future:rename:0009',
  }
  await importConfig(page, source)
  await openMenu(page, 'Adoption Settings', 5)
  const ages = page.locator('[data-setting="Pregnancy_AdoptionAges"]')
  await expect(ages.getByRole('checkbox', { name: /: Infant$/ })).toBeChecked()
  await expect(ages.getByRole('checkbox', { name: /: Newborn$/ })).not.toBeChecked()
  await ages.getByRole('checkbox', { name: /: Newborn$/ }).check()
  await expect(ages.getByRole('checkbox', { name: /FUTURE_AGE \(from file\)/ })).toBeChecked()
  const percent = page.locator('[data-setting="Pregnancy_AdoptionPercentMale"]')
  await expect(percent.getByRole('slider')).toHaveAttribute('aria-valuemin', '0')
  await expect(percent.getByRole('slider')).toHaveAttribute('aria-valuemax', '100')
  await percent.getByRole('textbox').fill('62.5')

  await openMenu(page, 'Neighborhood Stories Settings', 4)
  const child = page.locator('[data-setting="Pregnancy_NSAdoptChildLimit"]')
  const pet = page.locator('[data-setting="Pregnancy_NSAdoptPetLimit"]')
  for (const row of [child, pet]) {
    await expect(row.getByRole('slider')).toHaveAttribute('aria-valuemin', '-1')
    await expect(row.getByRole('slider')).toHaveAttribute('aria-valuemax', '7')
    await expect(row.getByText('Neighborhood Stories default (-1)', { exact: true })).toBeVisible()
  }
  await child.getByRole('textbox').fill('7')
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeEnabled()
  await child.getByRole('textbox').fill('8')
  await pet.getByRole('textbox').fill('0')
  await expect(pet.getByText('No adoptions (0)', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeDisabled()

  await findSetting(page, 'Pregnancy_AdoptionAges')
  await expect(child).toBeAttached()
  await expect(child).toBeHidden()
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeDisabled()
  await findSetting(page, 'Pregnancy_NSAdoptChildLimit')
  await expect(child.getByRole('textbox')).toHaveValue('8')
  await expect(child.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  await child.getByRole('button', { name: /^Undo / }).click()
  await expect(child.getByRole('textbox')).toHaveValue('-1')
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeEnabled()

  const rename = await findSetting(page, 'Pregnancy_NameInactiveAdoption')
  await expect(rename.getByRole('combobox')).toContainText('future:rename:0009 (from file)')
  await choose(page, rename, 'Related to Active Household')
  const traits = await findSetting(page, 'Pregnancy_OffspringTraitsType')
  await expect(traits.getByRole('combobox')).toContainText('future:traits:0003 (from file)')
  await choose(page, traits, 'Inherit Maximum Number')
  const spouse = await findSetting(page, 'Marriage_ManualRenameSpouses')
  await choose(page, spouse, 'Played households')
  const neighborhood = await findSetting(page, 'Marriage_SameNeighborhood')
  await choose(page, neighborhood, 'Prefer Partners In Same Neighborhood')
  const pause = await findSetting(page, 'Pregnancy_PauseSimsPregnancy')
  await pause.getByRole('checkbox', { name: /: Active Sims$/ }).check()
  await pause.getByRole('checkbox', { name: /: NPC Sims$/ }).check()
  await expect(pause.getByRole('checkbox', { name: /: Played Sims$/ })).not.toBeChecked()
  await expect(pause.getByRole('checkbox', { name: /future:pause:0007 \(from file\)/ })).toBeChecked()
  expect(await exportConfig(page)).toEqual({
    ...source, Pregnancy_AdoptionAges: 'I,FUTURE_AGE,B', Pregnancy_AdoptionPercentMale: 62.5, Pregnancy_NSAdoptPetLimit: 0,
    Pregnancy_NameInactiveAdoption: 'R', Pregnancy_OffspringTraitsType: 'F', Marriage_ManualRenameSpouses: 'P',
    Marriage_SameNeighborhood: 'P', Pregnancy_PauseSimsPregnancy: 'future:pause:0007,A,N',
  })
})

test('independent human and pet pregnancy percentages preserve other CSV tokens, malformed values and nested offspring data', async ({ page }) => {
  const source = {
    ...sample,
    Marriage_AgePercentage: '020, 20,20.0,20',
    Pregnancy_AgePercentage: '030, 30,30.0,30',
    Pregnancy_CatAgePercentage: '020, 20',
    Pregnancy_DogAgePercentage: '010,20,FUTURE',
    Pregnancy_HorseAgePercentage: ' 005,20.0',
    Pregnancy_OffspringGenderPercents: {
      ...(sample.Pregnancy_OffspringGenderPercents as SettingsRecord),
      Future: { numericString: '0007', nested: [true, null, 'A,B'] },
    },
    Future_PregnancyCsv: '10,20,30,40',
  }
  await importConfig(page, source)
  expect(await exportConfig(page)).toEqual(source)
  const marriage = await findSetting(page, 'Marriage_AgePercentage')
  await expect(marriage.getByRole('slider')).toHaveCount(4)
  await marriage.getByRole('slider', { name: /: Young Adult$/ }).press('ArrowRight')
  await expect(marriage.getByRole('textbox', { name: /: Young Adult$/ })).toHaveValue('21')

  const pregnancy = await findSetting(page, 'Pregnancy_AgePercentage')
  await expect(pregnancy.getByRole('slider')).toHaveCount(4)
  const teen = pregnancy.getByRole('textbox', { name: /: Teen$/ })
  await teen.fill('101')
  await pregnancy.getByRole('textbox', { name: /: Adult$/ }).fill('70.5')
  await expect(teen).toHaveValue('101')
  await expect(teen).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeDisabled()

  await openMenu(page, 'Pet Pregnancy Settings', 9)
  await openMenu(page, 'Pet Pregnancy Settings/Pregnancy Percentage', 3)
  const cats = page.locator('[data-setting="Pregnancy_CatAgePercentage"]')
  const horses = page.locator('[data-setting="Pregnancy_HorseAgePercentage"]')
  for (const row of [cats, horses]) {
    await expect(row.getByRole('slider')).toHaveCount(2)
    await expect(row.getByRole('slider', { name: /: Adult$/ })).toBeVisible()
    await expect(row.getByRole('slider', { name: /: Elder$/ })).toBeVisible()
  }
  await cats.getByRole('textbox', { name: /: Elder$/ }).fill('75.5')
  await horses.getByRole('textbox', { name: /: Adult$/ }).fill('100')
  const dogs = page.locator('[data-setting="Pregnancy_DogAgePercentage"]')
  await expect(dogs.getByRole('slider')).toHaveCount(0)
  await expect(dogs.getByRole('textbox')).toHaveValue(source.Pregnancy_DogAgePercentage)
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeDisabled()

  await findSetting(page, 'Pregnancy_AgePercentage')
  await expect(teen).toHaveValue('101')
  await teen.fill('100')
  // Independent rolls can exceed a combined 100; sibling token formatting is untouched.
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeEnabled()
  const unknown = await findSetting(page, 'Future_PregnancyCsv')
  await expect(unknown.getByRole('slider')).toHaveCount(0)
  await expect(unknown.getByRole('textbox')).toHaveValue(source.Future_PregnancyCsv)
  expect(await exportConfig(page)).toEqual({
    ...source,
    Marriage_AgePercentage: '020,21,20.0,20',
    Pregnancy_AgePercentage: '100, 30,70.5,30',
    Pregnancy_CatAgePercentage: '020,75.5',
    Pregnancy_HorseAgePercentage: '100,20.0',
  })
})

test('linked offspring distributions preserve other arrays and pending drafts across maximum changes and Undo', async ({ page }) => {
  const source = {
    ...sample,
    Pregnancy_MaxOffspring: 2,
    Pregnancy_PetMaxOffspring: 6,
    Pregnancy_OffspringGenderPercents: { F: 50, Future: { code: '0007', values: [null, true] }, M: 50 },
    Pregnancy_PercentWeights: {
      ...(sample.Pregnancy_PercentWeights as SettingsRecord),
      '7': [12, 13, 14, 15, 16, 17, 13],
      Future: { numericString: '0003', payload: ['keep', false] },
    },
  }
  await importConfig(page, source)
  await openMenu(page, 'Offspring', 9)
  const weights = page.locator('[data-setting="Pregnancy_PercentWeights"]')
  const two = weights.locator('[data-offspring-count="2"]')
  const three = weights.locator('[data-offspring-count="3"]')
  await expect(weights.getByRole('slider')).toHaveCount(21)
  await expect(weights.locator('[data-offspring-count="1"]').getByRole('textbox')).toHaveAttribute('readonly', '')
  await expect(two).toContainText('Human maximum')
  await expect(weights.locator('[data-offspring-count="6"]')).toContainText('Pet maximum')
  expect(await exportConfig(page)).toEqual(source)

  const genders = page.locator('[data-setting="Pregnancy_OffspringGenderPercents"]')
  await expect(genders.getByRole('slider')).toHaveCount(2)
  await genders.getByRole('slider', { name: /: Male$/ }).press('ArrowRight')
  await expect(genders.getByRole('textbox', { name: /: Male$/ })).toHaveValue('51')
  await expect(genders.getByRole('textbox', { name: /: Female$/ })).toHaveValue('49')
  await genders.getByRole('textbox', { name: /: Female$/ }).fill('33.3')
  await expect(genders.getByRole('textbox', { name: /: Male$/ })).toHaveValue('66.7')
  await two.getByRole('textbox', { name: /: 1 baby$/ }).fill('80')
  await expect(two.getByRole('textbox', { name: /: 2 babies$/ })).toHaveValue('20')
  const editedGenders = { ...source.Pregnancy_OffspringGenderPercents, M: 66.7, F: 33.3 }
  expect(await exportConfig(page)).toEqual({
    ...source, Pregnancy_OffspringGenderPercents: editedGenders,
    Pregnancy_PercentWeights: { ...source.Pregnancy_PercentWeights, '2': [80, 20] },
  })

  const first = two.getByRole('textbox', { name: /: 1 baby$/ })
  await first.fill('101')
  await two.getByRole('textbox', { name: /: 2 babies$/ }).fill('30')
  await three.getByRole('textbox', { name: /: 3 babies$/ }).fill('5')
  await expect(first).toHaveValue('101')
  await expect(first).toHaveAttribute('aria-invalid', 'true')
  const maximum = page.locator('[data-setting="Pregnancy_MaxOffspring"]')
  await expect(maximum.getByRole('slider')).toHaveAttribute('aria-valuemin', '1')
  await expect(maximum.getByRole('slider')).toHaveAttribute('aria-valuemax', '6')
  await maximum.getByRole('textbox').fill('6')
  await expect(two).toBeVisible()
  await expect(weights.locator('[data-offspring-count="6"]')).toContainText('Human maximum')
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeDisabled()

  await page.setViewportSize({ width: 390, height: 844 })
  await findSetting(page, 'Pregnancy_NameInactiveOffspring')
  await expect(weights).toBeHidden()
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeDisabled()
  await findSetting(page, 'Pregnancy_PercentWeights')
  await expect(first).toHaveValue('101')
  await weights.getByRole('button', { name: 'Undo Offspring Percents', exact: true }).click()
  await expect(first).toHaveValue('90')
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeEnabled()
  expect(await exportConfig(page)).toEqual({ ...source, Pregnancy_MaxOffspring: 6, Pregnancy_OffspringGenderPercents: editedGenders })
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1)

  await findSetting(page, 'Pregnancy_MaxOffspring')
  await maximum.getByRole('textbox').fill('0')
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeDisabled()
  await maximum.getByRole('textbox').fill('1')
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeEnabled()
  await maximum.getByRole('button', { name: 'Undo Maximum Offspring', exact: true }).click()
  expect(await exportConfig(page)).toEqual({ ...source, Pregnancy_OffspringGenderPercents: editedGenders })
})

test('partial and unfamiliar offspring data stay lossless while mood bounds and empty pause choices remain editable', async ({ page }) => {
  const incomplete = {
    Pregnancy_MaxOffspring: '0002',
    Pregnancy_OffspringGenderPercents: [50, 50],
    Pregnancy_PercentWeights: null,
    Pregnancy_NameInactiveOffspring: 0,
    Pregnancy_PauseSimsPregnancy: ['A', 'N'],
    Future_Pregnancy: { keep: '0009', values: [true, null] },
  }
  await importConfig(page, incomplete, 'unfamiliar-pregnancy.cfg')
  await expect(page.locator('[data-setting="Pregnancy_MaxOffspring"]').getByRole('textbox')).toHaveValue('0002')
  await expect(page.locator('[data-setting="Pregnancy_NameInactiveOffspring"]').getByRole('combobox')).toHaveCount(0)
  await expect(page.locator('[data-percentage-distribution]')).toHaveCount(0)
  expect(await exportConfig(page)).toEqual(incomplete)

  const source = {
    Pregnancy_MaxOffspring: 2,
    Pregnancy_OffspringGenderPercents: { M: '050', F: 50, Future: [1, '0002'] },
    Pregnancy_PercentWeights: { '2': [70, '30'], '3': [80, 20], '4': [110, 0, 0, 0], Future: [1, 2] },
    Pregnancy_RandomMoodDuration: 1,
    Pregnancy_PauseSimsPregnancy: '',
    Future_Pregnancy: incomplete.Future_Pregnancy,
  }
  await importConfig(page, source, 'partial-pregnancy.cfg')
  const weights = await findSetting(page, 'Pregnancy_PercentWeights')
  await expect(weights.locator('[data-offspring-count="2"]').getByRole('slider')).toHaveCount(0)
  await expect(weights.locator('[data-offspring-count="3"]').getByRole('slider')).toHaveCount(0)
  await expect(weights.locator('[data-offspring-count="1"]')).toHaveCount(0)
  expect(await exportConfig(page)).toEqual(source)
  const genders = await findSetting(page, 'Pregnancy_OffspringGenderPercents')
  await expect(genders.getByRole('slider')).toHaveCount(0)

  const pause = await findSetting(page, 'Pregnancy_PauseSimsPregnancy')
  await expect(pause.getByRole('checkbox', { checked: true })).toHaveCount(0)
  await expect(pause).toContainText('No groups are paused by this setting.')
  await pause.getByRole('checkbox', { name: /: Played Sims$/ }).check()
  await pause.getByRole('checkbox', { name: /: Played Sims$/ }).uncheck()
  const duration = await findSetting(page, 'Pregnancy_RandomMoodDuration')
  await expect(duration.getByRole('slider')).toHaveAttribute('aria-valuemin', '1')
  await expect(duration.getByRole('slider')).toHaveAttribute('aria-valuemax', '23')
  await duration.getByRole('textbox').fill('23')
  expect(await exportConfig(page)).toEqual({ ...source, Pregnancy_RandomMoodDuration: 23 })
  await duration.getByRole('textbox').fill('24')
  const maximum = await findSetting(page, 'Pregnancy_MaxOffspring')
  await maximum.getByRole('textbox').fill('1')
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeDisabled()
  await findSetting(page, 'Pregnancy_RandomMoodDuration')
  await expect(duration.getByRole('textbox')).toHaveValue('24')
  await duration.getByRole('button', { name: 'Undo Random Mood Duration', exact: true }).click()
  await duration.getByRole('textbox').fill('1.5')
  expect(await exportConfig(page)).toEqual({ ...source, Pregnancy_MaxOffspring: 1, Pregnancy_RandomMoodDuration: 1.5 })
})

test('partner choices and pet limits retain unknown codes while enforcing independent numeric bounds', async ({ page }) => {
  const source = {
    ...sample,
    Pregnancy_RelationshipOnly: 'future:relationship:0007',
    Pregnancy_AllowMalePregnancy: 'future:pregnancy:0009',
    Pregnancy_PetPartnerAge: 'A,FUTURE_AGE',
  }
  await importConfig(page, source)
  const relationship = await findSetting(page, 'Pregnancy_RelationshipOnly')
  await expect(relationship.getByRole('combobox')).toContainText('future:relationship:0007 (from file)')
  const male = await findSetting(page, 'Pregnancy_AllowMalePregnancy')
  await expect(male.getByRole('combobox')).toContainText('future:pregnancy:0009 (from file)')
  expect(await exportConfig(page)).toEqual(source)
  await choose(page, male, 'Same sex only')
  await findSetting(page, 'Pregnancy_RelationshipOnly')
  await choose(page, relationship, 'WooHoo partners')

  const ages = await findSetting(page, 'Pregnancy_PetPartnerAge')
  await ages.getByRole('checkbox', { name: /: Elder$/ }).check()
  await ages.getByRole('checkbox', { name: /: Adult$/ }).uncheck()
  await expect(ages.getByRole('checkbox', { name: /FUTURE_AGE \(from file\)/ })).toBeChecked()
  const litter = await findSetting(page, 'Pregnancy_PetMaxOffspring')
  await expect(litter.getByRole('slider')).toHaveAttribute('aria-valuemin', '1')
  await expect(litter.getByRole('slider')).toHaveAttribute('aria-valuemax', '6')
  await litter.getByRole('textbox').fill('6')
  const days = await findSetting(page, 'Pregnancy_AgeUpDaysLimit')
  await expect(days.getByRole('slider')).toHaveAttribute('aria-valuemin', '0')
  await expect(days.getByRole('slider')).toHaveAttribute('aria-valuemax', '10')
  await days.getByRole('textbox').fill('10')
  const choices = { Pregnancy_RelationshipOnly: 'W', Pregnancy_AllowMalePregnancy: 'S', Pregnancy_PetPartnerAge: 'FUTURE_AGE,E' }
  expect(await exportConfig(page)).toEqual({ ...source, ...choices, Pregnancy_PetMaxOffspring: 6, Pregnancy_AgeUpDaysLimit: 10 })

  await findSetting(page, 'Pregnancy_PetMaxOffspring')
  await litter.getByRole('textbox').fill('0')
  await findSetting(page, 'Pregnancy_AgeUpDaysLimit')
  await days.getByRole('slider').press('ArrowLeft')
  await expect(days.getByRole('textbox')).toHaveValue('9')
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeDisabled()
  await findSetting(page, 'Pregnancy_PetMaxOffspring')
  await expect(litter.getByRole('textbox')).toHaveValue('0')
  await litter.getByRole('button', { name: 'Undo Maximum Offspring', exact: true }).click()
  await litter.getByRole('textbox').fill('1')
  await findSetting(page, 'Pregnancy_AgeUpDaysLimit')
  await days.getByRole('textbox').fill('10.5')
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeDisabled()
  await findSetting(page, 'Pregnancy_RelationshipOnly')
  await findSetting(page, 'Pregnancy_AgeUpDaysLimit')
  await expect(days.getByRole('textbox')).toHaveValue('10.5')
  await days.getByRole('button', { name: 'Undo Days Until Max Age', exact: true }).click()
  expect(await exportConfig(page)).toEqual({ ...source, ...choices, Pregnancy_PetMaxOffspring: 1 })
})
