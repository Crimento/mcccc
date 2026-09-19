import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import type { SettingsRecord } from '../src/lib/config'

const nonDefaultToggle = (page: Page) => page.getByRole('button', { name: /^Non-default only/ })
const modifiedToggle = (page: Page) => page.getByRole('button', { name: /^Modified only/ })
const row = (page: Page, key: string) => page.locator(`[data-setting="${key}"]`)
const badge = (page: Page, key: string, status: 'different' | 'unknown') =>
  page.locator(`[data-default-key="${key}"][data-default-status="${status}"]`)
const humanDefault = {
  Baby: 0, Infant: 0, Toddler: 0, Child: 0, Teen: 0, YoungAdult: 0, Adult: 0, Elder: 0,
}

async function importConfig(page: Page, source: SettingsRecord) {
  await page.getByLabel('Import config file').setInputFiles({
    name: 'default-comparison.cfg', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(source)),
  })
  await expect(page.getByText('default-comparison.cfg', { exact: true })).toBeVisible()
}

async function exportConfig(page: Page): Promise<SettingsRecord> {
  await page.getByRole('button', { name: /^Export\b/ }).click()
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download mc_settings.cfg', exact: true }).click()
  const path = await (await pending).path()
  expect(path).not.toBeNull()
  await expect(page.getByRole('dialog')).toBeHidden()
  return JSON.parse(readFileSync(path!, 'utf8')) as SettingsRecord
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 })
  await page.goto('/#/settings')
  await expect(page.locator('#list-title')).toContainText('All settings')
})

test('imported nondefaults are identified before editing, while CSV order and unknown defaults preserve the file', async ({ page }) => {
  await expect(nonDefaultToggle(page)).toHaveText(/Non-default only\s*0$/)
  await expect(page.locator('[data-default-summary]')).toContainText('0 settings differ from MCCC defaults')
  const source = {
    Game_Time_Speed: 50,
    Pause_on_Zone: true,
    Show_Notifications: true,
    Population_BarNights: 'SI,LA,KN,GH,AL,BE,GU',
    Future_Default_Review: { token: '0007', items: [null, false, '900719925474099312345'] },
    Autosave_CurrentSaveNumber: '0042',
  }
  await importConfig(page, source)
  await expect(nonDefaultToggle(page)).toHaveText(/Non-default only\s*2$/)
  await expect(modifiedToggle(page)).toHaveText(/Modified only\s*0$/)
  await expect(page.locator('[data-default-summary]')).toContainText('2 settings differ from MCCC defaults')
  await expect(page.locator('[data-default-summary]')).toContainText(/1 default(?: is)? unknown/)
  await expect(badge(page, 'Game_Time_Speed', 'different')).toHaveText('Non-default')
  await expect(badge(page, 'Pause_on_Zone', 'different')).toHaveText('Non-default')
  await expect(badge(page, 'Future_Default_Review', 'unknown')).toHaveText('Default unknown')
  await expect(badge(page, 'Show_Notifications', 'different')).toHaveCount(0)
  await expect(badge(page, 'Population_BarNights', 'different')).toHaveCount(0)
  await expect(row(page, 'Game_Time_Speed').getByRole('button', { name: /^Undo / })).toHaveCount(0)

  await nonDefaultToggle(page).click()
  await expect(row(page, 'Game_Time_Speed')).toBeVisible()
  await expect(row(page, 'Pause_on_Zone')).toBeVisible()
  for (const key of ['Show_Notifications', 'Population_BarNights', 'Future_Default_Review']) {
    await expect(row(page, key)).toBeHidden()
  }
  await expect(page.locator('article[data-setting]:visible')).toHaveCount(2)
  expect(await exportConfig(page)).toEqual(source)
})

test('returning to an MCCC default is still an edit, and Undo restores the imported nondefault', async ({ page }) => {
  const source = { Game_Time_Speed: 50, Pause_on_Zone: false }
  await importConfig(page, source)
  const speed = row(page, 'Game_Time_Speed')
  await nonDefaultToggle(page).click()
  await speed.getByRole('textbox').fill('25')
  await expect(nonDefaultToggle(page)).toHaveText(/Non-default only\s*0$/)
  await expect(modifiedToggle(page)).toHaveText(/Modified only\s*1$/)
  await expect(speed).toBeHidden()
  await expect(speed).toBeAttached()
  expect(await exportConfig(page)).toEqual({ ...source, Game_Time_Speed: 25 })

  await modifiedToggle(page).click()
  await expect(nonDefaultToggle(page)).toHaveAttribute('aria-pressed', 'true')
  await expect(modifiedToggle(page)).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('article[data-setting]:visible')).toHaveCount(0)
  await nonDefaultToggle(page).click()
  await expect(speed).toBeVisible()
  await expect(speed.getByRole('textbox')).toHaveValue('25')
  await expect(badge(page, 'Game_Time_Speed', 'different')).toHaveCount(0)
  await speed.getByRole('button', { name: /^Undo / }).click()
  await expect(modifiedToggle(page)).toHaveText(/Modified only\s*0$/)
  await expect(nonDefaultToggle(page)).toHaveText(/Non-default only\s*1$/)
  await expect(speed).toBeHidden()
  await modifiedToggle(page).click()
  await expect(speed.getByRole('textbox')).toHaveValue('50')
  await expect(badge(page, 'Game_Time_Speed', 'different')).toBeVisible()
  expect(await exportConfig(page)).toEqual(source)
})

