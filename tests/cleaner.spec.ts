import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import type { SettingsRecord } from '../src/lib/config'

const sample = JSON.parse(readFileSync(new URL('../mc_settings.cfg', import.meta.url), 'utf8')) as SettingsRecord
let importSequence = 0
const setting = (page: Page, key: string) => page.locator(`[data-setting="Cleaner_${key}"]`)

async function importConfig(page: Page, source: SettingsRecord) {
  const name = `cleaner-${++importSequence}.cfg`
  await page.getByLabel('Import config file').setInputFiles({ name, mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(source)) })
  await expect(page.getByText(name, { exact: true })).toBeVisible()
  await page.locator('[data-category="cleaner"]').click()
}

async function exportConfig(page: Page): Promise<SettingsRecord> {
  await page.getByRole('button', { name: /^Export\b/ }).click()
  const promise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download mc_settings.cfg', exact: true }).click()
  const path = await (await promise).path()
  expect(path).not.toBeNull()
  await expect(page.getByRole('dialog')).toBeHidden()
  return JSON.parse(readFileSync(path!, 'utf8')) as SettingsRecord
}

async function selectOption(page: Page, key: string, label: string) {
  await setting(page, key).getByRole('combobox').click()
  await page.getByRole('option', { name: label, exact: true }).click()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Your game. Your settings.' })).toBeVisible()
})

test('household choices change only the prefix while item definitions stay read-only and lossless', async ({ page }) => {
  const suffix = ' C,025,FUTURE_RULE,  '
  const source = {
    ...sample,
    Cleaner_CleanRelationships: `FUTURE_HOUSEHOLD,${suffix}`,
    Cleaner_CleanPetRelationships: ' C, 025 ',
    Cleaner_ItemCleaner: { future: ['0007', null, false], nested: { household: 'N,A' } },
    Future_Cleaner_Data: { raw: '0007', values: [null, false] },
  }
  await importConfig(page, source)
  await expect(page.locator('article[data-setting]:visible')).toHaveCount(12)
  await page.locator('[data-menu-path="Relationship Cleaner"]').click()
  await expect(page.locator('[data-cleaner-relationships-group] article[data-setting]:visible')).toHaveCount(3)
  await expect(setting(page, 'CleanRelationships').getByRole('combobox')).toContainText('FUTURE_HOUSEHOLD')
  expect(await exportConfig(page)).toEqual(source)
  await selectOption(page, 'CleanRelationships', 'Include Active Sims Only')
  expect(await exportConfig(page)).toEqual({ ...source, Cleaner_CleanRelationships: `AO,${suffix}` })
  await setting(page, 'CleanRelationships').getByRole('button', { name: 'Undo Households to Clean', exact: true }).click()
  expect(await exportConfig(page)).toEqual(source)
  await selectOption(page, 'CleanRelationships', 'Include Played Sims Only')

  await page.locator('[data-menu-path="Item Cleaner"]').click()
  const definitions = setting(page, 'ItemCleaner')
  expect(JSON.parse(await definitions.locator('[data-readonly-value]').innerText())).toEqual(source.Cleaner_ItemCleaner)
  await expect(definitions.locator('input, textarea, button, [role="combobox"], [role="switch"]')).toHaveCount(0)
  expect(await exportConfig(page)).toEqual({ ...source, Cleaner_CleanRelationships: `PO,${suffix}` })
})

test('pet relationship modes preserve unfamiliar values and export their exact string encodings and custom endpoints', async ({ page }) => {
  const source = { ...sample, Cleaner_CleanPetRelationships: 'FUTURE_PET_RULE,0007' }
  await importConfig(page, source)
  await page.locator('[data-menu-path="Relationship Cleaner"]').click()
  const pet = setting(page, 'CleanPetRelationships')
  await expect(pet.getByRole('combobox')).toContainText('FUTURE_PET_RULE,0007 (from file)')
  expect(await exportConfig(page)).toEqual(source)
  await selectOption(page, 'CleanPetRelationships', 'Custom Level Relationships')
  const precise = pet.getByRole('textbox', { name: 'Pet Relationships to Clean: Custom level', exact: true })
  const slider = pet.getByRole('slider', { name: 'Pet Relationships to Clean: Custom level', exact: true })
  await expect(precise).toHaveValue('25')
  await expect(slider).toHaveAttribute('aria-valuemin', '0')
  await expect(slider).toHaveAttribute('aria-valuemax', '100')
  expect(await exportConfig(page)).toEqual({ ...source, Cleaner_CleanPetRelationships: 'C,25' })
  await precise.fill('0')
  expect(await exportConfig(page)).toEqual({ ...source, Cleaner_CleanPetRelationships: 'C,0' })
  await slider.press('End')
  await expect(precise).toHaveValue('100')
  expect(await exportConfig(page)).toEqual({ ...source, Cleaner_CleanPetRelationships: 'C,100' })
  for (const [label, code] of [['Friends', 'F'], ['Zero Level Relationships', 'Z'], ['Acquaintances', 'A']]) {
    await selectOption(page, 'CleanPetRelationships', label!)
    await expect(precise).toBeHidden()
    expect(await exportConfig(page)).toEqual({ ...source, Cleaner_CleanPetRelationships: code })
  }
  await pet.getByRole('button', { name: 'Undo Pet Relationships to Clean', exact: true }).click()
  expect(await exportConfig(page)).toEqual(source)
})

