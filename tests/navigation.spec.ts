import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import type { SettingsRecord } from '../src/lib/config'
import { expandVisibleLifespanGroups } from './helpers/lifespans'
import { expandVisibleAppearanceGroups } from './helpers/appearance-templates'

const sample = JSON.parse(readFileSync(new URL('../mc_settings.cfg', import.meta.url), 'utf8')) as SettingsRecord

async function importConfig(page: Page, config: SettingsRecord = sample) {
  await page.getByLabel('Import config file').setInputFiles({
    name: 'navigation.cfg',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(config)),
  })
  await expect(page.getByText('navigation.cfg', { exact: true })).toBeVisible()
}

async function openAgeDurations(page: Page) {
  await page.locator('[data-category="core"]').click()
  await page.locator('[data-menu-path="Age"]').click()
  await page.locator('[data-menu-path="Age/Age Span Durations"]').click()
  await expandVisibleLifespanGroups(page)
  await expect(page.locator('#list-title')).toContainText('Age Span Durations')
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

test('nested age menus include descendants and global menu-name search restores the selected branch', async ({ page }) => {
  await page.locator('[data-category="core"]').click()
  await page.locator('[data-menu-path="Age"]').click()
  await expandVisibleLifespanGroups(page)
  await expect(page.locator('[data-setting="AgeStopHuman"]')).toBeVisible()
  await expect(page.locator('[data-setting="AgeSpanNormal"]')).toBeVisible()
  await page.locator('[data-menu-path="Age/Age Span Durations"]').click()
  await expect(page.locator('#list-title')).toContainText('Age Span Durations')
  const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb', exact: true })
  await expect(breadcrumb.getByRole('link', { name: 'Age', exact: true })).toBeVisible()
  await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText('Age Span Durations')
  await expect(page.locator('[data-setting="AgeStopHuman"]')).toBeHidden()
  await expect(page.locator('[data-setting="Game_Time_Speed"]')).toBeHidden()

  const keys = await page.locator('article[data-setting]:visible').evaluateAll(rows => rows.map(row => row.getAttribute('data-setting')!))
  const humans = ['AgeSpanShort', 'AgeSpanNormal', 'AgeSpanLong']
  const pets = Object.keys(sample).filter(key => /^AgeSpan(?:Cat|Dog|Horse)/.test(key))
  expect(new Set(keys)).toEqual(new Set([...humans, ...pets]))
  expect(Math.max(...humans.map(key => keys.indexOf(key))))
    .toBeLessThan(Math.min(...pets.map(key => keys.indexOf(key))))

  await page.getByRole('textbox', { name: 'Search settings' }).fill('MCCC Settings Gameplay Motive Decay')
  await expect(page.locator('[data-setting="MotiveDecay_Sims"]')).toBeVisible()
  await expect(page.locator('[data-setting="MotiveDecay_Horses"]')).toBeVisible()
  await expect(page.locator('[data-setting="AgeSpanNormal"]')).toBeHidden()
  await page.getByRole('button', { name: 'Clear search', exact: true }).click()
  await expect(page.locator('#list-title')).toContainText('Age Span Durations')
  await expect(page.locator('[data-setting="AgeSpanNormal"]')).toBeVisible()
  await expect(page.locator('[data-setting="MotiveDecay_Sims"]')).toBeHidden()
})

test('invalid edits stay mounted through module, submenu and global search navigation', async ({ page }) => {
  await importConfig(page)
  await page.locator('[data-category="core"]').click()
  await page.locator('[data-menu-path="Gameplay"]').click()
  const speed = page.locator('[data-setting="Game_Time_Speed"]')
  await expect(speed).toBeVisible()
  await speed.getByRole('textbox').fill('')
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeDisabled()

  await page.getByRole('button', { name: /^Occult\b/ }).click()
  await expect(speed).toBeAttached()
  await expect(speed).toBeHidden()
  await expect(speed.getByRole('textbox', { includeHidden: true })).toHaveValue('')
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeDisabled()
  await openAgeDurations(page)
  await page.getByRole('textbox', { name: 'Search settings' }).fill('Game_Time_Speed')
  await expect(speed).toBeVisible()
  await expect(speed.getByRole('textbox')).toHaveValue('')
  await expect(speed.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  await page.getByRole('button', { name: 'Clear search', exact: true }).click()
  await expect(page.locator('#list-title')).toContainText('Age Span Durations')
  await expect(speed).toBeHidden()
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeDisabled()

  await page.getByRole('button', { name: 'Show fields to fix', exact: true }).click()
  await expect(speed).toBeVisible()
  await expect(speed.getByRole('textbox')).toHaveValue('')
  await speed.getByRole('button', { name: /^Undo / }).click()
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeEnabled()
  expect(await exportConfig(page)).toEqual(sample)
})

test('navigation resets expanded pages and keeps unmatched settings reachable without losing data', async ({ page }) => {
  const source = { ...sample, Future_Navigation_Unknown: { numericString: '0012', nested: [true, null, 3] } }
  const internalKeys = new Set(['Autosave_CurrentSaveNumber', 'DP_OneTimeUpdate', 'DP_UseOnly'])
  const editableKeys = Object.keys(source).filter(key => !internalKeys.has(key))
  await importConfig(page, source)
  await expandVisibleLifespanGroups(page)
  const visibleRows = page.locator('article[data-setting]:visible')
  await expect(visibleRows).toHaveCount(50)
  await page.getByRole('button', { name: 'Show all', exact: true }).click()
  await expandVisibleAppearanceGroups(page)
  await expect(visibleRows).toHaveCount(editableKeys.length)
  const allKeys = await visibleRows.evaluateAll(rows => rows.map(row => row.getAttribute('data-setting')!))
  expect(new Set(allKeys)).toEqual(new Set(editableKeys))

  await page.locator('[data-category="core"]').click()
  await expect(visibleRows).toHaveCount(50)
  await page.getByRole('button', { name: 'Show all', exact: true }).click()
  await page.locator('[data-menu-path="Age"]').click()
  await page.locator('[data-menu-path="Age/Age Span Durations"]').click()
  // Clicking the already-active root module must clear its submenu and reset pagination.
  await page.locator('[data-category="core"]').click()
  await expect(page.locator('#list-title')).toContainText('MCCC Settings')
  await expect(visibleRows).toHaveCount(50)
  await page.getByRole('button', { name: /^All settings\b/ }).click()
  await expect(visibleRows).toHaveCount(50)

  await page.getByRole('textbox', { name: 'Search settings' }).fill('Future_Navigation_Unknown')
  await expect(page.locator('[data-setting="Future_Navigation_Unknown"]')).toBeVisible()
  await page.getByRole('button', { name: /^Other settings\b/ }).click()
  await expect(page.getByRole('textbox', { name: 'Search settings' })).toHaveValue('')
  await expect(page.locator('[data-setting="Future_Navigation_Unknown"]')).toBeVisible()
  for (const key of internalKeys) await expect(page.locator(`[data-setting="${key}"]`)).toHaveCount(0)
  expect(await exportConfig(page)).toEqual(source)
})
