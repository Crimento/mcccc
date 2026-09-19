import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import type { SettingsRecord } from '../src/lib/config'

const sample = JSON.parse(readFileSync(new URL('../mc_settings.cfg', import.meta.url), 'utf8')) as SettingsRecord

async function importConfig(page: Page, config: SettingsRecord) {
  await page.getByLabel('Import config file').setInputFiles({
    name: 'occult-pregnancy.cfg', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(config)),
  })
  await expect(page.getByText('occult-pregnancy.cfg', { exact: true })).toBeVisible()
}

async function findSetting(page: Page, key: string) {
  await page.getByRole('textbox', { name: 'Search settings' }).fill(key)
  const row = page.locator(`[data-setting="${key}"]`)
  await expect(row).toBeVisible()
  return row
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

test('occult outcome controls edit their original six- and seven-token CSV slots without normalizing other values', async ({ page }) => {
  const source = {
    ...sample,
    Occult_CustomPregnancyMermaidVampire: ' -1 , -1,020.0, 050,-1,-1',
    Occult_CustomPregnancyFairyAlien: '010.0, 020,-1, -1,-1,-1,050.0',
    Occult_CustomPregnancyVampireHuman: '-1,-1,050,-1,-1,-1, 777.00',
    Occult_CustomPregnancyWitchAlien: '000, 000,-1,-1,050,-1',
    Occult_RiskyVampPercentages: '030,30,30,30',
  }
  await importConfig(page, source)
  expect(await exportConfig(page)).toEqual(source)

  const mermaid = await findSetting(page, 'Occult_CustomPregnancyMermaidVampire')
  await expect(mermaid.getByRole('slider')).toHaveCount(3)
  await expect(mermaid.getByRole('textbox', { name: /: Human$/ })).toHaveValue('30')
  await expect(mermaid.getByRole('textbox', { name: /: Human$/ })).toHaveJSProperty('readOnly', true)
  await expect(mermaid.getByRole('slider', { name: /: Human$/ })).toBeDisabled()
  await mermaid.getByRole('slider', { name: /: Mermaid$/ }).press('ArrowRight')
  await mermaid.getByRole('textbox', { name: /: Vampire$/ }).fill('22.5')

  const fairy = await findSetting(page, 'Occult_CustomPregnancyFairyAlien')
  const order = await fairy.getByRole('textbox').evaluateAll(fields => fields.map(field => field.getAttribute('aria-label')!.split(':').at(-1)!.trim()))
  expect(order).toEqual(['Fairy', 'Hybrid', 'Alien', 'Human'])
  await fairy.getByRole('textbox', { name: /: Fairy$/ }).fill('55.5')
  await fairy.getByRole('textbox', { name: /: Hybrid$/ }).fill('30')
  await expect(fairy.getByRole('textbox', { name: /: Human$/ })).toHaveValue('4.5')
  await expect(fairy.getByRole('slider', { name: /: Fairy$/ })).toHaveAttribute('aria-valuemax', '60')
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeEnabled()

  const vampire = await findSetting(page, 'Occult_CustomPregnancyVampireHuman')
  await expect(vampire.getByRole('slider')).toHaveCount(2)
  await vampire.getByRole('textbox', { name: /: Vampire$/ }).fill('16.25')
  await expect(vampire.getByRole('textbox', { name: /: Human$/ })).toHaveValue('83.75')

  const spellcaster = await findSetting(page, 'Occult_CustomPregnancyWitchAlien')
  await expect(spellcaster.getByRole('textbox', { name: /: Human$/ })).toHaveValue('50')
  await spellcaster.getByRole('textbox', { name: /: Spellcaster$/ }).fill('80')
  await spellcaster.getByRole('textbox', { name: /: Hybrid$/ }).fill('20')
  await expect(spellcaster.getByRole('textbox', { name: /: Human$/ })).toHaveValue('0')
  await expect(spellcaster.getByRole('slider', { name: /: Alien$/ })).toHaveAttribute('aria-valuemax', '0')
  await expect(spellcaster.getByRole('slider', { name: /: Alien$/ })).toBeDisabled()

  const feeding = await findSetting(page, 'Occult_RiskyVampPercentages')
  await expect(feeding.getByRole('textbox')).toHaveCount(4)
  await expect(feeding.getByRole('slider')).toHaveCount(4)
  await feeding.getByRole('textbox').first().fill('40')
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeEnabled()
  expect(await exportConfig(page)).toEqual({
    ...source,
    Occult_CustomPregnancyMermaidVampire: ' -1 , -1,22.5,51,-1,-1',
    Occult_CustomPregnancyFairyAlien: '010.0,30,-1, -1,-1,-1,55.5',
    Occult_CustomPregnancyVampireHuman: '-1,-1,16.25,-1,-1,-1, 777.00',
    Occult_CustomPregnancyWitchAlien: '000,20,-1,-1,80,-1',
    Occult_RiskyVampPercentages: '40,30,30,30',
  })
})

test('over-budget drafts survive sibling edits and navigation until their allocation is valid or undone', async ({ page }) => {
  await importConfig(page, sample)
  const row = await findSetting(page, 'Occult_CustomPregnancyFairyAlien')
  const fairy = row.getByRole('textbox', { name: /: Fairy$/ })
  await fairy.fill('80')
  await row.getByRole('textbox', { name: /: Hybrid$/ }).fill('30')
  await expect(fairy).toHaveValue('80')
  await expect(fairy).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeDisabled()

  await page.locator('[data-category="core"]').click()
  await expect(row).toBeAttached()
  await expect(row).toBeHidden()
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeDisabled()
  await findSetting(page, 'Occult_CustomPregnancyFairyAlien')
  await expect(fairy).toHaveValue('80')
  await expect(row.getByRole('textbox', { name: /: Hybrid$/ })).toHaveValue('30')
  await row.getByRole('textbox', { name: /: Alien$/ }).fill('5.5')
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeDisabled()
  await fairy.fill('60')
  await expect(row.getByRole('textbox', { name: /: Human$/ })).toHaveValue('4.5')
  expect(await exportConfig(page)).toEqual({
    ...sample, Occult_CustomPregnancyFairyAlien: '5.5,30,-1,-1,-1,-1,60',
  })
  await row.getByRole('button', { name: /^Undo / }).click()
  expect(await exportConfig(page)).toEqual(sample)
})

test('imported over-budget values stay lossless while staged repairs and decimal allocations update only relevant tokens', async ({ page }) => {
  const key = 'Occult_CustomPregnancyWitchAlien'
  const source = { ...sample, [key]: '120, 110, -1,-1,080,-1, 777.00' }
  await importConfig(page, source)
  const row = await findSetting(page, key)
  const human = row.getByRole('textbox', { name: /: Human$/ })
  await expect(human).toHaveValue('Unavailable')
  await expect(human).toHaveJSProperty('readOnly', true)
  await expect(row.getByRole('slider', { name: /: Human$/ })).toHaveCount(0)
  expect(await exportConfig(page)).toEqual(source)
  await row.getByRole('textbox', { name: /: Alien$/ }).fill('20')
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeDisabled()
  await row.getByRole('textbox', { name: /: Hybrid$/ }).fill('20')
  await expect(row.getByRole('textbox', { name: /: Alien$/ })).toHaveValue('20')
  await expect(human).toHaveValue('Unavailable')
  await row.getByRole('textbox', { name: /: Spellcaster$/ }).fill('60')
  await expect(human).toHaveValue('0')
  expect(await exportConfig(page)).toEqual({ ...source, [key]: '20,20, -1,-1,60,-1, 777.00' })

  await row.getByRole('textbox', { name: /: Alien$/ }).fill('0')
  await row.getByRole('textbox', { name: /: Hybrid$/ }).fill('33.3')
  await row.getByRole('textbox', { name: /: Spellcaster$/ }).fill('66.7')
  await expect(human).toHaveValue('0')
  expect(await exportConfig(page)).toEqual({ ...source, [key]: '0,33.3, -1,-1,66.7,-1, 777.00' })
  await row.getByRole('textbox', { name: /: Spellcaster$/ }).fill('66.71')
  await expect(human).toHaveValue('Unavailable')
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeDisabled()
  await row.getByRole('button', { name: /^Undo / }).click()
  await expect(human).toHaveValue('Unavailable')
  expect(await exportConfig(page)).toEqual(source)
})

test('unsupported occult keys, missing fairy positions and unknown trailing tokens retain raw editors', async ({ page }) => {
  const overrides = {
    Occult_CustomPregnancyFairyHuman: '-1,-1,-1,-1,-1,50',
    Occult_CustomPregnancyAlienHuman: '10,20,-1,-1,-1,-1,FUTURE',
    Occult_CustomPregnancyFutureHuman: '0,0,-1,-1,-1,-1,50',
  }
  const source = { ...sample, ...overrides }
  await importConfig(page, source)
  for (const [key, value] of Object.entries(overrides)) {
    const row = await findSetting(page, key)
    await expect(row.getByRole('slider')).toHaveCount(0)
    await expect(row.getByRole('textbox')).toHaveValue(value)
  }
  expect(await exportConfig(page)).toEqual(source)
})
