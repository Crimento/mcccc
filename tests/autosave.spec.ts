import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import type { SettingsRecord } from '../src/lib/config'

const sample = JSON.parse(readFileSync(new URL('../mc_settings.cfg', import.meta.url), 'utf8')) as SettingsRecord
let importSequence = 0

function setting(page: Page, key: string) {
  return page.locator(`[data-setting="Autosave_${key}"]`)
}

async function openAutosave(page: Page) {
  await page.locator('[data-category="core"]').click()
  await page.locator('[data-menu-path="Auto-Save"]').click()
}

async function importConfig(page: Page, config: SettingsRecord, replaceExisting = false) {
  const name = `autosave-${++importSequence}.cfg`
  await page.getByLabel('Import config file').setInputFiles({
    name, mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(config)),
  })
  if (replaceExisting) {
    await page.getByRole('button', { name: 'Import new configuration', exact: true }).click()
  }
  await expect(page.getByText(name, { exact: true })).toBeVisible()
  await openAutosave(page)
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

test('autosave dependencies preserve saved values and can be enabled from a filtered setting', async ({ page }) => {
  const source = {
    ...sample,
    Autosave_Enabled: false,
    Autosave_IntervalAmount: 7,
    Autosave_MaxSaveNumber: 4,
    Autosave_Name: '0007 family',
    Autosave_HexSlotNumber: '00aB01',
    Autosave_CurrentSaveNumber: 3,
  }
  await importConfig(page, source)
  await expect(page.locator('article[data-setting]:visible')).toHaveCount(7)
  const enabled = setting(page, 'Enabled').getByRole('switch')
  await expect(enabled).not.toBeChecked()
  await expect(enabled).toBeEnabled()
  await expect(setting(page, 'ShowConfirmation').getByRole('switch')).toBeChecked()
  await expect(setting(page, 'ShowConfirmation').getByRole('switch')).toBeDisabled()
  await expect(setting(page, 'IntervalType').getByRole('combobox')).toBeDisabled()
  for (const key of ['IntervalAmount', 'MaxSaveNumber', 'Name', 'HexSlotNumber']) {
    await expect(setting(page, key).getByRole('textbox')).toBeDisabled()
  }
  expect(await exportConfig(page)).toEqual(source)

  await page.getByRole('textbox', { name: 'Search settings' }).fill('Autosave_Name')
  await expect(setting(page, 'Enabled')).toBeAttached()
  await expect(setting(page, 'Enabled')).toBeHidden()
  await page.getByRole('button', { name: 'Turn on auto-save', exact: true }).click()
  await expect(setting(page, 'Name').getByRole('textbox')).toBeEnabled()
  await setting(page, 'Name').getByRole('textbox').fill('  Family 007  ')
  await openAutosave(page)
  await expect(enabled).toBeChecked()
  await expect(setting(page, 'IntervalAmount').getByRole('textbox')).toHaveValue('7')
  await expect(setting(page, 'MaxSaveNumber').getByRole('textbox')).toHaveValue('4')
  await setting(page, 'HexSlotNumber').getByRole('textbox').fill('00ABcd')
  await setting(page, 'ShowConfirmation').getByRole('switch').uncheck()
  await enabled.uncheck()
  await expect(setting(page, 'Name').getByRole('textbox')).toBeDisabled()
  await expect(setting(page, 'Name').getByRole('textbox')).toHaveValue('  Family 007  ')
  await expect(setting(page, 'ShowConfirmation').getByRole('switch')).not.toBeChecked()
  expect(await exportConfig(page)).toEqual({
    ...source, Autosave_Name: '  Family 007  ', Autosave_HexSlotNumber: '00ABcd', Autosave_ShowConfirmation: false,
  })
})

test('all four interval choices export their confirmed codes and preserve unknown imported choices until changed', async ({ page }) => {
  const source = { ...sample, Autosave_Enabled: true, Autosave_IntervalType: 'FUTURE_INTERVAL', Autosave_IntervalAmount: 9 }
  await importConfig(page, source)
  const interval = setting(page, 'IntervalType').getByRole('combobox')
  await expect(interval).toContainText('FUTURE_INTERVAL (from file)')
  expect(await exportConfig(page)).toEqual(source)

  for (const [code, label] of [
    ['PM', 'Pre-Midnight Alarm'], ['RH', 'Real Hours'], ['SD', 'Sim Day'], ['SH', 'Sim Hour'],
  ] as const) {
    await interval.click()
    await page.getByRole('option', { name: label, exact: true }).click()
    await expect(setting(page, 'IntervalAmount').getByRole('textbox')).toBeEnabled()
    await expect(setting(page, 'IntervalAmount').getByRole('textbox')).toHaveValue('9')
    expect(await exportConfig(page)).toEqual({ ...source, Autosave_IntervalType: code })
  }
})

