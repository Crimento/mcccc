import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import type { SettingsRecord } from '../src/lib/config'

const sample = JSON.parse(readFileSync(new URL('../mc_settings.cfg', import.meta.url), 'utf8')) as SettingsRecord

async function importConfig(page: Page, config: SettingsRecord, name = 'tuner.cfg') {
  await page.getByLabel('Import config file').setInputFiles({
    name, mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(config)),
  })
  await expect(page.getByText(name, { exact: true })).toBeAttached()
  await page.locator('[data-category="tuner"]').click()
}

function setting(page: Page, key: string) {
  return page.locator(`article[data-setting="${key}"]`)
}

async function findSetting(page: Page, key: string) {
  await page.getByRole('textbox', { name: 'Search settings' }).fill(key)
  const row = setting(page, key)
  await expect(row).toBeVisible()
  return row
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

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Your game. Your settings.' })).toBeVisible()
})

test('Tuner routes all 22 settings correctly and preserves independent archive and boolean edits through validation and Undo', async ({ page }) => {
  const source = { ...sample, Future_TunerData: { code: '0007', nested: [true, null, 'A,B'] } }
  await importConfig(page, source)
  const group = page.locator('[data-tuner-settings-group]')
  await expect(group.locator('article[data-setting]:visible')).toHaveCount(22)
  const keys = await group.locator('article[data-setting]').evaluateAll(rows => rows.map(row => row.getAttribute('data-setting')!))
  expect(new Set(keys)).toEqual(new Set(Object.keys(sample).filter(key =>
    (key.startsWith('Tuner_') && key !== 'Tuner_Child_Pay_Bills') || key === 'Put_Away_Books_Fix')))
  expect(new Set(keys).size).toBe(22)
  for (const [path, count] of [['Change Interaction Behavior', 12], ['Change Interaction Autonomy', 8], ['Autonomy Scan', 2]] as const) {
    await page.locator(`[data-menu-path="${path}"]`).click()
    await expect(group.locator('article[data-setting]:visible')).toHaveCount(count)
  }
  await page.locator('[data-category="core"]').click()
  await page.locator('[data-menu-path="Money Settings"]').click()
  await expect(page.locator('[data-money-settings-group] [data-setting="Tuner_Child_Pay_Bills"]')).toBeVisible()
  await expect(group.locator('[data-setting="Tuner_Child_Pay_Bills"]')).toHaveCount(0)
  await page.locator('[data-category="tuner"]').click()
  await page.locator('[data-menu-path="Autonomy Scan"]').click()

  const maximum = setting(page, 'Tuner_MaximumArchive')
  const archive = setting(page, 'Tuner_ArchiveInteractions')
  await expect(archive.getByRole('switch')).not.toBeChecked()
  await expect(maximum.getByRole('textbox')).toBeEnabled()
  await expect(maximum.getByRole('textbox')).toHaveValue('50')
  await expect(maximum.getByRole('slider')).toHaveAttribute('aria-valuemin', '0')
  await expect(maximum.getByRole('slider')).toHaveAttribute('aria-valuemax', '200')
  expect(await exportConfig(page)).toEqual(source)
  await maximum.getByRole('slider').press('Home')
  await expect(maximum.getByRole('textbox')).toHaveValue('0')
  expect(await exportConfig(page)).toEqual({ ...source, Tuner_MaximumArchive: 0 })
  await maximum.getByRole('slider').press('End')
  expect(await exportConfig(page)).toEqual({ ...source, Tuner_MaximumArchive: 200 })

  await maximum.getByRole('textbox').fill('201')
  await archive.getByRole('switch').check()
  await expect(maximum.getByRole('textbox')).toHaveValue('201')
  await page.locator('[data-menu-path="Change Interaction Behavior"]').click()
  await setting(page, 'Put_Away_Books_Fix').getByRole('switch').uncheck()
  await expect(maximum).toBeHidden()
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeDisabled()
  await page.setViewportSize({ width: 390, height: 844 })
  await findSetting(page, 'Tuner_MaximumArchive')
  await expect(maximum.getByRole('textbox')).toHaveValue('201')
  await expect(maximum.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  await maximum.getByRole('button', { name: 'Undo Maximum Autonomy Archive', exact: true }).click()
  await expect(maximum.getByRole('textbox')).toHaveValue('50')
  expect(await exportConfig(page)).toEqual({ ...source, Tuner_ArchiveInteractions: true, Put_Away_Books_Fix: false })
  await maximum.getByRole('textbox').fill('0.5')
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeDisabled()
  await maximum.getByRole('textbox').fill('200')
  expect(await exportConfig(page)).toEqual({ ...source, Tuner_MaximumArchive: 200, Tuner_ArchiveInteractions: true, Put_Away_Books_Fix: false })
})

test('partial Tuner imports retain missing fields, unexpected types and untouched archive outliers', async ({ page }) => {
  const outlier = {
    Tuner_MaximumArchive: 250,
    Tuner_ArchiveInteractions: { future: false },
    Tuner_AutoRepair: false,
    Put_Away_Books_Fix: '0001',
    Tuner_Child_Pay_Bills: true,
    Future_TunerData: { nested: [null, '0050', false] },
  }
  await importConfig(page, outlier, 'outlier-tuner.cfg')
  const group = page.locator('[data-tuner-settings-group]')
  await expect(group.locator('article[data-setting]:visible')).toHaveCount(4)
  await expect(setting(page, 'Tuner_MaximumArchive').getByRole('textbox')).toHaveValue('250')
  await expect(setting(page, 'Tuner_MaximumArchive').getByRole('slider')).toBeDisabled()
  await expect(setting(page, 'Tuner_ArchiveInteractions').getByRole('switch')).toHaveCount(0)
  await expect(setting(page, 'Put_Away_Books_Fix').getByRole('textbox')).toHaveValue('0001')
  expect(await exportConfig(page)).toEqual(outlier)
  const repair = setting(page, 'Tuner_AutoRepair')
  await repair.getByRole('switch').check()
  expect(await exportConfig(page)).toEqual({ ...outlier, Tuner_AutoRepair: true })
  await repair.getByRole('button', { name: 'Undo Autonomous Repairs', exact: true }).click()

  const partial = { Tuner_MaximumArchive: '0050', Put_Away_Books_Fix: true, Future_TunerData: outlier.Future_TunerData }
  await importConfig(page, partial, 'partial-tuner.cfg')
  await expect(group.locator('article[data-setting]:visible')).toHaveCount(2)
  await expect(setting(page, 'Tuner_ArchiveInteractions')).toHaveCount(0)
  await expect(setting(page, 'Tuner_MaximumArchive').getByRole('slider')).toHaveCount(0)
  await expect(setting(page, 'Tuner_MaximumArchive').getByRole('textbox')).toHaveValue('0050')
  expect(await exportConfig(page)).toEqual(partial)
  await setting(page, 'Put_Away_Books_Fix').getByRole('switch').uncheck()
  expect(await exportConfig(page)).toEqual({ ...partial, Put_Away_Books_Fix: false })
})
