import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import type { SettingsRecord } from '../src/lib/config'

const sample = JSON.parse(readFileSync(new URL('../mc_settings.cfg', import.meta.url), 'utf8')) as SettingsRecord
const multiplierKey = 'Occult_OccultTypeAgeMultiplier'
const maximumAgeKey = 'Occult_OccultTypeMaximumAge'
const multipliers = sample[multiplierKey] as SettingsRecord
const maximumAges = sample[maximumAgeKey] as SettingsRecord

async function importConfig(page: Page, config: SettingsRecord = sample) {
  await page.getByLabel('Import config file').setInputFiles({
    name: 'occult-aging.cfg', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(config)),
  })
  await expect(page.getByText('occult-aging.cfg', { exact: true })).toBeVisible()
  await page.locator('[data-category="occult"]').click()
}

async function openMenu(page: Page, path: string) {
  await page.locator(`[data-menu-path="${path}"]`).click()
}

async function exportConfig(page: Page): Promise<SettingsRecord> {
  await page.getByRole('button', { name: /^Export config/ }).click()
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

test('species aging menus edit shared storage once and preserve decimals and unknown species', async ({ page }) => {
  const source: SettingsRecord = {
    ...sample,
    [multiplierKey]: { ...multipliers, FUTURE: { numericString: '0012', values: [null, false, 4] } },
    [maximumAgeKey]: { ...maximumAges, FUTURE: 'KEEP_THIS' },
  }
  await importConfig(page, source)
  await expect(page.locator('[data-category="occult"]')).toContainText('52')
  await page.getByRole('button', { name: 'Show all', exact: true }).click()
  await expect(page.locator('article[data-setting]:visible')).toHaveCount(52)
  await expect(page.locator('[data-occult-settings-group] article[data-setting]:visible')).toHaveCount(52)
  for (const key of [multiplierKey, maximumAgeKey, 'Occult_UseCustomPregnancy']) {
    await expect(page.locator(`article[data-setting="${key}"]`)).toHaveCount(1)
  }

  await openMenu(page, 'Fairies/Aging Settings')
  await expect(page.locator('article[data-setting]:visible')).toHaveCount(2)
  const multiplier = page.locator(`[data-setting="${multiplierKey}"]`)
  const fairies = multiplier.locator('[data-occult-species="FR"]')
  await expect(fairies.getByRole('slider')).toHaveCount(5)
  await expect(fairies.getByRole('textbox', { name: 'Age Multiplier: Young Adult', exact: true })).toHaveValue('135.72')
  await expect(fairies.getByRole('slider', { name: 'Age Multiplier: Young Adult', exact: true })).toHaveAttribute('aria-valuenow', '135.72')
  expect(await exportConfig(page)).toEqual(source)

  await fairies.getByRole('textbox', { name: 'Age Multiplier: Teen', exact: true }).fill('123.45')
  const changedFairies = [...multipliers.FR as number[]]
  changedFairies[1] = 123.45
  await openMenu(page, 'Vampires/Aging Settings')
  await expect(page.locator('article[data-setting]:visible')).toHaveCount(2)
  const vampires = page.locator(`[data-setting="${maximumAgeKey}"] [data-occult-species="V"]`)
  const age = vampires.getByRole('combobox', { name: 'Aging Maximum', exact: true })
  await expect(age).toContainText('Young Adult')
  await age.click()
  await page.getByRole('option', { name: 'Elder', exact: true }).click()
  const expected = {
    ...source,
    [multiplierKey]: { ...source[multiplierKey] as SettingsRecord, FR: changedFairies },
    [maximumAgeKey]: { ...source[maximumAgeKey] as SettingsRecord, V: 'E' },
  }
  expect(await exportConfig(page)).toEqual(expected)

  await age.click()
  await page.getByRole('option', { name: 'Normal aging', exact: true }).click()
  expect(await exportConfig(page)).toEqual({
    ...expected, [maximumAgeKey]: { ...expected[maximumAgeKey], V: '0' },
  })
})

test('invalid aging drafts survive sibling and species edits until whole-setting undo', async ({ page }) => {
  await importConfig(page)
  await openMenu(page, 'Fairies/Aging Settings')
  const multiplier = page.locator(`[data-setting="${multiplierKey}"]`)
  const fairies = multiplier.locator('[data-occult-species="FR"]')
  const teen = fairies.getByRole('textbox', { name: 'Age Multiplier: Teen', exact: true })
  await teen.fill('')
  await fairies.getByRole('textbox', { name: 'Age Multiplier: Adult', exact: true }).fill('123.25')
  await expect(teen).toHaveValue('')
  await expect(teen).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeDisabled()

  await openMenu(page, 'Aliens/Aging Settings')
  await expect(fairies).toBeHidden()
  const aliens = multiplier.locator('[data-occult-species="A"]')
  await aliens.getByRole('textbox', { name: 'Age Multiplier: Child', exact: true }).fill('88.5')
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeDisabled()
  await openMenu(page, 'Fairies/Aging Settings')
  await expect(teen).toHaveValue('')
  await expect(teen).toHaveAttribute('aria-invalid', 'true')
  await expect(fairies.getByRole('textbox', { name: 'Age Multiplier: Adult', exact: true })).toHaveValue('123.25')

  await multiplier.getByRole('button', { name: 'Undo Age Multiplier', exact: true }).click()
  await expect(teen).toHaveValue(String((multipliers.FR as number[])[1]))
  await expect(fairies.getByRole('textbox', { name: 'Age Multiplier: Adult', exact: true })).toHaveValue(String((multipliers.FR as number[])[3]))
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeEnabled()
  expect(await exportConfig(page)).toEqual(sample)
})

test('pregnancy aliases share one switch and malformed aging values retain their original types', async ({ page }) => {
  const source: SettingsRecord = {
    ...sample,
    [multiplierKey]: {
      ...multipliers,
      A: [100, 200],
      FR: [100, 'legacy', 135.72, 131, 214.5],
      FUTURE: { preserved: '0012', nested: [false, null, 7] },
    },
    [maximumAgeKey]: { ...maximumAges, V: 'FUTURE', FUTURE: { code: '007' } },
  }
  await importConfig(page, source)
  await openMenu(page, 'Fairies/Aging Settings')
  const multiplier = page.locator(`[data-setting="${multiplierKey}"]`)
  const fairies = multiplier.locator('[data-occult-species="FR"]')
  await expect(fairies.getByRole('slider')).toHaveCount(0)
  await fairies.getByRole('button', { name: 'Edit details for Age Multiplier', exact: true }).click()
  await expect(fairies.getByRole('textbox', { name: 'Age Multiplier: Item 2', exact: true })).toHaveValue('legacy')
  await openMenu(page, 'Aliens/Aging Settings')
  const aliens = multiplier.locator('[data-occult-species="A"]')
  await expect(aliens.getByRole('slider')).toHaveCount(0)
  await aliens.getByRole('button', { name: 'Edit details for Age Multiplier', exact: true }).click()
  await expect(aliens.getByRole('textbox', { name: 'Age Multiplier: Item 2', exact: true })).toHaveValue('200')
  await openMenu(page, 'Vampires/Aging Settings')
  await expect(page.locator(`[data-setting="${maximumAgeKey}"] [data-occult-species="V"]`).getByRole('combobox'))
    .toContainText('FUTURE (from file)')
  expect(await exportConfig(page)).toEqual(source)

  await openMenu(page, 'Aliens/Other Pregnancy')
  const shared = page.locator('[data-setting="Occult_UseCustomPregnancy"]')
  await expect(shared).toHaveCount(1)
  await shared.getByRole('switch', { name: 'Use Custom Pregnancy', exact: true }).check()
  await openMenu(page, 'Fairies/Other Pregnancy')
  await expect(shared.getByRole('switch', { name: 'Use Custom Pregnancy', exact: true })).toBeChecked()

  await openMenu(page, 'Fairies')
  const maximum = page.locator('[data-setting="Occult_MaximumFairies"]')
  await expect(maximum.getByRole('textbox')).toHaveValue('-1')
  await expect(maximum).toContainText('Unlimited')
  await expect(maximum.getByRole('slider')).toHaveAttribute('aria-valuemin', '-1')
  await expect(maximum.getByRole('slider')).toHaveAttribute('aria-valuemax', '50')
  await maximum.getByRole('slider').press('ArrowRight')
  await expect(maximum.getByRole('textbox')).toHaveValue('0')
  expect(await exportConfig(page)).toEqual({ ...source, Occult_UseCustomPregnancy: true, Occult_MaximumFairies: 0 })
})

test('alien disguise choices and abduction hours export exact types and preserve invalid drafts across sibling edits and filtering', async ({ page }) => {
  const source = {
    Occult_ForceAlienDisguiseType: 'FUTURE_DISGUISE',
    Occult_TimeBetweenAbductions: 12,
    Future_Alien_Data: { raw: '0007', values: [null, false] },
  }
  await importConfig(page, source)
  await expect(page.locator('article[data-setting]:visible')).toHaveCount(2)
  const disguise = page.locator('[data-setting="Occult_ForceAlienDisguiseType"]').getByRole('combobox')
  const hours = page.locator('[data-setting="Occult_TimeBetweenAbductions"]')
  await expect(disguise).toHaveText('FUTURE_DISGUISE (from file)')
  await expect(hours.getByRole('slider')).toHaveAttribute('aria-valuemin', '1')
  await expect(hours.getByRole('slider')).toHaveAttribute('aria-valuemax', '24')
  expect(await exportConfig(page)).toEqual(source)
  await disguise.click()
  await page.getByRole('option', { name: 'Force Disguise', exact: true }).click()
  await hours.getByRole('slider').press('Home')
  expect(await exportConfig(page)).toEqual({ ...source, Occult_ForceAlienDisguiseType: 'H', Occult_TimeBetweenAbductions: 1 })
  await disguise.click()
  await page.getByRole('option', { name: 'Force No Disguise', exact: true }).click()
  await hours.getByRole('slider').press('End')
  expect(await exportConfig(page)).toEqual({ ...source, Occult_ForceAlienDisguiseType: 'A', Occult_TimeBetweenAbductions: 24 })
  for (const invalid of ['0', '25']) {
    await hours.getByRole('textbox').fill(invalid)
    await expect(hours.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  }
  await disguise.click()
  await page.getByRole('option', { name: "Default (don't force)", exact: true }).click()
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeDisabled()
  await page.getByRole('textbox', { name: 'Search settings' }).fill('Future_Alien_Data')
  await expect(hours).toBeAttached()
  await expect(hours).toBeHidden()
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeDisabled()
  await page.getByRole('textbox', { name: 'Search settings' }).fill('Occult_TimeBetweenAbductions')
  await expect(hours.getByRole('textbox')).toHaveValue('25')
  await hours.getByRole('button', { name: /^Undo / }).click()
  expect(await exportConfig(page)).toEqual({ ...source, Occult_ForceAlienDisguiseType: '' })
})
