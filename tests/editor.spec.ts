import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import type { SettingsRecord } from '../src/lib/config'
import { expandVisibleLifespanGroups } from './helpers/lifespans'

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
  await expandVisibleLifespanGroups(page)
  const row = page.locator(`[data-setting="${key}"]`)
  await expect(row).toBeVisible()
  return row
}

async function exportConfig(page: Page): Promise<SettingsRecord> {
  await page.getByRole('button', { name: /^Export config/ }).click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download mc_settings.cfg', exact: true }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('mc_settings.cfg')
  const path = await download.path()
  expect(path).not.toBeNull()
  return JSON.parse(readFileSync(path!, 'utf8')) as SettingsRecord
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Your game. Your settings.' })).toBeVisible()
})

test('age selections are independent and export preserves unknown codes, keys and types', async ({ page }) => {
  const source = {
    ...sample,
    Relationship_MoveinAges: 'YA,A,E,FUTURE',
    Future_Settings: { numericString: '0012', nested: [[false, null], [2, '3']] },
  }
  await importConfig(page, source)
  const row = await findSetting(page, 'Relationship_MoveinAges')
  const youngAdult = row.getByRole('checkbox', { name: /: Young adult$/ })
  const adult = row.getByRole('checkbox', { name: /: Adult$/ })
  const elder = row.getByRole('checkbox', { name: /: Elder$/ })
  await expect(youngAdult).toBeChecked()
  await expect(adult).toBeChecked()
  await expect(elder).toBeChecked()
  await adult.uncheck()
  await expect(youngAdult).toBeChecked()
  await expect(elder).toBeChecked()
  await expect(row.getByRole('checkbox', { name: /FUTURE \(from file\)/ })).toBeChecked()

  const exported = await exportConfig(page)
  expect(exported).toEqual({ ...source, Relationship_MoveinAges: 'YA,E,FUTURE' })
})

test('unknown text and nested age values can be edited without coercing other values', async ({ page }) => {
  const source = { ...sample, Future_Text: '0012' }
  await importConfig(page, source)
  const unknownRow = await findSetting(page, 'Future_Text')
  await expect(unknownRow.getByText('Not in reference', { exact: true })).toBeVisible()
  await unknownRow.getByRole('textbox').fill('0025')

  const ages = await findSetting(page, 'AgeSpanNormal')
  await ages.getByRole('textbox', { name: /: Adult$/, exact: false }).fill('42')

  expect(await exportConfig(page)).toEqual({
    ...source,
    Future_Text: '0025',
    AgeSpanNormal: { ...(sample.AgeSpanNormal as SettingsRecord), Adult: 42 },
  })
})

test('invalid numeric input blocks export even while filtered away and undo restores it', async ({ page }) => {
  await importConfig(page)
  const row = await findSetting(page, 'Game_Time_Speed')
  await row.getByRole('textbox').fill('')
  await expect(row.getByRole('alert')).toContainText('Enter a number')
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeDisabled()

  await findSetting(page, 'Relationship_MoveinAges')
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeDisabled()
  await findSetting(page, 'Game_Time_Speed')
  await row.getByRole('button', { name: /^Undo / }).click()
  await expect(row.getByRole('textbox')).toHaveValue(String(sample.Game_Time_Speed))
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeEnabled()
  expect(await exportConfig(page)).toEqual(sample)
})

test('marriage prompts have an interruption note and preset review changes only its declared settings', async ({ page }) => {
  await importConfig(page)
  const marriage = await findSetting(page, 'Marriage_ManualConfirmation')
  await expect(marriage.getByText('May interrupt play', { exact: true })).toBeVisible()
  await marriage.getByRole('switch', { name: 'Manual Confirmation', exact: true }).check()

  await page.getByRole('button', { name: 'Explore presets', exact: true }).click()
  let dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: /^Review random events/ }).click()
  await expect(dialog.getByText('1 setting will change', { exact: true })).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Apply 1 change', exact: true })).toBeEnabled()
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()
  expect(await exportConfig(page)).toEqual({ ...sample, Marriage_ManualConfirmation: true })

  await page.getByRole('button', { name: 'Explore presets', exact: true }).click()
  dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Apply 1 change', exact: true }).click()
  expect(await exportConfig(page)).toEqual({
    ...sample,
    Marriage_ManualConfirmation: true,
    Pregnancy_ManualConfirmation: true,
  })
})

test('a malformed import leaves the current configuration and edits intact', async ({ page }) => {
  await importConfig(page)
  const row = await findSetting(page, 'Game_Time_Speed')
  await row.getByRole('textbox').fill('50')
  await page.getByLabel('Import config file').setInputFiles({
    name: 'broken.cfg',
    mimeType: 'application/json',
    buffer: Buffer.from('{"Game_Time_Speed":'),
  })
  await expect(page.getByRole('alert')).toContainText('not valid JSON')
  await expect(row.getByRole('textbox')).toHaveValue('50')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(await exportConfig(page)).toEqual({ ...sample, Game_Time_Speed: 50 })
})

test('a saved draft restores edits and preserves the imported baseline for undo', async ({ page }) => {
  const source = { ...sample, Future_Text: 'still here' }
  await importConfig(page, source)
  let row = await findSetting(page, 'Relationship_MoveinAges')
  await row.getByRole('checkbox', { name: /: Adult$/ }).uncheck()
  await expect(page.getByText('Draft saved in this browser', { exact: true })).toBeVisible()

  await page.reload()
  await page.getByRole('button', { name: 'Resume draft', exact: true }).click()
  row = await findSetting(page, 'Relationship_MoveinAges')
  await expect(row.getByRole('checkbox', { name: /: Adult$/ })).not.toBeChecked()
  expect(await exportConfig(page)).toEqual({ ...source, Relationship_MoveinAges: 'YA,E' })

  await row.getByRole('button', { name: /^Undo / }).click()
  expect(await exportConfig(page)).toEqual(source)
})
