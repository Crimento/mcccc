import { readFileSync } from 'node:fs'
import { expect, test, type Locator, type Page } from '@playwright/test'
import type { SettingsRecord } from '../src/lib/config'

const sample = JSON.parse(readFileSync(new URL('../mc_settings.cfg', import.meta.url), 'utf8')) as SettingsRecord

async function importConfig(page: Page, config: SettingsRecord = sample) {
  await page.goto('/')
  await page.getByLabel('Import config file').setInputFiles({
    name: 'settings-review.cfg', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(config)),
  })
  await expect(page.getByText('settings-review.cfg', { exact: true })).toBeAttached()
}

async function findSetting(page: Page, key: string) {
  await page.getByRole('textbox', { name: 'Search settings' }).fill(key)
  const row = page.locator(`article[data-setting="${key}"]`)
  await expect(row).toBeVisible()
  return row
}

async function choose(page: Page, row: Locator, label: string) {
  await row.getByRole('combobox').click()
  await page.getByRole('option', { name: label, exact: true }).click()
}

async function exportConfig(page: Page): Promise<SettingsRecord> {
  await page.getByRole('button', { name: /^Export\b/ }).click()
  const downloaded = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download mc_settings.cfg', exact: true }).click()
  const path = await (await downloaded).path()
  expect(path).not.toBeNull()
  await expect(page.getByRole('dialog')).toBeHidden()
  return JSON.parse(readFileSync(path!, 'utf8')) as SettingsRecord
}

test('the complete review exposes all 439 editable settings once and keeps untouched data and template trigger codes intact', async ({ page }) => {
  await importConfig(page)
  await page.getByRole('button', { name: 'Show all', exact: true }).click()
  const expand = page.getByRole('button', {
    name: /^Edit details for (?:(?:Humans|Cats|Dogs|Horses) lifespans|(?:Female|Male) appearance templates)$/,
  })
  while (await expand.count()) await expand.first().click()
  const rows = page.locator('article[data-setting]:visible')
  await expect(rows).toHaveCount(439)
  const keys = await rows.evaluateAll(nodes => nodes.map(node => node.getAttribute('data-setting')!))
  expect(new Set(keys).size).toBe(439)
  expect(new Set(keys)).toEqual(new Set(Object.keys(sample).filter(key =>
    !['Autosave_CurrentSaveNumber', 'DP_OneTimeUpdate', 'DP_UseOnly'].includes(key))))
  const addedGroups = page.locator('[data-settings-group]')
  await expect(addedGroups).toHaveCount(16)
  await expect(addedGroups.locator('article[data-setting]:visible')).toHaveCount(71)
  expect(new Set(await addedGroups.locator('article[data-setting]').evaluateAll(nodes =>
    nodes.map(node => node.getAttribute('data-setting')))).size).toBe(71)
  expect(await exportConfig(page)).toEqual(sample)

  const appearance = await findSetting(page, 'Appearance_ApplyTemplate')
  await expect(appearance.getByRole('combobox')).toHaveText('Manual')
  await choose(page, appearance, 'On age-up')
  expect(await exportConfig(page)).toEqual({ ...sample, Appearance_ApplyTemplate: 'A' })
  await choose(page, appearance, 'On zone-in')
  expect(await exportConfig(page)).toEqual({ ...sample, Appearance_ApplyTemplate: 'Z' })
  await appearance.getByRole('button', { name: /^Undo / }).click()
  await expect(appearance.getByRole('combobox')).toHaveText('Manual')
  expect(await exportConfig(page)).toEqual(sample)
})

test('option-name search and grouped controls preserve invalid drafts and independent changes until Undo', async ({ page }) => {
  await importConfig(page)
  const rest = await findSetting(page, 'Woohoo_AutonomousMinRestTime')
  await expect(page.locator('[data-settings-group] [data-setting="Woohoo_AutonomousMinRestTime"]')).toBeVisible()
  await rest.getByRole('textbox').fill('25')
  const autonomous = await findSetting(page, 'Woohoo_AutonomousWoohoo')
  await autonomous.getByRole('switch').uncheck()
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeDisabled()
  await page.getByRole('textbox', { name: 'Search settings' }).fill('Bear Night')
  await expect(page.locator('article[data-setting]:visible')).toHaveCount(1)
  await expect(page.locator('[data-setting="Population_BarNights"]')).toBeVisible()
  await expect(rest).toBeHidden()
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeDisabled()
  await page.setViewportSize({ width: 390, height: 844 })
  await findSetting(page, 'Woohoo_AutonomousMinRestTime')
  await expect(rest.getByRole('textbox')).toHaveValue('25')
  await expect(rest.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  await rest.getByRole('button', { name: /^Undo / }).click()
  await expect(rest.getByRole('textbox')).toHaveValue(String(sample.Woohoo_AutonomousMinRestTime))
  expect(await exportConfig(page)).toEqual({ ...sample, Woohoo_AutonomousWoohoo: false })
})

test('partial imports preserve unknown triggers, raw types and independent legacy/current offspring gender keys', async ({ page }) => {
  const source = {
    Appearance_ApplyTemplate: 'FUTURE_TRIGGER',
    Pregnancy_OffspringGender: 'M,F,FUTURE_GENDER',
    Pregnancy_OffspringGenderPercents: { M: 25, F: 75, Future: { code: '0007' } },
    Game_Time_Speed: '00025',
    Pause_on_Zone: false,
    Future_ReviewData: { nested: [null, false, 'M,F'] },
  }
  await importConfig(page, source)
  await expect(page.locator('article[data-setting]')).toHaveCount(Object.keys(source).length)
  expect(await exportConfig(page)).toEqual(source)
  const speed = await findSetting(page, 'Game_Time_Speed')
  await expect(speed.getByRole('textbox')).toHaveValue('00025')
  await expect(speed.getByRole('slider')).toHaveCount(0)
  const appearance = await findSetting(page, 'Appearance_ApplyTemplate')
  await expect(appearance.getByRole('combobox')).toContainText('FUTURE_TRIGGER (from file)')
  await choose(page, appearance, 'On zone-in')
  expect(await exportConfig(page)).toEqual({ ...source, Appearance_ApplyTemplate: 'Z' })
  await appearance.getByRole('button', { name: /^Undo / }).click()
  await expect(appearance.getByRole('combobox')).toContainText('FUTURE_TRIGGER (from file)')
  await choose(page, appearance, 'Manual')

  const legacy = await findSetting(page, 'Pregnancy_OffspringGender')
  await expect(page.locator('[data-offspring-settings-group] [data-setting="Pregnancy_OffspringGender"]')).toBeVisible()
  await expect(legacy.getByRole('checkbox', { name: /: Male$/ })).toBeChecked()
  await expect(legacy.getByRole('checkbox', { name: /: Female$/ })).toBeChecked()
  await expect(legacy.getByRole('checkbox', { name: /FUTURE_GENDER \(from file\)/ })).toBeChecked()
  await legacy.getByRole('checkbox', { name: /: Male$/ }).uncheck()
  expect(await exportConfig(page)).toEqual({ ...source, Appearance_ApplyTemplate: '', Pregnancy_OffspringGender: 'F,FUTURE_GENDER' })
  await legacy.getByRole('button', { name: /^Undo / }).click()
  expect(await exportConfig(page)).toEqual({ ...source, Appearance_ApplyTemplate: '' })
})
