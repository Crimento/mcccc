import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import type { SettingsRecord } from '../src/lib/config'
import { expandVisibleLifespanGroups } from './helpers/lifespans'

const sample = JSON.parse(readFileSync(new URL('../mc_settings.cfg', import.meta.url), 'utf8')) as SettingsRecord
const menus = 'Notifications/Console/Menu Settings'
const consolePath = `${menus}/Console Command Settings`
const notifications = `${menus}/Notification Settings`

async function importConfig(page: Page, config: SettingsRecord = sample) {
  await page.getByLabel('Import config file').setInputFiles({
    name: 'core-navigation.cfg', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(config)),
  })
  await expect(page.getByText('core-navigation.cfg', { exact: true })).toBeVisible()
  await page.locator('[data-category="core"]').click()
}

async function openMenu(page: Page, path: string, count: number) {
  await page.locator(`[data-menu-path="${path}"]`).click()
  await expandVisibleLifespanGroups(page)
  await expect(page.locator('article[data-setting]:visible')).toHaveCount(count)
  return page.locator('article[data-setting]:visible').evaluateAll(rows => rows.map(row => row.getAttribute('data-setting')!))
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

async function expectNoHorizontalOverflow(page: Page) {
  const widths = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }))
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 1)
  expect(widths.body).toBeLessThanOrEqual(widths.viewport + 1)
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Your game. Your settings.' })).toBeVisible()
})

test('expanded core menus retain all 114 settings and export only the selected Money and BuildBuy changes', async ({ page }) => {
  const source = {
    ...sample,
    Menu_Order: {
      ...(sample.Menu_Order as SettingsRecord),
      FutureMenu: { position: '0012', nested: [null, true] },
    },
    Show_DeathNotificationType: 'FUTURE_AUDIENCE',
    Future_Console_State: { numericString: '0007', values: [false, null, 'A,B'] },
  }
  await importConfig(page, source)
  await expect(page.locator('[data-menu-path="More MCCC Settings"]')).toHaveCount(0)
  await page.getByRole('button', { name: 'Show all', exact: true }).click()
  await expandVisibleLifespanGroups(page)
  const rows = page.locator('article[data-setting]:visible')
  await expect(rows).toHaveCount(114)
  const allKeys = await rows.evaluateAll(nodes => nodes.map(node => node.getAttribute('data-setting')!))
  const branches = [
    ['Age', 13], ['Auto-Save', 7], ['Gameplay', 28], ['Money Settings', 8],
    [menus, 42], ['Relationship Settings', 16],
  ] as const
  const covered: string[] = []
  for (const [path, count] of branches) covered.push(...await openMenu(page, path, count))
  expect(covered).toHaveLength(114)
  expect(new Set(covered)).toEqual(new Set(allKeys))

  const menuKeys = await openMenu(page, menus, 42)
  const consoleKeys = await openMenu(page, consolePath, 10)
  const buildKeys = await openMenu(page, `${consolePath}/BuildBuy Settings`, 5)
  expect(buildKeys.every(key => key.startsWith('BB_') && consoleKeys.includes(key))).toBe(true)
  const loggingKeys = await openMenu(page, `${menus}/Logging Settings`, 3)
  const notificationKeys = await openMenu(page, notifications, 22)
  const showMenuKeys = await openMenu(page, `${menus}/Show Menu Settings`, 5)
  expect(new Set(menuKeys)).toEqual(new Set([
    'Menu_Order', 'Silence_Phone_Texts', ...consoleKeys, ...loggingKeys, ...notificationKeys, ...showMenuKeys,
  ]))

  const childNotifications: string[] = []
  for (const [label, count] of [
    ['Aging/Death Notifications', 4], ['MC Population Notifications', 2],
    ['MC Pregnancy Notifications', 6], ['Neighborhood Stories Settings', 6],
  ] as const) {
    childNotifications.push(...await openMenu(page, `${notifications}/${label}`, count))
  }
  expect(notificationKeys.filter(key => !childNotifications.includes(key))).toHaveLength(4)
  expect(childNotifications.every(key => notificationKeys.includes(key))).toBe(true)
  await openMenu(page, `${notifications}/Aging/Death Notifications`, 4)
  await expect(page.locator('[data-setting="Show_DeathNotificationType"]').getByRole('combobox')).toContainText('FUTURE_AUDIENCE (from file)')

  await openMenu(page, 'Money Settings', 8)
  await page.locator('[data-setting="Tuner_Child_Pay_Bills"]').getByRole('switch').click()
  await openMenu(page, `${consolePath}/BuildBuy Settings`, 5)
  await page.locator('[data-setting="BB_Move_Objects_Enabled"]').getByRole('switch').click()
  const exported = await exportConfig(page)
  expect(exported).toEqual({
    ...source,
    Tuner_Child_Pay_Bills: !sample.Tuner_Child_Pay_Bills,
    BB_Move_Objects_Enabled: !sample.BB_Move_Objects_Enabled,
  })
  // Menu order is one saved object; in-game save/reset actions add no config keys.
  expect(Object.keys(exported)).toEqual(Object.keys(source))
  expect(exported.Menu_Order).toEqual(source.Menu_Order)
})

test('deep core notification branches remain accessible on mobile and keep their module routing', async ({ page }) => {
  await importConfig(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: 'Open categories', exact: true }).click()
  await expectNoHorizontalOverflow(page)
  const sidebarWidth = await page.locator('#settings-navigation').evaluate(element => ({
    content: element.scrollWidth, available: element.clientWidth,
  }))
  expect(sidebarWidth.content).toBeLessThanOrEqual(sidebarWidth.available + 1)
  await openMenu(page, `${notifications}/Neighborhood Stories Settings`, 6)
  await expect(page.locator('#list-title')).toContainText('Neighborhood Stories Settings')
  await expect(page.getByText(`MCCC Settings / ${menus} / Notification Settings`, { exact: true })).toBeVisible()
  await expect(page.locator('[data-setting="Show_NSAdoptionType"]')).toBeVisible()
  await expect(page.locator('[data-setting="Pregnancy_NSAdoptChildLimit"]')).toBeHidden()
  await expectNoHorizontalOverflow(page)

  await page.getByRole('button', { name: 'Open categories', exact: true }).click()
  await openMenu(page, `${notifications}/MC Pregnancy Notifications`, 6)
  await expect(page.locator('[data-setting="Show_PregnancyNotificationType"]')).toBeVisible()
  await expect(page.locator('[data-setting="Show_PetPregnancyNotificationType"]')).toBeHidden()
  await expect(page.getByText(`MCCC Settings / ${menus} / Notification Settings`, { exact: true })).toBeVisible()
  await expectNoHorizontalOverflow(page)

  await page.getByRole('button', { name: 'Open categories', exact: true }).click()
  await page.locator('[data-category="pregnancy"]').click()
  await page.getByRole('button', { name: 'Open categories', exact: true }).click()
  await openMenu(page, 'Pet Pregnancy Settings', 9)
  await expect(page.locator('[data-setting="Show_PetPregnancyNotificationType"]')).toBeVisible()
  await expect(page.locator('[data-setting="Show_PregnancyNotificationType"]')).toBeHidden()
  await expectNoHorizontalOverflow(page)
  expect(await exportConfig(page)).toEqual(sample)
})
