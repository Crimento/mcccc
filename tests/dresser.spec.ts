import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import type { SettingsRecord } from '../src/lib/config'

const sample = JSON.parse(readFileSync(new URL('../mc_settings.cfg', import.meta.url), 'utf8')) as SettingsRecord
let importSequence = 0

async function importConfig(page: Page, config: SettingsRecord) {
  const name = `dresser-${++importSequence}.cfg`
  await page.getByLabel('Import config file').setInputFiles({
    name, mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(config)),
  })
  await expect(page.getByText(name, { exact: true })).toBeVisible()
  await page.locator('[data-category="dresser"]').click()
}

async function openMenu(page: Page, path: string, count: number) {
  await page.locator(`[data-menu-path="${path}"]`).click()
  await expect(page.locator('article[data-setting]:visible')).toHaveCount(count)
}

async function exportConfig(page: Page): Promise<SettingsRecord> {
  await page.getByRole('button', { name: /^Export config/ }).click()
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

test('Dresser menus retain all settings and independent edits preserve CSV tokens and unknown choices', async ({ page }) => {
  const source = {
    ...sample,
    Dresser_FacialHairPercent: '030, 40,50.0,60',
    Dresser_MakeupGenders: 'F,FUTURE',
    Dresser_MakeupOutfits: 'E,AT,F,P,SL,SW,C,B,SI,SP,HW,CW,BT,FUTURE',
    Dresser_ReplaceSituationOutfits: 'opaque::0007|future',
  }
  await importConfig(page, source)
  const keys = await page.locator('article[data-setting]:visible').evaluateAll(rows => rows.map(row => row.getAttribute('data-setting')!))
  expect(keys).toHaveLength(23)
  expect(new Set(keys)).toEqual(new Set(Object.keys(sample).filter(key => key.startsWith('Dresser_'))))
  expect(keys.slice(0, 4)).toEqual([
    'Dresser_RunOnAgeUp', 'Dresser_CleanBathingOutfit', 'Dresser_CustomItemsOnly', 'Dresser_PercentUseCustomSkinTone',
  ])

  await openMenu(page, 'Facial Hair Settings', 2)
  const percents = page.locator('[data-setting="Dresser_FacialHairPercent"]')
  await expect(percents.getByRole('slider')).toHaveCount(4)
  expect(await exportConfig(page)).toEqual(source)
  const youngAdult = percents.getByRole('slider', { name: 'Facial Hair Percents: Young Adult', exact: true })
  await youngAdult.press('ArrowRight')
  await expect(percents.getByRole('textbox', { name: 'Facial Hair Percents: Young Adult', exact: true })).toHaveValue('41')
  await percents.getByRole('textbox', { name: 'Facial Hair Percents: Young Adult', exact: true }).fill('42')

  await openMenu(page, 'Makeup Settings', 7)
  const genders = page.locator('[data-setting="Dresser_MakeupGenders"]')
  await expect(genders.getByRole('checkbox', { name: 'Makeup Genders: Female', exact: true })).toBeChecked()
  await genders.getByRole('checkbox', { name: 'Makeup Genders: Male', exact: true }).check()
  await genders.getByRole('checkbox', { name: 'Makeup Genders: Female', exact: true }).uncheck()
  await expect(genders.getByRole('checkbox', { name: /FUTURE \(from file\)/ })).toBeChecked()
  const outfits = page.locator('[data-setting="Dresser_MakeupOutfits"]')
  await expect(outfits.getByRole('checkbox', { checked: true })).toHaveCount(14)
  const outfitLabels = await outfits.getByRole('checkbox').evaluateAll(choices => choices.slice(0, 8).map(choice => choice.getAttribute('aria-label')))
  expect(outfitLabels).toEqual(['Everyday', 'Formal', 'Athletic', 'Sleep', 'Party', 'Swimwear', 'Hot Weather', 'Cold Weather'].map(label => `Makeup Outfits: ${label}`))
  await outfits.getByRole('checkbox', { name: 'Makeup Outfits: Party', exact: true }).uncheck()
  for (const label of ['Bathing', 'Batuu', 'Career', 'Situation', 'Special']) {
    await expect(outfits.getByRole('checkbox', { name: `Makeup Outfits: ${label}`, exact: true })).toBeChecked()
  }
  await outfits.getByRole('checkbox', { name: 'Makeup Outfits: Bathing', exact: true }).uncheck()
  await outfits.getByRole('checkbox', { name: 'Makeup Outfits: Batuu', exact: true }).uncheck()
  await expect(outfits.getByRole('checkbox', { name: /FUTURE \(from file\)/ })).toBeChecked()

  await openMenu(page, 'Outfits Settings', 10)
  await openMenu(page, 'Outfits Settings/Multiple Outfit Settings', 4)
  await openMenu(page, 'Outfits Settings/Replace Situation Outfits', 1)
  const situations = page.locator('[data-setting="Dresser_ReplaceSituationOutfits"]')
  await expect(situations.getByRole('textbox')).toHaveCount(0)
  await expect(situations.getByRole('combobox')).toHaveCount(12)
  await expect(situations.locator('[data-situation-unknown-entries]')).toContainText(source.Dresser_ReplaceSituationOutfits)
  expect(await exportConfig(page)).toEqual({
    ...source,
    Dresser_FacialHairPercent: '030,42,50.0,60',
    Dresser_MakeupGenders: 'FUTURE,M',
    Dresser_MakeupOutfits: 'E,AT,F,SL,SW,C,SI,SP,HW,CW,FUTURE',
  })
  await openMenu(page, 'Makeup Settings', 7)
  await outfits.getByRole('button', { name: /^Undo / }).click()
  expect(await exportConfig(page)).toEqual({
    ...source, Dresser_FacialHairPercent: '030,42,50.0,60', Dresser_MakeupGenders: 'FUTURE,M',
  })
})

test('unsupported facial-hair CSV formats and unrelated future CSV settings remain unchanged', async ({ page }) => {
  for (const facialHair of ['010,20,30,40,50', '010,FUTURE,30,40']) {
    const source = {
      ...sample,
      Dresser_FacialHairPercent: facialHair,
      Dresser_ReplaceSituationOutfits: 'future-context:0007',
      Future_Percentage: '1,2,3,4',
    }
    await importConfig(page, source)
    await openMenu(page, 'Facial Hair Settings', 2)
    const percents = page.locator('[data-setting="Dresser_FacialHairPercent"]')
    await expect(percents.getByRole('slider')).toHaveCount(0)
    await expect(percents.getByRole('textbox')).toHaveValue(facialHair)
    await page.getByRole('textbox', { name: 'Search settings' }).fill('Future_Percentage')
    const unknown = page.locator('[data-setting="Future_Percentage"]')
    await expect(unknown.getByRole('slider')).toHaveCount(0)
    await expect(unknown.getByRole('textbox')).toHaveValue('1,2,3,4')
    expect(await exportConfig(page)).toEqual(source)
  }
})

test('career and situation outfit edits preserve duplicate rules and raw unknown entries, with explicit reset and no automatic overrides', async ({ page }) => {
  const rules = 'V:E,RF:E,D:E,HF:E,SF:E,CW:AT,SRN:E,IL:E,UNV:E,THR:E,HOR:E,RNT:E, CW : E \t,MODDED:HW,bad::value'
  const source = {
    ...sample,
    Dresser_ChangeOutfitAfterCareerF: '0007',
    Dresser_ChangeOutfitAfterCareerM: '',
    Dresser_ReplaceSituationOutfits: rules,
    Future_Dresser_Data: { raw: '0007', flags: [null, false] },
  }
  await importConfig(page, source)
  await openMenu(page, 'Outfits Settings', 10)
  const female = page.locator('[data-setting="Dresser_ChangeOutfitAfterCareerF"]')
  const male = page.locator('[data-setting="Dresser_ChangeOutfitAfterCareerM"]')
  const situations = page.locator('[data-setting="Dresser_ReplaceSituationOutfits"]')
  await expect(female.getByRole('combobox')).toHaveText('0007 (from file)')
  await expect(male.getByRole('combobox')).toHaveText('Keep career outfit')
  await expect(situations.getByRole('combobox')).toHaveCount(12)
  const city = situations.locator('[data-situation="CW"]').getByRole('combobox')
  const date = situations.locator('[data-situation="D"]').getByRole('combobox')
  await expect(city).toHaveText('Multiple values (from file)')
  await expect(date).toHaveText('Everyday')
  expect(await exportConfig(page)).toEqual(source)

  await female.getByRole('combobox').click()
  await page.getByRole('option', { name: 'Cold Weather', exact: true }).click()
  await male.getByRole('combobox').click()
  await expect(page.getByRole('option')).toHaveCount(9)
  for (const label of ['Bathing', 'Batuu', 'Career', 'Situation', 'Special']) {
    await expect(page.getByRole('option', { name: label, exact: true })).toHaveCount(0)
  }
  await page.getByRole('option', { name: 'Hot Weather', exact: true }).click()
  await city.click()
  await page.getByRole('option', { name: 'Hot Weather', exact: true }).click()
  await date.click()
  await page.getByRole('option', { name: 'Keep situation outfit', exact: true }).click()
  expect(await exportConfig(page)).toEqual({
    ...source,
    Dresser_ChangeOutfitAfterCareerF: 'CW', Dresser_ChangeOutfitAfterCareerM: 'HW',
    Dresser_ReplaceSituationOutfits: 'V:E,RF:E,HF:E,SF:E,CW:HW,SRN:E,IL:E,UNV:E,THR:E,HOR:E,RNT:E, CW : HW \t,MODDED:HW,bad::value',
  })
  await female.getByRole('button', { name: /^Undo / }).click()
  await expect(male.getByRole('combobox')).toHaveText('Hot Weather')
  await male.getByRole('combobox').click()
  await page.getByRole('option', { name: 'Keep career outfit', exact: true }).click()
  await situations.getByRole('button', { name: /^Undo / }).click()
  expect(await exportConfig(page)).toEqual(source)

  const empty = { Dresser_ReplaceSituationOutfits: '', Future_Dresser_Data: source.Future_Dresser_Data }
  await importConfig(page, empty)
  await openMenu(page, 'Outfits Settings/Replace Situation Outfits', 1)
  await expect(situations.getByRole('combobox')).toHaveCount(12)
  expect(await situations.getByRole('combobox').allTextContents()).toEqual(Array(12).fill('Keep situation outfit'))
  expect(await exportConfig(page)).toEqual(empty)
  const vampire = situations.locator('[data-situation="V"]').getByRole('combobox')
  await vampire.click()
  await page.getByRole('option', { name: 'Formal', exact: true }).click()
  expect(await exportConfig(page)).toEqual({ ...empty, Dresser_ReplaceSituationOutfits: 'V:F' })
  await vampire.click()
  await page.getByRole('option', { name: 'Keep situation outfit', exact: true }).click()
  expect(await exportConfig(page)).toEqual(empty)
})

test('outfit numeric bounds retain invalid drafts and independent edits while partial malformed fields remain unchanged', async ({ page }) => {
  const source = {
    Dresser_PercentUseCustomSkinTone: 50,
    Dresser_PercentMultipleOutfits: 20,
    Dresser_MaximumMultipleOutfits: 2,
    Dresser_MultipleOutfitAges: 'YA,FUTURE',
    Dresser_MultipleOutfitGenders: 'F',
    Dresser_ChangeOutfitAfterCareerF: { future: [null, 'E'] },
    Dresser_ChangeOutfitAfterCareerM: '0007',
    Dresser_ReplaceSituationOutfits: ['V:E', null],
    Future_Dresser_Data: { raw: '0007', values: [null, false] },
  }
  await importConfig(page, source)
  await expect(page.locator('article[data-setting]:visible')).toHaveCount(8)
  const skin = page.locator('[data-setting="Dresser_PercentUseCustomSkinTone"]')
  const percent = page.locator('[data-setting="Dresser_PercentMultipleOutfits"]')
  const maximum = page.locator('[data-setting="Dresser_MaximumMultipleOutfits"]')
  await expect(page.locator('[data-setting="Dresser_ChangeOutfitAfterCareerF"]').getByRole('combobox')).toHaveCount(0)
  await expect(page.locator('[data-setting="Dresser_ReplaceSituationOutfits"]').locator('[data-situation-outfits-control]')).toHaveCount(0)
  await expect(page.locator('[data-setting="Dresser_SituationUseStandardOutfits"]')).toHaveCount(0)
  for (const [row, min, max] of [[skin, 0, 100], [percent, 0, 100], [maximum, 1, 5]] as const) {
    await expect(row.getByRole('slider')).toHaveAttribute('aria-valuemin', String(min))
    await expect(row.getByRole('slider')).toHaveAttribute('aria-valuemax', String(max))
  }
  expect(await exportConfig(page)).toEqual(source)
  await skin.getByRole('slider').press('End')
  await percent.getByRole('slider').press('Home')
  await maximum.getByRole('slider').press('End')
  expect(await exportConfig(page)).toEqual({ ...source, Dresser_PercentUseCustomSkinTone: 100, Dresser_PercentMultipleOutfits: 0, Dresser_MaximumMultipleOutfits: 5 })

  await skin.getByRole('textbox').fill('101')
  await maximum.getByRole('textbox').fill('6')
  await page.locator('[data-setting="Dresser_MultipleOutfitGenders"]').getByRole('checkbox', { name: 'Multiple Outfit Genders: Male', exact: true }).check()
  await percent.getByRole('textbox').fill('1.5')
  await expect(percent.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  await percent.getByRole('textbox').fill('100')
  await openMenu(page, 'Outfits Settings/Multiple Outfit Settings', 4)
  await expect(skin).toBeAttached()
  await expect(skin).toBeHidden()
  await expect(maximum.getByRole('textbox')).toHaveValue('6')
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeDisabled()
  await maximum.getByRole('button', { name: /^Undo / }).click()
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeDisabled()
  await page.getByRole('textbox', { name: 'Search settings' }).fill('Dresser_PercentUseCustomSkinTone')
  await expect(skin.getByRole('textbox')).toHaveValue('101')
  await expect(skin.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  await skin.getByRole('button', { name: /^Undo / }).click()
  expect(await exportConfig(page)).toEqual({ ...source, Dresser_PercentMultipleOutfits: 100, Dresser_MultipleOutfitGenders: 'F,M' })
})

test('all three reviewed Dresser age lists support seven ages with independent edits, unknown preservation and Undo', async ({ page }) => {
  const source = {
    ...sample,
    Dresser_RunOnAgeUp: 'I,TD,C,T,YA,A,E',
    Dresser_MakeupAges: 'I,TD,C,T,YA,A,E,FUTURE_AGE',
    Dresser_MultipleOutfitAges: 'I,TD,C,T,YA,A,E,FUTURE_MULTI',
  }
  await importConfig(page, source)
  const run = page.locator('[data-setting="Dresser_RunOnAgeUp"]')
  const makeup = page.locator('[data-setting="Dresser_MakeupAges"]')
  const multiple = page.locator('[data-setting="Dresser_MultipleOutfitAges"]')
  const labels = ['Infant', 'Toddler', 'Child', 'Teen', 'Young Adult', 'Adult', 'Elder']
  for (const [row, count] of [[run, 7], [makeup, 8], [multiple, 8]] as const) {
    await expect(row.getByRole('checkbox', { checked: true })).toHaveCount(count)
    expect(await row.getByRole('checkbox').evaluateAll(choices => choices.slice(0, 7)
      .map(choice => choice.getAttribute('aria-label')!.split(': ').at(-1)))).toEqual(labels)
  }
  await expect(run.getByRole('checkbox', { name: /\(from file\)/ })).toHaveCount(0)
  await expect(makeup.getByRole('checkbox', { name: /FUTURE_AGE \(from file\)/ })).toBeChecked()
  expect(await exportConfig(page)).toEqual(source)

  await run.getByRole('checkbox', { name: /: Infant$/ }).uncheck()
  await makeup.getByRole('checkbox', { name: /: Toddler$/ }).uncheck()
  await multiple.getByRole('checkbox', { name: /: Infant$/ }).uncheck()
  expect(await exportConfig(page)).toEqual({
    ...source, Dresser_RunOnAgeUp: 'TD,C,T,YA,A,E', Dresser_MakeupAges: 'I,C,T,YA,A,E,FUTURE_AGE',
    Dresser_MultipleOutfitAges: 'TD,C,T,YA,A,E,FUTURE_MULTI',
  })
  await run.getByRole('button', { name: /^Undo / }).click()
  expect(await exportConfig(page)).toEqual({
    ...source, Dresser_MakeupAges: 'I,C,T,YA,A,E,FUTURE_AGE', Dresser_MultipleOutfitAges: 'TD,C,T,YA,A,E,FUTURE_MULTI',
  })
  await makeup.getByRole('button', { name: /^Undo / }).click()
  await multiple.getByRole('button', { name: /^Undo / }).click()
  expect(await exportConfig(page)).toEqual(source)
})
