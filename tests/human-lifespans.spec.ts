import { readFileSync } from 'node:fs'
import { expect, test, type Locator, type Page } from '@playwright/test'
import type { SettingsRecord } from '../src/lib/config'
import { expandVisibleLifespanGroups } from './helpers/lifespans'

const sample = JSON.parse(readFileSync(new URL('../mc_settings.cfg', import.meta.url), 'utf8')) as SettingsRecord
type Profile = 'Short' | 'Normal' | 'Long'

async function importConfig(page: Page, config: SettingsRecord = sample) {
  await page.getByLabel('Import config file').setInputFiles({
    name: 'human-lifespans.cfg', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(config)),
  })
  await expect(page.getByText('human-lifespans.cfg', { exact: true })).toBeVisible()
}

async function findSetting(page: Page, key: string) {
  await page.getByRole('textbox', { name: 'Search settings' }).fill(key)
  await expandVisibleLifespanGroups(page)
  const row = page.locator(`[data-setting="${key}"]`)
  await expect(row).toBeVisible()
  return row
}

async function openProfile(page: Page, profile: Profile) {
  return findSetting(page, `AgeSpan${profile}`)
}

function ageField(row: Locator, profile: Profile, age: string) {
  const name = `Human lifespan — ${profile}: ${age}`
  return {
    input: row.getByRole('textbox', { name, exact: true }),
    slider: row.getByRole('slider', { name, exact: true }),
  }
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

test('human profiles show chronological ages and EA guidance while every stored zero stays editable and exports unchanged', async ({ page }) => {
  await importConfig(page)
  const ageOrder = ['Newborn', 'Infant', 'Toddler', 'Child', 'Teen', 'Young Adult', 'Adult', 'Elder']
  const profiles = [
    { name: 'Short', hints: [['Newborn', '0.5'], ['Toddler', '3.5'], ['Teen', '10.5']] },
    { name: 'Normal', hints: [['Infant', '5'], ['Young Adult', '28']] },
    { name: 'Long', hints: [['Child', '56'], ['Adult', '168']] },
  ] as const
  for (const profile of profiles) {
    const row = await openProfile(page, profile.name)
    await expect(row.getByRole('slider')).toHaveCount(8)
    await expect(row.getByRole('checkbox')).toHaveCount(0)
    const labels = await row.getByRole('textbox').evaluateAll(fields =>
      fields.map(field => field.getAttribute('aria-label')!.split(': ').at(-1)))
    expect(labels).toEqual(ageOrder)
    for (const age of ageOrder) {
      const { input } = ageField(row, profile.name, age)
      await expect(input).toHaveValue('0')
      await expect(input).toBeEnabled()
    }
    for (const [age, value] of profile.hints) {
      await expect(ageField(row, profile.name, age).input).toHaveAccessibleDescription(new RegExp(`EA default: ${value} days`))
    }
  }

  await page.setViewportSize({ width: 390, height: 844 })
  const longProfile = page.locator('[data-setting="AgeSpanLong"]')
  await expect(ageField(longProfile, 'Long', 'Newborn').input).toBeVisible()
  const widths = await page.evaluate(() => ({
    viewport: window.innerWidth, body: document.body.scrollWidth, document: document.documentElement.scrollWidth,
  }))
  expect(widths.body).toBeLessThanOrEqual(widths.viewport + 1)
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 1)
  expect(await exportConfig(page)).toEqual(sample)
})

