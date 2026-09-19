import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import type { SettingsRecord } from '../src/lib/config'

const sample = JSON.parse(readFileSync(new URL('../mc_settings.cfg', import.meta.url), 'utf8')) as SettingsRecord
const decayKeys = [
  'MotiveDecay_Sims', 'Pregnancy_BabyMotiveDecay', 'MotiveDecay_Vampires',
  'MotiveDecay_Cats', 'MotiveDecay_Dogs', 'MotiveDecay_Horses',
  'Decay_Ratio_Fame', 'Decay_Ratio_Prestige',
]

function setting(page: Page, key: string) {
  return page.locator(`article[data-setting="${key}"]`)
}

async function importConfig(page: Page, config: SettingsRecord = sample) {
  await page.getByLabel('Import config file').setInputFiles({
    name: 'motive-decay.cfg', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(config)),
  })
  await expect(page.getByText('motive-decay.cfg', { exact: true })).toBeVisible()
  await page.locator('[data-category="core"]').click()
  await page.locator('[data-menu-path="Gameplay/Motive Decay"]').click()
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

test('all eight motive decay sliders start at 100 and export independent boundary changes', async ({ page }) => {
  await importConfig(page)
  const group = page.locator('[data-motive-decay-group]')
  await expect(group).toBeVisible()
  await expect(group.locator('article[data-setting]:visible')).toHaveCount(8)
  expect(await group.locator('article[data-setting]').evaluateAll(rows => rows.map(row => row.getAttribute('data-setting'))))
    .toEqual(decayKeys)
  for (const key of decayKeys) {
    const row = setting(page, key)
    await expect(row.getByRole('slider')).toHaveAttribute('aria-valuemin', '0')
    await expect(row.getByRole('slider')).toHaveAttribute('aria-valuemax', '500')
    await expect(row.getByRole('slider')).toHaveAttribute('aria-valuenow', '100')
    await expect(row.getByRole('textbox')).toHaveValue('100')
  }
  expect(await exportConfig(page)).toEqual(sample)

  const sims = setting(page, 'MotiveDecay_Sims')
  const babies = setting(page, 'Pregnancy_BabyMotiveDecay')
  const fame = setting(page, 'Decay_Ratio_Fame')
  await sims.getByRole('slider', { name: 'Sim Motive Decay Percent', exact: true }).press('Home')
  await babies.getByRole('slider', { name: 'Baby Motive Decay Percent', exact: true }).press('End')
  await fame.getByRole('textbox').fill('125')
  await expect(sims.getByRole('textbox')).toHaveValue('0')
  await expect(babies.getByRole('textbox')).toHaveValue('500')
  await expect(fame.getByRole('slider')).toHaveAttribute('aria-valuenow', '125')
  expect(await exportConfig(page)).toEqual({
    ...sample, MotiveDecay_Sims: 0, Pregnancy_BabyMotiveDecay: 500, Decay_Ratio_Fame: 125,
  })
})

test('invalid motive drafts survive sibling edits and mobile navigation until each setting is undone', async ({ page }) => {
  await importConfig(page)
  const sims = setting(page, 'MotiveDecay_Sims')
  const babies = setting(page, 'Pregnancy_BabyMotiveDecay')
  await sims.getByRole('textbox').fill('501')
  await babies.getByRole('textbox').fill('99.5')
  await setting(page, 'Decay_Ratio_Fame').getByRole('textbox').fill('200')
  await expect(sims.getByRole('textbox')).toHaveValue('501')
  await expect(babies.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeDisabled()

  await page.setViewportSize({ width: 390, height: 844 })
  await expectNoHorizontalOverflow(page)
  await page.getByRole('button', { name: 'Open categories', exact: true }).click()
  await page.locator('[data-menu-path="Money Settings"]').click()
  await expect(sims).toBeAttached()
  await expect(sims).toBeHidden()
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeDisabled()
  const search = page.getByRole('textbox', { name: 'Search settings' })
  await search.fill('MotiveDecay_Sims')
  await expect(sims.getByRole('textbox')).toHaveValue('501')
  await expect(sims.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  await page.getByRole('button', { name: 'Clear search', exact: true }).click()
  await expect(sims).toBeHidden()
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeDisabled()

  await search.fill('Pregnancy_BabyMotiveDecay')
  await expect(babies.getByRole('textbox')).toHaveValue('99.5')
  await babies.getByRole('button', { name: 'Undo Baby Motive Decay Percent', exact: true }).click()
  await expect(babies.getByRole('textbox')).toHaveValue('100')
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeDisabled()
  await search.fill('MotiveDecay_Sims')
  await sims.getByRole('button', { name: 'Undo Sim Motive Decay Percent', exact: true }).click()
  await expect(sims.getByRole('textbox')).toHaveValue('100')
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeEnabled()
  await expectNoHorizontalOverflow(page)
  expect(await exportConfig(page)).toEqual({ ...sample, Decay_Ratio_Fame: 200 })
})

test('partial motive imports preserve malformed types, unknown fields and untouched numeric outliers', async ({ page }) => {
  const source = {
    MotiveDecay_Sims: 725,
    Pregnancy_BabyMotiveDecay: '0100',
    MotiveDecay_Vampires: null,
    MotiveDecay_Horses: { future: [null, '007', true] },
    Decay_Ratio_Fame: 100,
    Decay_Ratio_Prestige: false,
    MotiveDecay_Future: ['0001', { enabled: true }],
    Autosave_CurrentSaveNumber: '0003',
  }
  await importConfig(page, source)
  await expect(page.locator('[data-motive-decay-group] article[data-setting]:visible')).toHaveCount(6)
  for (const key of ['MotiveDecay_Cats', 'MotiveDecay_Dogs']) await expect(setting(page, key)).toHaveCount(0)
  await expect(setting(page, 'MotiveDecay_Sims').getByRole('textbox')).toHaveValue('725')
  await expect(setting(page, 'MotiveDecay_Sims').getByRole('slider')).toBeDisabled()
  await expect(setting(page, 'Pregnancy_BabyMotiveDecay').getByRole('textbox')).toHaveValue('0100')
  for (const key of ['Pregnancy_BabyMotiveDecay', 'MotiveDecay_Vampires', 'MotiveDecay_Horses', 'Decay_Ratio_Prestige']) {
    await expect(setting(page, key).getByRole('slider')).toHaveCount(0)
  }
  await expect(setting(page, 'Decay_Ratio_Prestige').getByRole('switch')).not.toBeChecked()
  expect(await exportConfig(page)).toEqual(source)

  await setting(page, 'Decay_Ratio_Fame').getByRole('textbox').fill('250')
  expect(await exportConfig(page)).toEqual({ ...source, Decay_Ratio_Fame: 250 })
})
