import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import type { SettingsRecord } from '../src/lib/config'

const sample = JSON.parse(readFileSync(new URL('../mc_settings.cfg', import.meta.url), 'utf8')) as SettingsRecord
const menus = 'Notifications/Console/Menu Settings'
const notifications = `${menus}/Notification Settings`
const deathHash = '#/settings/core/Notifications%2FConsole%2FMenu%20Settings/Notification%20Settings/Aging%2FDeath%20Notifications'
const notificationHash = '#/settings/core/Notifications%2FConsole%2FMenu%20Settings/Notification%20Settings'

async function importConfig(page: Page, config: SettingsRecord) {
  await page.getByLabel('Import config file').setInputFiles({
    name: 'breadcrumbs.cfg', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(config)),
  })
  await expect(page.getByText('breadcrumbs.cfg', { exact: true })).toBeAttached()
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

async function expectNoOverflow(page: Page) {
  const widths = await page.evaluate(() => ({
    viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth,
  }))
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 1)
  expect(widths.body).toBeLessThanOrEqual(widths.viewport + 1)
}

test('encoded deep links reload and navigate through real ancestor URLs and browser history without reloading the editor', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 })
  await page.goto(`/${deathHash}`)
  await expect(page.locator('#list-title')).toContainText('Aging/Death Notifications')
  await expect(page.locator('article[data-setting]:visible')).toHaveCount(4)
  await page.reload()
  await expect(page.locator('#list-title')).toContainText('Aging/Death Notifications')
  const documentStarted = await page.evaluate(() => performance.timeOrigin)
  const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb', exact: true })
  await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText('Aging/Death Notifications')
  const parent = breadcrumb.getByRole('link', { name: 'Notification Settings', exact: true })
  await expect(parent).toHaveAttribute('href', notificationHash)
  await parent.click()
  await expect(page).toHaveURL(new RegExp(`${notificationHash}$`))
  await expect(page.locator('article[data-setting]:visible')).toHaveCount(22)
  await page.goBack()
  await expect(page.locator('#list-title')).toContainText('Aging/Death Notifications')
  await page.goForward()
  await expect(page.locator('#list-title')).toContainText('Notification Settings')
  await breadcrumb.getByRole('link', { name: 'MCCC Settings', exact: true }).click()
  await expect(page).toHaveURL(/#\/settings\/core$/)
  await expect(page.locator('#list-title')).toContainText('MCCC Settings')
  await breadcrumb.getByRole('link', { name: 'All settings', exact: true }).click()
  await expect(page).toHaveURL(/#\/settings$/)
  await expect(page.locator('#list-title')).toContainText('All settings')
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(documentStarted)
  expect(await exportConfig(page)).toEqual(sample)
})

test('menu history and global breadcrumb filters preserve invalid drafts, independent edits and unknown imported data', async ({ page }) => {
  await page.goto('/')
  const source = { ...sample, Future_Breadcrumb_Data: { raw: '0004', nested: [null, 'A,B', true] } }
  await importConfig(page, source)
  await page.locator('[data-category="core"]').click()
  await page.locator('[data-menu-path="Gameplay/Motive Decay"]').click()
  const documentStarted = await page.evaluate(() => performance.timeOrigin)
  const sims = page.locator('[data-setting="MotiveDecay_Sims"]')
  await sims.getByRole('textbox').fill('501')
  await page.locator('[data-setting="MotiveDecay_Dogs"]').getByRole('textbox').fill('200')
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeDisabled()
  const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb', exact: true })
  await breadcrumb.getByRole('link', { name: 'Gameplay', exact: true }).click()
  await page.locator('[data-menu-path="Money Settings"]').click()
  await page.goBack()
  await expect(page.locator('#list-title')).toContainText('Gameplay')
  const menuHash = await page.evaluate(() => location.hash)
  await page.getByRole('textbox', { name: 'Search settings' }).fill('MotiveDecay_Sims')
  await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText('Search results')
  await expect(breadcrumb.getByRole('link', { name: 'Gameplay', exact: true })).toHaveCount(0)
  await expect(sims.getByRole('textbox')).toHaveValue('501')
  await expect(sims.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  expect(await page.evaluate(() => location.hash)).toBe(menuHash)
  await page.getByRole('button', { name: 'Clear search', exact: true }).click()
  await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText('Gameplay')
  await page.getByRole('button', { name: /^Modified only/ }).click()
  await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText('Your changes')
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeDisabled()
  await breadcrumb.getByRole('link', { name: 'All settings', exact: true }).click()
  await expect(page.getByRole('button', { name: /^Modified only/ })).toHaveAttribute('aria-pressed', 'false')
  await expect(page).toHaveURL(/#\/settings$/)
  await page.getByRole('textbox', { name: 'Search settings' }).fill('MotiveDecay_Sims')
  await expect(sims.getByRole('textbox')).toHaveValue('501')
  await sims.getByRole('button', { name: /^Undo / }).click()
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(documentStarted)
  expect(await exportConfig(page)).toEqual({ ...source, MotiveDecay_Dogs: 200 })
})

test('deep breadcrumbs keep compact desktop ancestors reachable and leave mobile import and export accessible', async ({ page }) => {
  await page.goto(`/${deathHash}`)
  const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb', exact: true })
  for (const width of [1920, 1440, 1024]) {
    await page.setViewportSize({ width, height: 1080 })
    await expect(breadcrumb).toBeVisible()
    await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText('Aging/Death Notifications')
    await expect(page.getByRole('button', { name: 'Import config', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Export\b/ })).toBeVisible()
    await expectNoOverflow(page)
  }
  // The compact desktop trail must still offer the intermediate menu as a link.
  await breadcrumb.getByRole('button', { name: 'Show parent menus', exact: true }).click()
  const overflowParent = page.getByRole('menuitem', { name: 'Notification Settings', exact: true })
  await expect(overflowParent).toHaveAttribute('href', notificationHash)
  await overflowParent.click()
  await expect(page.locator('#list-title')).toContainText('Notification Settings')
  await breadcrumb.getByRole('button', { name: 'Show parent menus', exact: true }).click()
  await expect(page.getByRole('menu')).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(breadcrumb).toBeHidden()
  await expect(page.getByRole('menu')).toBeHidden()
  await expect(page.getByRole('button', { name: 'Import config', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeVisible()
  await page.getByRole('button', { name: 'Open categories', exact: true }).click()
  await page.locator(`[data-menu-path="${notifications}/Aging/Death Notifications"]`).click()
  await expect(page.locator('#list-title')).toContainText('Aging/Death Notifications')
  await expectNoOverflow(page)
  const partial = { Show_DeathNotificationType: 'FUTURE', Future_Mobile_Value: ['0004', false] }
  await importConfig(page, partial)
  await expect(page).toHaveURL(/#\/settings$/)
  await expect(page.locator('#list-title')).toContainText('All settings')
  await expectNoOverflow(page)
  expect(await exportConfig(page)).toEqual(partial)
})