test('collapsed lifespan comparisons count saved profiles and retain custom sentinel choices and unknown children', async ({ page }) => {
  const source = {
    AgeSpanNormal: { ...humanDefault },
    AgeSpanLong: { ...humanDefault, Adult: 168 },
    AgeSpanShort: { ...humanDefault, FutureAge: '0017' },
    DP_UseOnly: ['preserve', null, '0003'],
  }
  await importConfig(page, source)
  const humans = page.locator('[data-lifespan-group="human"]')
  const expand = humans.getByRole('button', { name: 'Edit details for Humans lifespans', exact: true })
  await expect(expand).toHaveAttribute('aria-expanded', 'false')
  await expect(nonDefaultToggle(page)).toHaveText(/Non-default only\s*1$/)
  await expect(modifiedToggle(page)).toHaveText(/Modified only\s*0$/)
  await expect(page.locator('[data-default-summary]')).toContainText(/1 default(?: is)? unknown/)
  const collapsedSummary = humans.locator('[data-default-group-summary="human"]')
  await expect(collapsedSummary).toBeVisible()
  await expect(collapsedSummary.locator('[data-default-count="different"]')).toHaveText('1 non-default')
  await expect(collapsedSummary.locator('[data-default-count="unknown"]')).toHaveText('1 unknown')

  await nonDefaultToggle(page).click()
  await expect(expand).toHaveAttribute('aria-expanded', 'false')
  await expand.click()
  const custom = row(page, 'AgeSpanLong')
  await expect(custom.getByRole('textbox', { name: /: Adult$/ })).toHaveValue('168')
  await expect(badge(page, 'AgeSpanLong', 'different')).toBeVisible()
  await expect(row(page, 'AgeSpanNormal')).toBeHidden()
  await expect(row(page, 'AgeSpanShort')).toBeHidden()
  await nonDefaultToggle(page).click()
  await expect(badge(page, 'AgeSpanShort', 'unknown')).toBeVisible()
  await expect(badge(page, 'AgeSpanNormal', 'different')).toHaveCount(0)
  expect(await exportConfig(page)).toEqual(source)
})

test('invalid drafts survive nondefault and search filters, with correct breadcrumb context and baseline Undo', async ({ page }) => {
  const source = { Game_Time_Speed: 50, Pause_on_Zone: true, Future_Default_Review: '0007' }
  await importConfig(page, source)
  const speed = row(page, 'Game_Time_Speed')
  await speed.getByRole('textbox').fill('1001')
  await expect(speed.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeDisabled()
  await expect(modifiedToggle(page)).toHaveText(/Modified only\s*0$/)
  await nonDefaultToggle(page).click()
  const search = page.getByRole('textbox', { name: 'Search settings', exact: true })
  await search.fill('Pause_on_Zone')
  await row(page, 'Pause_on_Zone').getByRole('switch').focus()
  const breadcrumbs = page.locator('[data-editor-breadcrumbs]')
  await expect(breadcrumbs).toHaveAttribute('data-current-setting', 'Pause_on_Zone')
  await expect(breadcrumbs.locator('[aria-current="page"]')).toHaveAttribute('title', /MCCC Settings.*Gameplay.*Pause_on_Zone/)
  await expect(search).toHaveValue('Pause_on_Zone')
  await expect(nonDefaultToggle(page)).toHaveAttribute('aria-pressed', 'true')
  await expect(nonDefaultToggle(page)).toHaveText(/Non-default only\s*2$/)
  await expect(page).toHaveURL(/#\/settings$/)
  await expect(speed).toBeAttached()
  await expect(speed).toBeHidden()
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeDisabled()

  await page.getByRole('button', { name: 'Show fields to fix', exact: true }).click()
  await expect(nonDefaultToggle(page)).toHaveAttribute('aria-pressed', 'false')
  await expect(speed.getByRole('textbox')).toHaveValue('1001')
  await expect(speed.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  await speed.getByRole('button', { name: /^Undo / }).click()
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeEnabled()
  await expect(modifiedToggle(page)).toHaveText(/Modified only\s*0$/)
  expect(await exportConfig(page)).toEqual(source)
})
