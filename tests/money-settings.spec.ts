import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import type { SettingsRecord } from '../src/lib/config'

const sample = JSON.parse(readFileSync(new URL('../mc_settings.cfg', import.meta.url), 'utf8')) as SettingsRecord

function setting(page: Page, key: string) {
  return page.locator(`article[data-setting="${key}"]`)
}

async function importConfig(page: Page, config: SettingsRecord) {
  await page.getByLabel('Import config file').setInputFiles({
    name: 'money-settings.cfg', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(config)),
  })
  await expect(page.getByText('money-settings.cfg', { exact: true })).toBeVisible()
  await page.locator('[data-category="core"]').click()
  await page.locator('[data-menu-path="Money Settings"]').click()
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

test('the eight money settings export independent bill boundary changes and preserve other codes', async ({ page }) => {
  const source = {
    ...sample,
    Pay_Child_Support_Type: 'FUTURE_SUPPORT',
    Inherit_Sim_Type: 'FUTURE_HEIRS',
    Future_Money_Data: { amount: '0007', nested: [null, false, ['A', 'N']] },
  }
  await importConfig(page, source)
  const group = page.locator('[data-money-settings-group]')
  await expect(group.locator('article[data-setting]:visible')).toHaveCount(8)
  for (const [block, count] of [['bills', 4], ['child-support', 2], ['inheritance', 2]] as const) {
    await expect(group.locator(`[data-money-block="${block}"] article[data-setting]:visible`)).toHaveCount(count)
  }
  const apartment = setting(page, 'Bill_AmountPercentApartment')
  const bills = setting(page, 'Bill_Amount_Percent')
  for (const row of [apartment, bills]) {
    await expect(row.getByRole('slider')).toHaveAttribute('aria-valuemin', '-100')
    await expect(row.getByRole('slider')).toHaveAttribute('aria-valuemax', '1000')
    await expect(row.getByRole('textbox')).toHaveValue('0')
  }
  const support = setting(page, 'Pay_Child_Support_Percent')
  await expect(support.getByRole('slider')).toHaveAttribute('aria-valuemin', '1')
  await expect(support.getByRole('slider')).toHaveAttribute('aria-valuemax', '1000')
  await expect(setting(page, 'Pay_Child_Support_Type').getByRole('combobox')).toContainText('FUTURE_SUPPORT (from file)')
  expect(await exportConfig(page)).toEqual(source)

  await apartment.getByRole('slider', { name: 'Apartment Bill Percent', exact: true }).press('Home')
  await bills.getByRole('slider', { name: 'Change Bills Percent', exact: true }).press('End')
  await setting(page, 'Bill_AutoPay').getByRole('switch').check()
  await expect(apartment.getByRole('textbox')).toBeEnabled()
  await expect(apartment.getByRole('textbox')).toHaveValue('-100')
  await expect(bills.getByRole('textbox')).toHaveValue('1000')
  await expect(setting(page, 'Tuner_Child_Pay_Bills').getByRole('switch')).toBeEnabled()
  await expect(setting(page, 'Tuner_Child_Pay_Bills').getByRole('switch')).not.toBeChecked()
  await expect(support.getByRole('textbox')).toBeEnabled()
  expect(await exportConfig(page)).toEqual({
    ...source, Bill_AmountPercentApartment: -100, Bill_Amount_Percent: 1000, Bill_AutoPay: true,
  })
})

test('all inheritance choices keep string codes and leave spouse priority independently editable', async ({ page }) => {
  const source = { ...sample, Inherit_Sim_Type: 'FUTURE_HEIRS', Inherit_Spouse_First: false }
  await importConfig(page, source)
  const type = setting(page, 'Inherit_Sim_Type').getByRole('combobox')
  const spouse = setting(page, 'Inherit_Spouse_First').getByRole('switch')
  await expect(type).toContainText('FUTURE_HEIRS (from file)')
  expect(await exportConfig(page)).toEqual(source)

  let spouseFirst = false
  for (const [code, label] of [
    ['0', 'None'], ['A', 'Active Only'], ['AL', 'All'], ['N', 'NPC Only'],
  ] as const) {
    await type.click()
    await page.getByRole('option', { name: label, exact: true }).click()
    await expect(spouse).toBeEnabled()
    await expect(spouse).toBeChecked({ checked: spouseFirst })
    spouseFirst = !spouseFirst
    await spouse.setChecked(spouseFirst)
    await expect(type).toContainText(label)
    expect(await exportConfig(page)).toEqual({
      ...source, Inherit_Sim_Type: code, Inherit_Spouse_First: spouseFirst,
    })
  }
})

