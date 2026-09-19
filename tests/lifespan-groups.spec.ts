import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import type { SettingsRecord } from '../src/lib/config'
import { expandVisibleLifespanGroups } from './helpers/lifespans'

const sample = JSON.parse(readFileSync(new URL('../mc_settings.cfg', import.meta.url), 'utf8')) as SettingsRecord

async function importConfig(page: Page, config: SettingsRecord = sample) {
  await page.getByLabel('Import config file').setInputFiles({
    name: 'lifespan-groups.cfg', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(config)),
  })
  await expect(page.getByText('lifespan-groups.cfg', { exact: true })).toBeVisible()
  await page.locator('[data-category="core"]').click()
}

async function openSpecies(page: Page, species: 'Humans' | 'Cats' | 'Dogs' | 'Horses') {
  if (page.viewportSize()!.width < 1024) {
    await page.getByRole('button', { name: 'Open categories', exact: true }).click()
  }
  await page.locator(`[data-menu-path="Age/Age Span Durations/${species}"]`).click()
  await expect(page.locator('#list-title')).toContainText(species)
}

function humanField(page: Page, profile: 'Short' | 'Normal' | 'Long', age: string) {
  return page.locator(`[data-setting="AgeSpan${profile}"]`).getByRole('textbox', {
    name: `Human lifespan — ${profile}: ${age}`, exact: true,
  })
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

async function expectUniqueIds(page: Page) {
  const duplicates = await page.locator('[id]').evaluateAll(elements => {
    const seen = new Set<string>()
    return elements.flatMap(element => {
      if (seen.has(element.id)) return [element.id]
      seen.add(element.id)
      return []
    })
  })
  expect(duplicates).toEqual([])
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Your game. Your settings.' })).toBeVisible()
})

test('desktop lifespan columns align the same age and retain independent edits in all three profiles', async ({ page }) => {
  await importConfig(page)
  await openSpecies(page, 'Humans')
  await expect(page.getByRole('button', { name: 'Edit details for Humans lifespans', exact: true }))
    .toHaveAttribute('aria-expanded', 'false')
  await expect(page.locator('article[data-setting]:visible')).toHaveCount(0)
  await expandVisibleLifespanGroups(page)
  await expect(page.locator('article[data-setting]:visible')).toHaveCount(3)
  const bounds = []
  for (const profile of ['Short', 'Normal', 'Long'] as const) {
    const field = humanField(page, profile, 'Adult')
    await expect(field).toBeVisible()
    const box = await field.boundingBox()
    expect(box).not.toBeNull()
    bounds.push(box!)
  }
  expect(bounds[0]!.x).toBeLessThan(bounds[1]!.x)
  expect(bounds[1]!.x).toBeLessThan(bounds[2]!.x)
  expect(Math.max(...bounds.map(box => box.y)) - Math.min(...bounds.map(box => box.y))).toBeLessThanOrEqual(2)
  await humanField(page, 'Short', 'Adult').fill('42')
  await humanField(page, 'Normal', 'Newborn').fill('0.25')
  await humanField(page, 'Long', 'Elder').fill('50.5')
  await expectUniqueIds(page)
  expect(await exportConfig(page)).toEqual({
    ...sample,
    AgeSpanShort: { ...(sample.AgeSpanShort as SettingsRecord), Adult: 42 },
    AgeSpanNormal: { ...(sample.AgeSpanNormal as SettingsRecord), Baby: 0.25 },
    AgeSpanLong: { ...(sample.AgeSpanLong as SettingsRecord), Elder: 50.5 },
  })
})

test('mobile collapse and tabs keep invalid drafts across species and exact-key search while Undo affects only its profile', async ({ page }) => {
  await importConfig(page)
  await openSpecies(page, 'Humans')
  await expandVisibleLifespanGroups(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('tab', { name: /Normal$/ }).click()
  const normal = page.locator('[data-setting="AgeSpanNormal"]')
  await humanField(page, 'Normal', 'Newborn').fill('-1')
  await page.getByRole('button', { name: 'Hide details for Humans lifespans', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Edit details for Humans lifespans', exact: true }))
    .toHaveAttribute('aria-expanded', 'false')
  await expect(normal).toBeAttached()
  await expect(normal).toBeHidden()
  await expect(normal.getByRole('textbox', { name: 'Human lifespan — Normal: Newborn', exact: true, includeHidden: true }))
    .toHaveValue('-1')
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeDisabled()
  await expandVisibleLifespanGroups(page)
  await expect(humanField(page, 'Normal', 'Newborn')).toHaveValue('-1')
  await expect(humanField(page, 'Normal', 'Newborn')).toHaveAttribute('aria-invalid', 'true')
  await page.getByRole('tab', { name: /Short$/ }).click()
  await humanField(page, 'Short', 'Adult').fill('42')
  await expect(normal).toBeAttached()
  await expect(normal).toBeHidden()
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeDisabled()

  await openSpecies(page, 'Cats')
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeDisabled()
  await openSpecies(page, 'Humans')
  await page.getByRole('textbox', { name: 'Search settings' }).fill('AgeSpanNormal')
  await expect(page.locator('article[data-setting]:visible')).toHaveCount(1)
  await expect(humanField(page, 'Normal', 'Newborn')).toHaveValue('-1')
  await expect(humanField(page, 'Normal', 'Newborn')).toHaveAttribute('aria-invalid', 'true')
  await expectUniqueIds(page)
  const width = await page.evaluate(() => Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - window.innerWidth)
  expect(width).toBeLessThanOrEqual(1)

  await normal.getByRole('button', { name: /^Undo / }).click()
  await expect(humanField(page, 'Normal', 'Newborn')).toHaveValue('0')
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeEnabled()
  await page.getByRole('button', { name: 'Clear search', exact: true }).click()
  await page.getByRole('tab', { name: /Short$/ }).click()
  await expect(humanField(page, 'Short', 'Adult')).toHaveValue('42')
  expect(await exportConfig(page)).toEqual({ ...sample, AgeSpanShort: { ...(sample.AgeSpanShort as SettingsRecord), Adult: 42 } })
})

test('partial lifespan imports keep missing profiles and ages absent and preserve unfamiliar field values', async ({ page }) => {
  const source = {
    AgeSpanShort: {
      Adult: 0, Baby: 0, FutureStage: 5000, FutureText: '0007', FutureData: [null, true, { code: 'A,B' }],
      heading: 'future heading', 'raw-json': '0012', 'Baby-slider': 15,
    },
    AgeSpanLong: { Elder: 0, Child: '007' },
    AgeSpanCatNormal: { Child: 0 },
    FutureRoot: { text: '0012', values: [false, null] },
  }
  await importConfig(page, source)
  await openSpecies(page, 'Humans')
  await expandVisibleLifespanGroups(page)
  await expect(page.locator('[data-setting="AgeSpanNormal"]')).toHaveCount(0)
  await expect(page.locator('article[data-setting]:visible')).toHaveCount(2)
  expect(await exportConfig(page)).toEqual(source)
  await humanField(page, 'Short', 'Newborn').fill('0.25')
  await humanField(page, 'Long', 'Elder').fill('120')
  await expect(humanField(page, 'Long', 'Child')).toHaveValue('007')
  await expectUniqueIds(page)
  expect(await exportConfig(page)).toEqual({
    ...source,
    AgeSpanShort: { ...source.AgeSpanShort, Baby: 0.25 },
    AgeSpanLong: { ...source.AgeSpanLong, Elder: 120 },
  })
})