test('human sliders and fractional inputs stay in sync while invalid drafts survive sibling edits and filtering', async ({ page }) => {
  await importConfig(page)
  const row = await openProfile(page, 'Normal')
  const newborn = ageField(row, 'Normal', 'Newborn')
  const adult = ageField(row, 'Normal', 'Adult')
  await expect(newborn.slider).toHaveAttribute('aria-valuemin', '0')
  await expect(newborn.slider).toHaveAttribute('aria-valuemax', '4000')
  await newborn.slider.press('ArrowRight')
  await expect(newborn.input).toHaveValue('0.5')
  await newborn.input.fill('0.25')
  await expect(newborn.slider).toHaveAttribute('aria-valuenow', '0.25')
  expect(await exportConfig(page)).toEqual({
    ...sample, AgeSpanNormal: { ...(sample.AgeSpanNormal as SettingsRecord), Baby: 0.25 },
  })

  await newborn.input.fill('-1')
  await adult.input.fill('42.5')
  await expect(newborn.input).toHaveValue('-1')
  await expect(newborn.input).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeDisabled()
  await findSetting(page, 'Game_Time_Speed')
  await expect(row).toBeAttached()
  await expect(row).toBeHidden()
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeDisabled()
  await findSetting(page, 'AgeSpanNormal')
  await expect(newborn.input).toHaveValue('-1')
  await newborn.input.fill('4000.1')
  await adult.input.fill('84.25')
  await expect(newborn.input).toHaveValue('4000.1')
  await expect(newborn.input).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeDisabled()

  await newborn.input.fill('4000')
  await expect(newborn.slider).toHaveAttribute('aria-valuenow', '4000')
  expect(await exportConfig(page)).toEqual({
    ...sample, AgeSpanNormal: { ...(sample.AgeSpanNormal as SettingsRecord), Baby: 4000, Adult: 84.25 },
  })
  await newborn.input.fill('0')
  await expect(newborn.input).toHaveValue('0')
  await expect(newborn.input).toBeEnabled()
  await expect(newborn.slider).toHaveAttribute('aria-valuenow', '0')
  expect(await exportConfig(page)).toEqual({
    ...sample, AgeSpanNormal: { ...(sample.AgeSpanNormal as SettingsRecord), Adult: 84.25 },
  })
})

test('advanced human age edits retain stored keys, unknown types and untouched outliers while validating changed known ages', async ({ page }) => {
  const ages = {
    ...(sample.AgeSpanLong as SettingsRecord),
    Infant: '005',
    Elder: 4500,
    FutureStage: { numericString: '0012', values: [true, null, 'A,B'] },
    FutureBlank: '',
  }
  const source = { ...sample, AgeSpanLong: ages }
  await importConfig(page, source)
  const row = await openProfile(page, 'Long')
  await expect(ageField(row, 'Long', 'Infant').input).toHaveValue('005')
  await expect(ageField(row, 'Long', 'Infant').slider).toHaveCount(0)
  await expect(ageField(row, 'Long', 'Elder').input).toHaveValue('4500')
  await expect(ageField(row, 'Long', 'Elder').slider).toBeDisabled()
  expect(await exportConfig(page)).toEqual(source)

  await row.getByRole('button', { name: 'Edit JSON for Human lifespan — Long', exact: true }).click()
  const json = row.getByRole('textbox', { name: 'Human lifespan — Long JSON', exact: true })
  const raw = JSON.parse(await json.inputValue()) as SettingsRecord
  expect(raw).toEqual(ages)
  expect(raw).toHaveProperty('Baby', 0)
  expect(raw).toHaveProperty('YoungAdult', 0)
  expect(raw).not.toHaveProperty('Newborn')
  await json.fill(JSON.stringify({ ...ages, Baby: 0.25 }))
  expect(await exportConfig(page)).toEqual({ ...source, AgeSpanLong: { ...ages, Baby: 0.25 } })

  for (const changed of [{ YoungAdult: 4000.1 }, { Elder: 4501 }, { Baby: '0.25' }]) {
    await json.fill(JSON.stringify({ ...ages, Baby: 0.25, ...changed }))
    await expect(json).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByRole('button', { name: /^Export\b/ })).toBeDisabled()
    await expect(row.getByRole('button', { name: 'Use fields for Human lifespan — Long', exact: true })).toBeDisabled()
  }
  await json.fill(JSON.stringify({ ...ages, Baby: 0.25, Elder: 0 }))
  expect(await exportConfig(page)).toEqual({ ...source, AgeSpanLong: { ...ages, Baby: 0.25, Elder: 0 } })
})