test('integer autosave bounds retain invalid drafts through disabling and navigation until each setting is undone', async ({ page }) => {
  const source = { ...sample, Autosave_Enabled: true }
  await importConfig(page, source)
  const amount = setting(page, 'IntervalAmount')
  const maximum = setting(page, 'MaxSaveNumber')
  await expect(amount.getByRole('slider')).toHaveAttribute('aria-valuemin', '1')
  await expect(amount.getByRole('slider')).toHaveAttribute('aria-valuemax', '24')
  await expect(maximum.getByRole('slider')).toHaveAttribute('aria-valuemin', '1')
  await expect(maximum.getByRole('slider')).toHaveAttribute('aria-valuemax', '10')
  await amount.getByRole('slider').press('End')
  await maximum.getByRole('slider').press('End')
  expect(await exportConfig(page)).toEqual({ ...source, Autosave_IntervalAmount: 24, Autosave_MaxSaveNumber: 10 })

  await amount.getByRole('textbox').fill('25')
  await maximum.getByRole('textbox').fill('0')
  await setting(page, 'Enabled').getByRole('switch').uncheck()
  await expect(amount.getByRole('textbox')).toBeDisabled()
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeDisabled()
  await setting(page, 'Enabled').getByRole('switch').check()
  await expect(amount.getByRole('textbox')).toHaveValue('25')
  await expect(maximum.getByRole('textbox')).toHaveValue('0')
  await page.locator('[data-menu-path="Money Settings"]').click()
  await expect(amount).toBeAttached()
  await expect(amount).toBeHidden()
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeDisabled()

  await page.getByRole('textbox', { name: 'Search settings' }).fill('Autosave_IntervalAmount')
  await expect(amount.getByRole('textbox')).toHaveValue('25')
  await expect(amount.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  await amount.getByRole('button', { name: /^Undo / }).click()
  await expect(amount.getByRole('textbox')).toHaveValue('1')
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeDisabled()
  await page.getByRole('textbox', { name: 'Search settings' }).fill('Autosave_MaxSaveNumber')
  await maximum.getByRole('textbox').fill('1.5')
  await expect(maximum.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  await maximum.getByRole('button', { name: /^Undo / }).click()
  await expect(maximum.getByRole('textbox')).toHaveValue('1')
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeEnabled()
  expect(await exportConfig(page)).toEqual(source)
})

test('partial and malformed autosave imports retain actual keys, types and their hidden internal counter', async ({ page }) => {
  const partial = {
    Autosave_Name: 'Only name', Autosave_IntervalAmount: 8, Autosave_CurrentSaveNumber: 3,
    Autosave_FutureRule: { token: '0007', data: [null, false] },
  }
  await importConfig(page, partial)
  await expect(page.locator('article[data-setting]:visible')).toHaveCount(2)
  await expect(setting(page, 'Enabled')).toHaveCount(0)
  await expect(setting(page, 'CurrentSaveNumber')).toHaveCount(0)
  await expect(setting(page, 'Name').getByRole('textbox')).toBeEnabled()
  await setting(page, 'Name').getByRole('textbox').fill('Renamed only')
  expect(await exportConfig(page)).toEqual({ ...partial, Autosave_Name: 'Renamed only' })

  const malformed = {
    Autosave_Enabled: 'false', Autosave_ShowConfirmation: { enabled: false },
    Autosave_IntervalType: 17, Autosave_IntervalAmount: '007', Autosave_MaxSaveNumber: null,
    Autosave_Name: ['future', null], Autosave_HexSlotNumber: 1111, Autosave_CurrentSaveNumber: '0003',
    Future_Autosave: { keep: [false, null, '0007'] },
  }
  await importConfig(page, malformed, true)
  await expect(page.locator('article[data-setting]:visible')).toHaveCount(7)
  await expect(setting(page, 'Enabled').getByRole('switch')).toHaveCount(0)
  await expect(setting(page, 'Enabled').getByRole('textbox')).toHaveValue('false')
  await expect(setting(page, 'IntervalType').getByRole('combobox')).toHaveCount(0)
  await expect(setting(page, 'IntervalType').getByRole('textbox')).toHaveValue('17')
  await expect(setting(page, 'IntervalAmount').getByRole('slider')).toHaveCount(0)
  await expect(setting(page, 'IntervalAmount').getByRole('textbox')).toHaveValue('007')
  await expect(setting(page, 'IntervalAmount').getByRole('textbox')).toBeEnabled()
  await expect(setting(page, 'CurrentSaveNumber')).toHaveCount(0)
  expect(await exportConfig(page)).toEqual(malformed)
})
