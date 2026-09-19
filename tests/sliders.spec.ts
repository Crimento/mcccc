import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import type { SettingsRecord } from '../src/lib/config'
import { expandVisibleAppearanceGroups } from './helpers/appearance-templates'

const sample = JSON.parse(readFileSync(new URL('../mc_settings.cfg', import.meta.url), 'utf8')) as SettingsRecord

async function importConfig(page: Page, config: SettingsRecord = sample) {
  await page.getByLabel('Import config file').setInputFiles({
    name: 'mc_settings.cfg',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(config)),
  })
  await expect(page.getByText('Imported file', { exact: false })).toBeVisible()
}

async function findSetting(page: Page, key: string) {
  await page.getByRole('textbox', { name: 'Search settings' }).fill(key)
  await expandVisibleAppearanceGroups(page)
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

test('dark editor provides keyboard and precise controls for CSV appearance limits', async ({ page }) => {
  await expect(page.locator('html')).toHaveClass(/dark/)
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark')
  await importConfig(page)
  const row = await findSetting(page, 'Appearance_FemaleFitLimits')
  await expect(row.getByRole('slider')).toHaveCount(2)

  const minimum = row.getByRole('slider', { name: /: Minimum$/ })
  const maximum = row.getByRole('slider', { name: /: Maximum$/ })
  await expect(minimum).toHaveAttribute('aria-valuenow', '-100')
  await expect(maximum).toHaveAttribute('aria-valuenow', '100')
  await minimum.focus()
  await minimum.press('ArrowRight')
  await expect(row.getByRole('textbox', { name: /: Minimum$/ })).toHaveValue('-99')
  await row.getByRole('textbox', { name: /: Maximum$/ }).fill('90')
  await expect(maximum).toHaveAttribute('aria-valuenow', '90')

  expect(await exportConfig(page)).toEqual({ ...sample, Appearance_FemaleFitLimits: '-99,90' })
})

test('nested body ranges retain numeric arrays after slider and precise edits', async ({ page }) => {
  await importConfig(page)
  const row = await findSetting(page, 'Appearance_AF_Template')
  const minimum = row.getByRole('slider', { name: /: Belly: Minimum$/ })
  const maximum = row.getByRole('slider', { name: /: Belly: Maximum$/ })
  await expect(minimum).toHaveAttribute('aria-valuenow', '-100')
  await maximum.focus()
  await maximum.press('ArrowLeft')
  await expect(row.getByRole('textbox', { name: /: Belly: Maximum$/ })).toHaveValue('99')
  await row.getByRole('textbox', { name: /: Belly: Minimum$/ }).fill('-75')
  await expect(minimum).toHaveAttribute('aria-valuenow', '-75')

  expect(await exportConfig(page)).toEqual({
    ...sample,
    Appearance_AF_Template: {
      ...(sample.Appearance_AF_Template as SettingsRecord),
      Belly: [-75, 99],
    },
  })
})

test('bounded scalar slider stays in sync and rejects invalid values until corrected or undone', async ({ page }) => {
  await importConfig(page)
  const row = await findSetting(page, 'Pregnancy_Duration')
  const slider = row.getByRole('slider')
  const precise = row.getByRole('textbox')
  await expect(slider).toHaveAttribute('aria-valuemin', '1')
  await expect(slider).toHaveAttribute('aria-valuemax', '120')
  await slider.focus()
  await slider.press('ArrowRight')
  await expect(precise).toHaveValue('4')

  await precise.fill('121')
  await expect(precise).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeDisabled()
  await precise.fill('12')
  await expect(slider).toHaveAttribute('aria-valuenow', '12')
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeEnabled()
  expect(await exportConfig(page)).toEqual({ ...sample, Pregnancy_Duration: 12 })

  await precise.fill('0')
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeDisabled()
  await row.getByRole('button', { name: /^Undo / }).click()
  await expect(row.getByRole('textbox')).toHaveValue(String(sample.Pregnancy_Duration))
  await expect(row.getByRole('slider')).toHaveAttribute('aria-valuenow', String(sample.Pregnancy_Duration))
  expect(await exportConfig(page)).toEqual(sample)
})

test('unknown numeric pairs keep generic controls and round-trip without invented bounds', async ({ page }) => {
  const source = { ...sample, Future_Pair: [-250, 500], Future_Csv: '-100,100' }
  await importConfig(page, source)
  const pair = await findSetting(page, 'Future_Pair')
  await pair.getByRole('button', { name: /^Edit details for/ }).click()
  await expect(pair.getByRole('slider')).toHaveCount(0)
  await expect(pair.getByRole('textbox', { name: /: Item 1$/ })).toHaveValue('-250')
  await expect(pair.getByRole('textbox', { name: /: Item 2$/ })).toHaveValue('500')

  const csv = await findSetting(page, 'Future_Csv')
  await expect(csv.getByRole('slider')).toHaveCount(0)
  await expect(csv.getByRole('textbox')).toHaveValue('-100,100')
  expect(await exportConfig(page)).toEqual(source)
})

test('custom template ranges may exceed the slider domain while CSV limits stay bounded', async ({ page }) => {
  await importConfig(page)
  const template = await findSetting(page, 'Appearance_AF_Template')
  await template.getByRole('textbox', { name: /: Belly: Minimum$/ }).fill('-150')
  await template.getByRole('textbox', { name: /: Belly: Maximum$/ }).fill('180')
  await expect(template.getByRole('slider', { name: /: Belly: Minimum$/ })).toBeDisabled()
  await expect(template.getByRole('slider', { name: /: Belly: Maximum$/ })).toBeDisabled()
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeEnabled()
  const expected = {
    ...sample,
    Appearance_AF_Template: {
      ...(sample.Appearance_AF_Template as SettingsRecord),
      Belly: [-150, 180],
    },
  }
  expect(await exportConfig(page)).toEqual(expected)

  const limits = await findSetting(page, 'Appearance_FemaleFitLimits')
  await limits.getByRole('textbox', { name: /: Minimum$/ }).fill('-101')
  await expect(limits.getByRole('textbox', { name: /: Minimum$/ })).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeDisabled()
  await limits.getByRole('button', { name: /^Undo / }).click()
  expect(await exportConfig(page)).toEqual(expected)
})
