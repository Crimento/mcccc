import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import type { SettingsRecord } from '../src/lib/config'

const sample = JSON.parse(readFileSync(new URL('../mc_settings.cfg', import.meta.url), 'utf8')) as SettingsRecord
let importSequence = 0

async function importConfig(page: Page, config: SettingsRecord = sample) {
  const name = `abduction-${++importSequence}.cfg`
  await page.getByLabel('Import config file').setInputFiles({
    name,
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(config)),
  })
  await expect(page.getByText(name, { exact: true })).toBeVisible()
}

async function findSetting(page: Page, key: string) {
  await page.getByRole('textbox', { name: 'Search settings' }).fill(key)
  const row = page.locator(`[data-setting="${key}"]`)
  await expect(row).toBeVisible()
  return row
}

async function exportConfig(page: Page): Promise<SettingsRecord> {
  await page.getByRole('button', { name: /^Export config/ }).click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download mc_settings.cfg', exact: true }).click()
  const path = await (await downloadPromise).path()
  expect(path).not.toBeNull()
  return JSON.parse(readFileSync(path!, 'utf8')) as SettingsRecord
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Your game. Your settings.' })).toBeVisible()
})

test('abduction age chances stay independent CSV values and gender choices retain their codes', async ({ page }) => {
  const source = {
    ...sample,
    Occult_AgePercentage: '030, 30,30.0,30',
    Future_Value: { numericString: '0012', nested: [null, false, 3] },
  }
  await importConfig(page, source)
  const ages = await findSetting(page, 'Occult_AgePercentage')
  await expect(ages.getByRole('slider')).toHaveCount(4)
  for (const age of ['Teen', 'Young Adult', 'Adult', 'Elder']) {
    await expect(ages.getByRole('slider', { name: `Abduction Pregnancy Percent: ${age}`, exact: true })).toHaveAttribute('aria-valuenow', '30')
  }
  // The supplied four independent chances total 120; opening the editor must not normalize them.
  expect(await exportConfig(page)).toEqual(source)

  await ages.getByRole('slider', { name: 'Abduction Pregnancy Percent: Young Adult', exact: true }).press('ArrowRight')
  await expect(ages.getByRole('textbox', { name: 'Abduction Pregnancy Percent: Young Adult', exact: true })).toHaveValue('31')
  await ages.getByRole('textbox', { name: 'Abduction Pregnancy Percent: Young Adult', exact: true }).fill('42')

  const gender = await findSetting(page, 'Occult_AbductionPregnancyGenders')
  const select = gender.getByRole('combobox', { name: 'Abduction Pregnancy Genders', exact: true })
  await expect(select).toContainText('Male')
  await select.click()
  await page.getByRole('option', { name: 'Female', exact: true }).click()
  expect(await exportConfig(page)).toEqual({
    ...source, Occult_AgePercentage: '030,42,30.0,30', Occult_AbductionPregnancyGenders: 'F',
  })

  await select.click()
  await page.getByRole('option', { name: 'Male', exact: true }).click()
  expect(await exportConfig(page)).toEqual({ ...source, Occult_AgePercentage: '030,42,30.0,30' })
})

test('invalid CSV chance drafts survive sibling edits and filtering until corrected', async ({ page }) => {
  await importConfig(page)
  const ages = await findSetting(page, 'Occult_AgePercentage')
  const teen = ages.getByRole('textbox', { name: 'Abduction Pregnancy Percent: Teen', exact: true })
  const adult = ages.getByRole('textbox', { name: 'Abduction Pregnancy Percent: Adult', exact: true })
  await teen.fill('101')
  await expect(teen).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeDisabled()
  await adult.fill('45')
  await expect(teen).toHaveValue('101')
  await expect(teen).toHaveAttribute('aria-invalid', 'true')
  await expect(adult).toHaveValue('45')

  await findSetting(page, 'Occult_AbductionStartHour')
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeDisabled()
  await findSetting(page, 'Occult_AgePercentage')
  await expect(teen).toHaveValue('101')
  await teen.fill('-1')
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeDisabled()
  await teen.fill('0')
  await ages.getByRole('textbox', { name: 'Abduction Pregnancy Percent: Elder', exact: true }).fill('100')
  expect(await exportConfig(page)).toEqual({ ...sample, Occult_AgePercentage: '0,30,45,100' })
})

test('abduction hour controls accept their boundaries and block invalid precise values', async ({ page }) => {
  await importConfig(page)
  const start = await findSetting(page, 'Occult_AbductionStartHour')
  await expect(start.getByRole('slider')).toHaveAttribute('aria-valuemin', '0')
  await expect(start.getByRole('slider')).toHaveAttribute('aria-valuemax', '23')
  await expect(start.getByText('hours', { exact: true })).toBeVisible()
  await start.getByRole('textbox').fill('0')

  const duration = await findSetting(page, 'Occult_AbductionDuration')
  await expect(duration.getByRole('slider')).toHaveAttribute('aria-valuemin', '1')
  await expect(duration.getByRole('slider')).toHaveAttribute('aria-valuemax', '24')
  await expect(duration.getByText('hours', { exact: true })).toBeVisible()
  await duration.getByRole('textbox').fill('1')
  expect(await exportConfig(page)).toEqual({ ...sample, Occult_AbductionStartHour: 0, Occult_AbductionDuration: 1 })

  await duration.getByRole('textbox').fill('24')
  await findSetting(page, 'Occult_AbductionStartHour')
  await start.getByRole('textbox').fill('23')
  expect(await exportConfig(page)).toEqual({ ...sample, Occult_AbductionStartHour: 23, Occult_AbductionDuration: 24 })

  await start.getByRole('textbox').fill('24')
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeDisabled()
  await findSetting(page, 'Occult_AbductionDuration')
  await duration.getByRole('textbox').fill('0')
  await expect(duration.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  await findSetting(page, 'Occult_AbductionStartHour')
  await start.getByRole('textbox').fill('0')
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeDisabled()
  await findSetting(page, 'Occult_AbductionDuration')
  await duration.getByRole('textbox').fill('25')
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeDisabled()
  await duration.getByRole('textbox').fill('24')
  expect(await exportConfig(page)).toEqual({ ...sample, Occult_AbductionStartHour: 0, Occult_AbductionDuration: 24 })
})

test('incompatible CSV shapes and unfamiliar gender codes remain intact through generic controls', async ({ page }) => {
  for (const value of ['10,20,30', '10,20,30,40,50', '10,20,FUTURE,40']) {
    const source = {
      ...sample,
      Occult_AgePercentage: value,
      Occult_AbductionPregnancyGenders: 'FUTURE',
      Future_Csv: '9,8,7,6',
    }
    await importConfig(page, source)
    const ages = await findSetting(page, 'Occult_AgePercentage')
    await expect(ages.getByRole('slider')).toHaveCount(0)
    await expect(ages.getByRole('textbox', { name: 'Abduction Pregnancy Percent', exact: true })).toHaveValue(value)
    const unknown = await findSetting(page, 'Future_Csv')
    await expect(unknown.getByRole('slider')).toHaveCount(0)
    await expect(unknown.getByRole('textbox')).toHaveValue('9,8,7,6')
    const gender = await findSetting(page, 'Occult_AbductionPregnancyGenders')
    await expect(gender.getByRole('combobox')).toContainText('FUTURE (from file)')
    expect(await exportConfig(page)).toEqual(source)
  }
})
