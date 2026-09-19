import { readFileSync } from 'node:fs'
import { expect, test, type Locator, type Page } from '@playwright/test'
import type { SettingsRecord } from '../src/lib/config'

const sample = JSON.parse(readFileSync(new URL('../mc_settings.cfg', import.meta.url), 'utf8')) as SettingsRecord
const trail = (page: Page) => page.locator('[data-editor-breadcrumbs]')
const current = (page: Page) => trail(page).locator('[aria-current="page"]')

async function scrollUnderHeader(page: Page, target: Locator) {
  await page.mouse.move(0, 0)
  await target.evaluate(element => {
    const header = document.querySelector('[data-editor-header]')!
    window.scrollTo({
      top: window.scrollY + element.getBoundingClientRect().top - header.getBoundingClientRect().bottom - 23,
      behavior: 'instant',
    })
  })
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

test('scrolling All settings follows the visible setting and focusing neighboring controls leaves navigation and history untouched', async ({ page }) => {
  await expect(current(page)).toHaveText('All settings')
  await expect(trail(page)).not.toHaveAttribute('data-current-setting')
  await page.getByRole('button', { name: 'Show all', exact: true }).click()
  const before = await page.evaluate(() => ({ hash: location.hash, length: history.length, time: performance.timeOrigin }))
  const nights = page.locator('[data-setting="Population_BarNights"]')
  await scrollUnderHeader(page, nights)
  await expect(trail(page)).toHaveAttribute('data-current-setting', 'Population_BarNights')
  await expect(current(page)).toHaveText('Enable or Disable Bar Nights')
  await expect(current(page)).toHaveAttribute('title', /Population.*Population_BarNights/)
  await expect(trail(page).getByRole('link', { name: 'Population', exact: true })).toHaveAttribute('href', '#/settings/population')

  const apartment = page.locator('[data-setting="Bill_AmountPercentApartment"]')
  await scrollUnderHeader(page, apartment)
  await apartment.getByRole('textbox').focus()
  await expect(trail(page)).toHaveAttribute('data-current-setting', 'Bill_AmountPercentApartment')
  const bills = page.locator('[data-setting="Bill_Amount_Percent"]')
  await bills.getByRole('textbox').focus()
  await expect(trail(page)).toHaveAttribute('data-current-setting', 'Bill_Amount_Percent')
  await expect(current(page)).toHaveText('Change Bills Percent')
  await expect(page.locator('#list-title')).toContainText('All settings')
  await expect(page.locator('[data-category="all"]')).toHaveAttribute('aria-current', 'page')
  expect(await page.evaluate(() => ({ hash: location.hash, length: history.length, time: performance.timeOrigin }))).toEqual(before)
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await expect(current(page)).toHaveText('All settings')
  await expect(trail(page)).not.toHaveAttribute('data-current-setting')
})

test('collapsed lifespan and appearance groups show their real menu context and expanded profiles track independently', async ({ page }) => {
  await page.getByRole('button', { name: 'Show all', exact: true }).click()
  const humans = page.locator('[data-lifespan-group="human"]')
  await expect(humans.getByRole('button', { name: 'Edit details for Humans lifespans', exact: true })).toHaveAttribute('aria-expanded', 'false')
  await scrollUnderHeader(page, humans)
  await expect(current(page)).toHaveText('Humans')
  await expect(current(page)).toHaveAttribute('title', /Age.*Age Span Durations.*Humans/)
  await expect(trail(page)).not.toHaveAttribute('data-current-setting')

  const female = page.locator('[data-appearance-template-group="female"]')
  await scrollUnderHeader(page, female)
  await expect(current(page)).toHaveText('Female')
  await expect(current(page)).toHaveAttribute('title', /Create-a-Sim.*Define Appearance Template.*Female/)
  await expect(trail(page)).not.toHaveAttribute('data-current-setting')
  await female.getByRole('button', { name: 'Edit details for Female appearance templates', exact: true }).click()
  const adult = page.locator('[data-setting="Appearance_AF_Template"]')
  await adult.getByRole('textbox', { name: 'Adult female body ranges: Neck: Minimum', exact: true }).focus()
  await expect(trail(page)).toHaveAttribute('data-current-setting', 'Appearance_AF_Template')
  await expect(current(page)).toHaveText('Adult female body ranges')
  const youngAdult = page.locator('[data-setting="Appearance_YAF_Template"]')
  await youngAdult.getByRole('textbox', { name: 'Young adult female body ranges: Neck: Minimum', exact: true }).hover()
  await expect(trail(page)).toHaveAttribute('data-current-setting', 'Appearance_YAF_Template')
  await female.getByRole('button', { name: 'Hide details for Female appearance templates', exact: true }).click()
  await scrollUnderHeader(page, female)
  await expect(current(page)).toHaveText('Female')
  await expect(trail(page)).not.toHaveAttribute('data-current-setting')
  await expect(page).toHaveURL(/#\/settings$/)
})

test('search and modified results expose the setting path while invalid drafts survive ancestor navigation and Undo', async ({ page }) => {
  const source = { ...sample, Future_Scroll_Data: { value: '0005', items: [false, null, 'A,B'] } }
  await page.getByLabel('Import config file').setInputFiles({
    name: 'scroll-breadcrumbs.cfg', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(source)),
  })
  await expect(page.getByText('scroll-breadcrumbs.cfg', { exact: true })).toBeVisible()
  await page.locator('[data-category="core"]').click()
  await page.locator('[data-menu-path="Gameplay/Motive Decay"]').click()
  const before = await page.evaluate(() => ({ hash: location.hash, length: history.length, time: performance.timeOrigin }))
  const search = page.getByRole('textbox', { name: 'Search settings' })
  await search.fill('MotiveDecay_Sims')
  const sims = page.locator('[data-setting="MotiveDecay_Sims"]')
  await sims.getByRole('textbox').fill('501')
  await expect(trail(page)).toHaveAttribute('data-current-setting', 'MotiveDecay_Sims')
  await expect(current(page)).toHaveText('Sim Motive Decay Percent')
  await expect(trail(page).getByRole('link', { name: 'Motive Decay', exact: true })).toHaveAttribute('href', '#/settings/core/Gameplay/Motive%20Decay')
  await expect(search).toHaveValue('MotiveDecay_Sims')
  await expect(page.locator('#list-title')).toContainText('Search results')
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeDisabled()

  await search.fill('MotiveDecay_Dogs')
  const dogs = page.locator('[data-setting="MotiveDecay_Dogs"]')
  await dogs.getByRole('textbox').fill('200')
  await page.getByRole('button', { name: 'Clear search', exact: true }).click()
  await page.getByRole('button', { name: /^Modified only/ }).click()
  await dogs.getByRole('textbox').hover()
  await expect(page.locator('#list-title')).toContainText('Your changes')
  await expect(trail(page)).toHaveAttribute('data-current-setting', 'MotiveDecay_Dogs')
  expect(await page.evaluate(() => ({ hash: location.hash, length: history.length, time: performance.timeOrigin }))).toEqual(before)
  await trail(page).getByRole('link', { name: 'Gameplay', exact: true }).click()
  await expect(page).toHaveURL(/#\/settings\/core\/Gameplay$/)
  await expect(page.getByRole('button', { name: /^Modified only/ })).toHaveAttribute('aria-pressed', 'false')
  await expect(current(page)).toHaveText('Gameplay')
  await expect(trail(page)).not.toHaveAttribute('data-current-setting')
  await page.goBack()
  await expect(page.locator('#list-title')).toContainText('Motive Decay')
  await expect(sims.getByRole('textbox')).toHaveValue('501')
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeDisabled()
  await sims.getByRole('button', { name: /^Undo / }).click()
  expect(await exportConfig(page)).toEqual({ ...source, MotiveDecay_Dogs: 200 })
})

test('shared occult aging fields follow the interacted species and respect an explicitly selected species menu', async ({ page }) => {
  const search = page.getByRole('textbox', { name: 'Search settings' })
  await search.fill('Occult_OccultTypeAgeMultiplier')
  const multiplier = page.locator('[data-setting="Occult_OccultTypeAgeMultiplier"]')
  const fairyTeen = multiplier.locator('[data-occult-species="FR"]').getByRole('textbox', { name: 'Age Multiplier: Teen', exact: true })
  await fairyTeen.focus()
  await expect(trail(page)).toHaveAttribute('data-current-setting', 'Occult_OccultTypeAgeMultiplier')
  await expect(current(page)).toHaveText('Age Multiplier')
  await expect(current(page)).toHaveAttribute('title', /Occult.*Fairies.*Aging Settings.*Occult_OccultTypeAgeMultiplier/)
  await multiplier.locator('[data-occult-species="V"]').getByRole('textbox', { name: 'Age Multiplier: Child', exact: true }).hover()
  await expect(current(page)).toHaveAttribute('title', /Occult.*Vampires.*Aging Settings.*Occult_OccultTypeAgeMultiplier/)
  await expect(search).toHaveValue('Occult_OccultTypeAgeMultiplier')
  await expect(page).toHaveURL(/#\/settings$/)

  await page.locator('[data-category="occult"]').click()
  await page.locator('[data-menu-path="Fairies/Aging Settings"]').click()
  await fairyTeen.focus()
  await expect(current(page)).toHaveAttribute('title', /Occult.*Fairies.*Aging Settings.*Occult_OccultTypeAgeMultiplier/)
  await expect(page).toHaveURL(/#\/settings\/occult\/Fairies\/Aging%20Settings$/)
  await expect(multiplier.locator('[data-occult-species="V"]')).toBeHidden()
  await expect(multiplier).toHaveCount(1)
  expect(await exportConfig(page)).toEqual(sample)
})
