import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import type { JsonValue, SettingsRecord } from '../src/lib/config'

const sample = JSON.parse(readFileSync(new URL('../mc_settings.cfg', import.meta.url), 'utf8')) as SettingsRecord
const label = 'Change Sim Menu Order'
const household = '0xC0B3CF8C'
const modify = '0x3FA9FDC1'
const commands = '0xDAD0806C'
let importSequence = 0

function setting(page: Page) {
  return page.locator('article[data-setting="Menu_Order"]')
}

function entries(page: Page) {
  return setting(page).locator('[data-menu-entry]')
}

async function entryKeys(page: Page) {
  return entries(page).evaluateAll(rows => rows.map(row => row.getAttribute('data-menu-entry')!))
}

async function importConfig(page: Page, config: SettingsRecord) {
  const name = `menu-order-${++importSequence}.cfg`
  await page.getByLabel('Import config file').setInputFiles({
    name, mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(config)),
  })
  await expect(page.getByText(name, { exact: true })).toBeVisible()
  await page.locator('[data-category="core"]').click()
  await page.locator('[data-menu-path="Notifications/Console/Menu Settings"]').click()
}

async function openOrder(page: Page) {
  await setting(page).getByRole('button', { name: `Edit order for ${label}`, exact: true }).click()
  await expect(setting(page).getByRole('button', { name: `Close order for ${label}`, exact: true }))
    .toHaveAttribute('aria-expanded', 'true')
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

test('keyboard moves support all four directions and Undo restores the imported menu order', async ({ page }) => {
  await importConfig(page, sample)
  await expect(setting(page).getByRole('button', { name: `Edit order for ${label}`, exact: true }))
    .toHaveAttribute('aria-expanded', 'false')
  const original = sample.Menu_Order as SettingsRecord
  const originalOrder = Object.keys(original).sort((a, b) => Number(original[a]) - Number(original[b]))
  await openOrder(page)
  await expect(entries(page)).toHaveCount(14)
  expect(await entryKeys(page)).toEqual(originalOrder)
  await expect(setting(page).getByRole('button', { name: 'Move Modify Household in CAS up', exact: true })).toBeDisabled()
  await expect(setting(page).getByRole('button', { name: 'Move Modify Household in CAS to top', exact: true })).toBeDisabled()
  await expect(setting(page).getByRole('button', { name: 'Move Relationships down', exact: true })).toBeDisabled()
  await expect(setting(page).getByRole('button', { name: 'Move Relationships to bottom', exact: true })).toBeDisabled()

  await setting(page).getByRole('button', { name: 'Move Sim Commands up', exact: true }).press('Enter')
  expect((await entryKeys(page)).slice(0, 3)).toEqual([household, commands, modify])
  await setting(page).getByRole('button', { name: 'Move Sim Commands down', exact: true }).press('Space')
  expect(await entryKeys(page)).toEqual(originalOrder)
  await setting(page).getByRole('button', { name: 'Move Sim Commands to top', exact: true }).press('Enter')
  expect((await entryKeys(page)).slice(0, 3)).toEqual([commands, household, modify])
  await expect(setting(page).getByRole('button', { name: 'Move Sim Commands down', exact: true })).toBeFocused()
  await setting(page).getByRole('button', { name: 'Move Sim Commands to bottom', exact: true }).press('Space')
  const finalOrder = [...originalOrder.filter(key => key !== commands), commands]
  expect(await entryKeys(page)).toEqual(finalOrder)
  await expect(setting(page).getByRole('button', { name: 'Move Sim Commands up', exact: true })).toBeFocused()
  await expect(setting(page).getByRole('button', { name: 'Move Sim Commands down', exact: true })).toBeDisabled()
  await expect(setting(page).getByRole('button', { name: 'Move Sim Commands to bottom', exact: true })).toBeDisabled()

  const expectedOrder = Object.fromEntries(Object.keys(original).map(key => [key, String(finalOrder.indexOf(key))]))
  const exported = await exportConfig(page)
  expect(exported).toEqual({ ...sample, Menu_Order: expectedOrder })
  expect(Object.keys(exported.Menu_Order as SettingsRecord)).toEqual(Object.keys(original))
  await setting(page).getByRole('button', { name: `Undo ${label}`, exact: true }).click()
  expect(await exportConfig(page)).toEqual(sample)
})

test('sparse custom orders keep fixed labels, unknown IDs and value types through mobile filtering', async ({ page }) => {
  const custom = {
    [modify]: '30',
    Future_Menu_Identifier: 10,
    '0x9F3AFD77': '020',
    '0x923468DF': '080',
  }
  const source = {
    ...sample, Menu_Order: custom,
    Bypass_Sim_Menus: 'UNVERIFIED_MENU_CODES,0007',
    Future_Menu_State: { id: '0007', nested: [true, null] },
  }
  await importConfig(page, source)
  await openOrder(page)
  expect(await entryKeys(page)).toEqual(['Future_Menu_Identifier', '0x9F3AFD77', modify, '0x923468DF'])
  await expect(setting(page).locator(`[data-menu-entry="${modify}"]`)).toContainText('Modify in CAS')
  await expect(setting(page).locator('[data-menu-entry="0x9F3AFD77"]')).toContainText('MC CAS')
  await expect(setting(page).locator('[data-menu-entry="Future_Menu_Identifier"]')).toContainText('Future_Menu_Identifier')
  expect(await exportConfig(page)).toEqual(source)

  await page.setViewportSize({ width: 390, height: 844 })
  await expectNoHorizontalOverflow(page)
  await setting(page).getByRole('button', { name: 'Move Modify in CAS to top', exact: true }).press('Enter')
  const reordered = [modify, 'Future_Menu_Identifier', '0x9F3AFD77', '0x923468DF']
  expect(await entryKeys(page)).toEqual(reordered)
  await setting(page).getByRole('button', { name: `Close order for ${label}`, exact: true }).click()
  await openOrder(page)
  expect(await entryKeys(page)).toEqual(reordered)
  await page.getByRole('button', { name: 'Open categories', exact: true }).click()
  await page.locator('[data-menu-path="Money Settings"]').click()
  await expect(setting(page)).toBeAttached()
  await expect(setting(page)).toBeHidden()
  await page.getByRole('textbox', { name: 'Search settings' }).fill('Menu_Order')
  await expect(setting(page).getByRole('button', { name: `Close order for ${label}`, exact: true })).toBeVisible()
  expect(await entryKeys(page)).toEqual(reordered)
  await expectNoHorizontalOverflow(page)
  const exported = await exportConfig(page)
  expect(exported).toEqual({
    ...source,
    Menu_Order: { [modify]: '10', Future_Menu_Identifier: 20, '0x9F3AFD77': '30', '0x923468DF': '080' },
  })
  expect(Object.keys(exported.Menu_Order as SettingsRecord)).toEqual(Object.keys(custom))
})

test('duplicate positions and incompatible menu-order shapes fall back without repair or data loss', async ({ page }) => {
  const invalidOrders: JsonValue[] = [
    { [household]: '0', Future_Duplicate: 0 },
    { [household]: '0', Future_Metadata: { position: '1', payload: [null, '001', false] } },
    ['0', '1'],
  ]
  for (const value of invalidOrders) {
    const source = {
      Menu_Order: value,
      Bypass_Sim_Menus: 'opaque_future_value',
      Future_Menu_Data: { numericString: '0007', nested: [null, false] },
    }
    await importConfig(page, source)
    await expect(setting(page).locator('[data-menu-order-control]')).toHaveCount(0)
    await expect(setting(page).getByRole('button', { name: `Edit details for ${label}`, exact: true })).toBeVisible()
    await expect(setting(page).getByRole('button', { name: /^Move / })).toHaveCount(0)
    expect(await exportConfig(page)).toEqual(source)
  }
})