test('invalid custom levels and relationship counts survive sibling edits and navigation until each is undone', async ({ page }) => {
  const source = { ...sample, Cleaner_CleanPetRelationships: 'C,25', Cleaner_LeaveRelationshipCount: 17 }
  await importConfig(page, source)
  await page.locator('[data-menu-path="Relationship Cleaner"]').click()
  const pet = setting(page, 'CleanPetRelationships')
  const count = setting(page, 'LeaveRelationshipCount')
  const precise = pet.getByRole('textbox', { name: 'Pet Relationships to Clean: Custom level', exact: true })
  await expect(count.getByRole('slider')).toHaveAttribute('aria-valuemin', '0')
  await expect(count.getByRole('slider')).toHaveAttribute('aria-valuemax', '100')
  await precise.fill('75')
  await count.getByRole('slider').press('Home')
  expect(await exportConfig(page)).toEqual({ ...source, Cleaner_CleanPetRelationships: 'C,75', Cleaner_LeaveRelationshipCount: 0 })
  await count.getByRole('slider').press('End')
  expect(await exportConfig(page)).toEqual({ ...source, Cleaner_CleanPetRelationships: 'C,75', Cleaner_LeaveRelationshipCount: 100 })
  for (const invalid of ['-1', '1.5', '101']) {
    await precise.fill(invalid)
    await expect(precise).toHaveAttribute('aria-invalid', 'true')
  }
  await count.getByRole('textbox').fill('-1')
  await selectOption(page, 'CleanRelationships', 'Include Played Households')
  await expect(precise).toHaveValue('101')
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeDisabled()
  await page.locator('[data-menu-path="Item Cleaner"]').click()
  await expect(pet).toBeAttached()
  await expect(pet).toBeHidden()
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeDisabled()
  await page.getByRole('textbox', { name: 'Search settings' }).fill('Cleaner_CleanPetRelationships')
  await expect(precise).toHaveValue('101')
  await expect(precise).toHaveAttribute('aria-invalid', 'true')
  await pet.getByRole('button', { name: 'Undo Pet Relationships to Clean', exact: true }).click()
  await expect(precise).toHaveValue('25')
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeDisabled()
  await page.getByRole('textbox', { name: 'Search settings' }).fill('Cleaner_LeaveRelationshipCount')
  await expect(count.getByRole('textbox')).toHaveValue('-1')
  for (const invalid of ['101', '1.5']) {
    await count.getByRole('textbox').fill(invalid)
    await expect(count.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  }
  await count.getByRole('button', { name: 'Undo Relationships to Leave', exact: true }).click()
  expect(await exportConfig(page)).toEqual({ ...source, Cleaner_CleanRelationships: 'P,A' })
})

test('partial and malformed Cleaner data keep their original types and never turn item definitions into editable controls', async ({ page }) => {
  const fixtures: SettingsRecord[] = [
    {
      Cleaner_CleanRelationships: 'N,', Cleaner_CleanPetRelationships: { future: [null, 'A'] },
      Cleaner_LeaveRelationshipCount: '007', Cleaner_ItemCleaner: false, Future_Cleaner_Data: { raw: '0007' },
    },
    {
      Cleaner_CleanRelationships: ['N', 'A'], Cleaner_CleanPetRelationships: 25,
      Cleaner_ItemCleaner: '0007', Future_Cleaner_Data: { raw: '0007' },
    },
    {
      Cleaner_CleanPetRelationships: ['C', 25], Cleaner_LeaveRelationshipCount: null,
      Cleaner_ItemCleaner: null, Future_Cleaner_Data: { raw: '0007' },
    },
  ]
  for (const source of fixtures) {
    await importConfig(page, source)
    const definitions = setting(page, 'ItemCleaner')
    expect(JSON.parse(await definitions.locator('[data-readonly-value]').innerText())).toEqual(source.Cleaner_ItemCleaner)
    await expect(definitions.locator('input, textarea, button, [role="combobox"], [role="switch"]')).toHaveCount(0)
    await expect(setting(page, 'CleanPetRelationships').locator('[data-pet-relationship-control]')).toHaveCount(0)
    await expect(setting(page, 'CleanRelationships').getByRole('combobox')).toHaveCount(0)
    await expect(setting(page, 'LeaveRelationshipCount').getByRole('slider')).toHaveCount(0)
    expect(await exportConfig(page)).toEqual(source)
  }
})