test('invalid bill drafts survive sibling changes and mobile navigation until their own Undo', async ({ page }) => {
  await importConfig(page, sample)
  const apartment = setting(page, 'Bill_AmountPercentApartment')
  const bills = setting(page, 'Bill_Amount_Percent')
  await apartment.getByRole('textbox').fill('-101')
  await bills.getByRole('textbox').fill('1001')
  await setting(page, 'Pay_Child_Support_Percent').getByRole('textbox').fill('77')
  await expect(apartment.getByRole('textbox')).toHaveValue('-101')
  await expect(bills.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeDisabled()
  await page.setViewportSize({ width: 390, height: 844 })
  await expectNoHorizontalOverflow(page)

  await page.getByRole('button', { name: 'Open categories', exact: true }).click()
  await page.locator('[data-menu-path="Gameplay"]').click()
  await expect(apartment).toBeAttached()
  await expect(apartment).toBeHidden()
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeDisabled()
  const search = page.getByRole('textbox', { name: 'Search settings' })
  await search.fill('Bill_AmountPercentApartment')
  await expect(apartment.getByRole('textbox')).toHaveValue('-101')
  await apartment.getByRole('button', { name: 'Undo Apartment Bill Percent', exact: true }).click()
  await expect(apartment.getByRole('textbox')).toHaveValue('0')
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeDisabled()
  await search.fill('Bill_Amount_Percent')
  await expect(bills.getByRole('textbox')).toHaveValue('1001')
  await bills.getByRole('textbox').fill('0.5')
  await expect(bills.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  await bills.getByRole('button', { name: 'Undo Change Bills Percent', exact: true }).click()
  await expect(bills.getByRole('textbox')).toHaveValue('0')
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeEnabled()
  await expectNoHorizontalOverflow(page)
  expect(await exportConfig(page)).toEqual({ ...sample, Pay_Child_Support_Percent: 77 })
})

test('partial money imports preserve missing keys, incompatible types and untouched outliers', async ({ page }) => {
  const source = {
    Bill_AmountPercentApartment: 1500,
    Bill_Amount_Percent: '005',
    Bill_AutoPay: { enabled: false },
    Tuner_Child_Pay_Bills: false,
    Pay_Child_Support_Type: 17,
    Pay_Child_Support_Percent: null,
    Inherit_Sim_Type: ['N', 'FUTURE'],
    Future_Money_Data: { amount: '0007', nested: [null, true] },
  }
  await importConfig(page, source)
  await expect(page.locator('[data-money-settings-group] article[data-setting]:visible')).toHaveCount(7)
  await expect(setting(page, 'Inherit_Spouse_First')).toHaveCount(0)
  await expect(setting(page, 'Bill_AmountPercentApartment').getByRole('textbox')).toHaveValue('1500')
  await expect(setting(page, 'Bill_AmountPercentApartment').getByRole('slider')).toBeDisabled()
  await expect(setting(page, 'Bill_Amount_Percent').getByRole('textbox')).toHaveValue('005')
  await expect(setting(page, 'Bill_Amount_Percent').getByRole('slider')).toHaveCount(0)
  await expect(setting(page, 'Bill_AutoPay').getByRole('switch')).toHaveCount(0)
  for (const key of ['Pay_Child_Support_Type', 'Inherit_Sim_Type']) {
    await expect(setting(page, key).getByRole('combobox')).toHaveCount(0)
  }
  await expect(setting(page, 'Pay_Child_Support_Type').getByRole('textbox')).toHaveValue('17')
  expect(await exportConfig(page)).toEqual(source)

  await setting(page, 'Tuner_Child_Pay_Bills').getByRole('switch').check()
  expect(await exportConfig(page)).toEqual({ ...source, Tuner_Child_Pay_Bills: true })
})
