import { readFileSync } from 'node:fs'
import { expect, test, type Locator, type Page } from '@playwright/test'
import type { SettingsRecord } from '../src/lib/config'
import { expandVisibleLifespanGroups } from './helpers/lifespans'

const sample = JSON.parse(readFileSync(new URL('../mc_settings.cfg', import.meta.url), 'utf8')) as SettingsRecord
type Species = 'Cat' | 'Dog' | 'Horse'
type Profile = 'Short' | 'Normal' | 'Long'

async function importConfig(page: Page, config: SettingsRecord = sample) {
  await page.getByLabel('Import config file').setInputFiles({
    name: 'pet-lifespans.cfg',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(config)),
  })
  await expect(page.getByText('pet-lifespans.cfg', { exact: true })).toBeVisible()
}

async function findSetting(page: Page, key: string) {
  await page.getByRole('textbox', { name: 'Search settings' }).fill(key)
  await expandVisibleLifespanGroups(page)
  const row = page.locator(`[data-setting="${key}"]`)
  await expect(row).toBeVisible()
  return row
}

async function openPetProfile(page: Page, species: Species, profile: Profile) {
  return findSetting(page, `AgeSpan${species}${profile}`)
}

function ageField(row: Locator, species: Species, profile: Profile, field: string) {
  const label = `${species} lifespan — ${profile}: ${field}`
  return {
    input: row.getByRole('textbox', { name: label, exact: true }),
    slider: row.getByRole('slider', { name: label, exact: true }),
  }
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

test('all nine pet profiles show chronological editable zeros with EA guidance and export unchanged', async ({ page }) => {
  await importConfig(page)
  const profiles = [
    { species: 'Cat', name: 'Short', defaults: [1, 15, 5.5] },
    { species: 'Cat', name: 'Normal', defaults: [2, 30, 11] },
    { species: 'Cat', name: 'Long', defaults: [8, 120, 44] },
    { species: 'Dog', name: 'Short', defaults: [1, 12.5, 4.5] },
    { species: 'Dog', name: 'Normal', defaults: [2, 25, 9] },
    { species: 'Dog', name: 'Long', defaults: [8, 100, 36] },
    { species: 'Horse', name: 'Short', defaults: [3.5, 25, 6.5] },
    { species: 'Horse', name: 'Normal', defaults: [7, 50, 13] },
    { species: 'Horse', name: 'Long', defaults: [28, 200, 52] },
  ] as const

  for (const profile of profiles) {
    const row = await openPetProfile(page, profile.species, profile.name)
    await expect(row.getByRole('slider')).toHaveCount(3)
    await expect(row.getByRole('checkbox')).toHaveCount(0)
    await expect(row.getByText('Not in reference', { exact: true })).toHaveCount(0)
    const fields = await row.getByRole('textbox').evaluateAll(elements => elements.map(element => {
      const input = element as HTMLInputElement
      return {
        label: input.getAttribute('aria-label'), value: input.value, disabled: input.disabled,
        description: (input.getAttribute('aria-describedby') ?? '').split(' ')
          .map(id => document.getElementById(id)?.textContent ?? '').join(' '),
      }
    }))
    expect(fields.map(({ label }) => label)).toEqual(['Child', 'Adult', 'Elder'].map(age => `${profile.species} lifespan — ${profile.name}: ${age}`))
    expect(fields.every(({ value, disabled }) => value === '0' && !disabled)).toBe(true)
    for (const [index, value] of profile.defaults.entries()) {
      expect(fields[index]!.description).toContain(`EA default: ${value} days`)
    }
  }

  expect(await exportConfig(page)).toEqual(sample)
})

test('cat sliders use whole-day steps while precise fractions, unknown fields and stored types survive a zero reset', async ({ page }) => {
  const source = {
    ...sample,
    AgeSpanCatShort: { ...(sample.AgeSpanCatShort as SettingsRecord), Adult: '015', FutureStage: 1500, FutureBlank: '' },
    Future_Settings: { numericString: '0012', items: [null, false, 4] },
  }
  await importConfig(page, source)
  const row = await openPetProfile(page, 'Cat', 'Short')
  const child = ageField(row, 'Cat', 'Short', 'Child')
  await expect(child.slider).toHaveAttribute('aria-valuemin', '0')
  await expect(child.slider).toHaveAttribute('aria-valuemax', '1000')
  await child.slider.press('ArrowRight')
  await expect(child.input).toHaveValue('1')
  await child.input.fill('1.25')
  await expect(child.slider).toHaveAttribute('aria-valuenow', '1.25')
  await expect(ageField(row, 'Cat', 'Short', 'Adult').input).toHaveValue('015')
  await expect(ageField(row, 'Cat', 'Short', 'Adult').slider).toHaveCount(0)
  expect(await exportConfig(page)).toEqual({
    ...source,
    AgeSpanCatShort: { ...source.AgeSpanCatShort, Child: 1.25 },
  })

  await child.input.fill('')
  await expect(child.input).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeDisabled()
  await child.input.fill('0')
  await expect(child.input).toBeEnabled()
  await expect(child.input).toHaveValue('0')
  await expect(child.slider).toHaveAttribute('aria-valuenow', '0')
  expect(await exportConfig(page)).toEqual(source)
})

test('dog age validation survives sibling edits and filtering and accepts both custom boundaries', async ({ page }) => {
  await importConfig(page)
  const row = await openPetProfile(page, 'Dog', 'Normal')
  const child = ageField(row, 'Dog', 'Normal', 'Child')
  const adult = ageField(row, 'Dog', 'Normal', 'Adult')
  await child.input.fill('0.5')
  await expect(child.input).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeDisabled()

  await adult.input.fill('25')
  await expect(child.input).toHaveValue('0.5')
  await expect(child.input).toHaveAttribute('aria-invalid', 'true')
  await findSetting(page, 'Relationship_MoveinAges')
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeDisabled()
  await findSetting(page, 'AgeSpanDogNormal')
  await expect(child.input).toHaveValue('0.5')

  await child.input.fill('-1')
  await expect(child.input).toHaveAttribute('aria-invalid', 'true')
  await child.input.fill('1000.1')
  await adult.input.fill('26.25')
  await expect(child.input).toHaveValue('1000.1')
  await expect(child.input).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeDisabled()
  await child.input.fill('1')
  expect(await exportConfig(page)).toEqual({
    ...sample,
    AgeSpanDogNormal: { ...(sample.AgeSpanDogNormal as SettingsRecord), Child: 1, Adult: 26.25 },
  })
  await child.input.fill('1000')
  expect(await exportConfig(page)).toEqual({
    ...sample,
    AgeSpanDogNormal: { ...(sample.AgeSpanDogNormal as SettingsRecord), Child: 1000, Adult: 26.25 },
  })
})

test('advanced horse JSON enforces changed known ages while preserving untouched outliers and imported types', async ({ page }) => {
  const ages = { ...(sample.AgeSpanHorseLong as SettingsRecord), Adult: 1500, Elder: '052', FutureStage: 2500, FutureBlank: '' }
  const source = { ...sample, AgeSpanHorseLong: ages }
  await importConfig(page, source)
  const row = await openPetProfile(page, 'Horse', 'Long')
  await expect(ageField(row, 'Horse', 'Long', 'Adult').input).toHaveValue('1500')
  await expect(ageField(row, 'Horse', 'Long', 'Adult').slider).toBeDisabled()
  await expect(ageField(row, 'Horse', 'Long', 'Elder').input).toHaveValue('052')
  await expect(ageField(row, 'Horse', 'Long', 'Elder').slider).toHaveCount(0)
  expect(await exportConfig(page)).toEqual(source)
  await row.getByRole('button', { name: 'Edit JSON for Horse lifespan — Long', exact: true }).click()
  const json = row.getByRole('textbox', { name: 'Horse lifespan — Long JSON', exact: true })
  expect(JSON.parse(await json.inputValue())).toEqual(ages)

  for (const child of [0.5, 1000.1, '1.25']) {
    await json.fill(JSON.stringify({ ...ages, Child: child }))
    await expect(json).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByRole('button', { name: /^Export config/ })).toBeDisabled()
    await expect(row.getByRole('button', { name: 'Use fields for Horse lifespan — Long', exact: true })).toBeDisabled()
  }

  await json.fill(JSON.stringify({ ...ages, Child: 1.25 }))
  expect(await exportConfig(page)).toEqual({
    ...source,
    AgeSpanHorseLong: { ...ages, Child: 1.25 },
  })

  await json.fill(JSON.stringify({ ...ages, Child: 1.25, Adult: 1501 }))
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeDisabled()
  await json.fill(JSON.stringify({ ...ages, Child: 1.25, Adult: 0 }))
  expect(await exportConfig(page)).toEqual({
    ...source,
    AgeSpanHorseLong: { ...ages, Child: 1.25, Adult: 0 },
  })
})
