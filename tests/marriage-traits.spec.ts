import { readFileSync } from 'node:fs'
import { expect, test, type Locator, type Page } from '@playwright/test'
import type { SettingsRecord } from '../src/lib/config'

const sample = JSON.parse(readFileSync(new URL('../mc_settings.cfg', import.meta.url), 'utf8')) as SettingsRecord

async function importConfig(page: Page, config: SettingsRecord) {
  await page.goto('/')
  await page.getByLabel('Import config file').setInputFiles({
    name: 'marriage-traits.cfg', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(config)),
  })
  await expect(page.getByText('marriage-traits.cfg', { exact: true })).toBeAttached()
}

async function findSetting(page: Page, key: string) {
  await page.getByRole('textbox', { name: 'Search settings' }).fill(key)
  const row = page.locator(`[data-setting="${key}"]`)
  await expect(row).toBeVisible()
  return row
}

async function pickTrait(page: Page, row: Locator, name: string, trait: string) {
  await row.getByRole('combobox', { name, exact: true }).fill(trait)
  await page.getByRole('option', { name: trait, exact: true }).click()
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

test('trait pairs remain nested and independent while explicit edits preserve unknown IDs and malformed entries', async ({ page }) => {
  const source = {
    ...sample,
    Marriage_RequiredTraitsList: [[], ['999999999999999999999999', ' 0007 '], ['16858', '203542'], [27419, '16858']],
    Marriage_ConflictTraitsList: [['27419', '341151']],
    Future_MarriageData: { numericString: '0003', nested: [true, null] },
  }
  await importConfig(page, source)
  const required = await findSetting(page, 'Marriage_RequiredTraitsList')
  const malformed = required.locator('[data-preserved-trait-pair]')
  await expect(malformed).toHaveCount(2)
  await expect(malformed.getByRole('combobox')).toHaveCount(0)
  await expect(malformed.getByRole('button', { name: /^Remove pair/ })).toHaveCount(0)
  const named = required.locator('[data-trait-pair-index="2"]')
  await expect(named.getByRole('combobox', { name: 'Required Traits: Pair 3, first trait', exact: true })).toHaveValue('Neat')
  await expect(named.getByRole('combobox', { name: 'Required Traits: Pair 3, second trait', exact: true })).toHaveValue('Paranoid')
  expect(await exportConfig(page)).toEqual(source)

  await pickTrait(page, required, 'Required Traits: Pair 2, first trait', 'Neat')
  const changed = [[], ['16858', ' 0007 '], ['16858', '203542'], [27419, '16858']]
  await expect(required.getByRole('button', { name: 'Add pair to Required Traits', exact: true })).toBeDisabled()
  await pickTrait(page, required, 'Required Traits: New pair, first trait', 'Neat')
  await expect(required.getByRole('button', { name: 'Add pair to Required Traits', exact: true })).toBeDisabled()
  // Selecting one side of the add form is only a draft, never an inserted pair.
  expect(await exportConfig(page)).toEqual({ ...source, Marriage_RequiredTraitsList: changed })
  await pickTrait(page, required, 'Required Traits: New pair, second trait', 'Paranoid')
  await required.getByRole('button', { name: 'Add pair to Required Traits', exact: true }).click()
  expect(await exportConfig(page)).toEqual({
    ...source, Marriage_RequiredTraitsList: [...changed, ['16858', '203542']],
  })
  await required.getByRole('button', { name: 'Remove pair 2 from Required Traits', exact: true }).click()
  const conflicts = await findSetting(page, 'Marriage_ConflictTraitsList')
  await pickTrait(page, conflicts, 'Conflicting Traits: Pair 1, second trait', 'Paranoid')
  expect(await exportConfig(page)).toEqual({
    ...source,
    Marriage_RequiredTraitsList: [changed[0], changed[2], changed[3], ['16858', '203542']],
    Marriage_ConflictTraitsList: [['27419', '203542']],
  })
  await findSetting(page, 'Marriage_RequiredTraitsList')
  await required.getByRole('button', { name: 'Undo Required Traits', exact: true }).click()
  expect(await exportConfig(page)).toEqual({ ...source, Marriage_ConflictTraitsList: [['27419', '203542']] })
  await findSetting(page, 'Marriage_ConflictTraitsList')
  await conflicts.getByRole('button', { name: 'Undo Conflicting Traits', exact: true }).click()
  expect(await exportConfig(page)).toEqual(source)
})

test('empty pair lists do not gain defaults and scalar imports keep their original types on mobile', async ({ page }) => {
  const source = {
    Marriage_RequiredTraitsList: [],
    Marriage_ConflictTraitsList: '16858,203542',
    Pregnancy_RelationshipOnly: 0,
    Pregnancy_AllowMalePregnancy: { future: 'S' },
    Pregnancy_PetPartnerAge: ['A', 'E'],
    Pregnancy_PetMaxOffspring: '0003',
    Pregnancy_AgeUpDaysLimit: '0000',
    Future_MarriageData: [null, { keep: '0007' }],
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await importConfig(page, source)
  const required = await findSetting(page, 'Marriage_RequiredTraitsList')
  await expect(required.locator('[data-trait-pair-index]')).toHaveCount(0)
  await expect(required.getByRole('combobox')).toHaveCount(2)
  await expect(required.getByRole('button', { name: 'Add pair to Required Traits', exact: true })).toBeDisabled()
  await pickTrait(page, required, 'Required Traits: New pair, first trait', 'Neat')
  const second = required.getByRole('combobox', { name: 'Required Traits: New pair, second trait', exact: true })
  await second.fill('999999999999999999999999')
  await expect(page.getByRole('option')).toHaveCount(0)
  await second.press('Escape')
  await expect(required.getByRole('button', { name: 'Add pair to Required Traits', exact: true })).toBeDisabled()
  const conflict = await findSetting(page, 'Marriage_ConflictTraitsList')
  await expect(conflict.locator('[data-marriage-trait-pairs]')).toHaveCount(0)
  await expect(conflict.getByRole('textbox')).toHaveValue('16858,203542')
  expect(await exportConfig(page)).toEqual(source)

  await findSetting(page, 'Marriage_RequiredTraitsList')
  await expect(required.getByRole('combobox', { name: 'Required Traits: New pair, first trait', exact: true })).toHaveValue('Neat')
  await pickTrait(page, required, 'Required Traits: New pair, second trait', 'Paranoid')
  await required.getByRole('button', { name: 'Add pair to Required Traits', exact: true }).click()
  expect(await exportConfig(page)).toEqual({ ...source, Marriage_RequiredTraitsList: [['16858', '203542']] })
  await required.getByRole('button', { name: 'Undo Required Traits', exact: true }).click()
  await expect(required.locator('[data-trait-pair-index]')).toHaveCount(0)
  expect(await exportConfig(page)).toEqual(source)
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1)
})
