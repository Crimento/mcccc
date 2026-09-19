import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import type { SettingsRecord } from '../src/lib/config'

const sample = JSON.parse(readFileSync(new URL('../mc_settings.cfg', import.meta.url), 'utf8')) as SettingsRecord
let importSequence = 0

async function importConfig(page: Page, config: SettingsRecord = sample) {
  const name = `woohoo-${++importSequence}.cfg`
  await page.getByLabel('Import config file').setInputFiles({
    name, mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(config)),
  })
  await expect(page.getByText(name, { exact: true })).toBeVisible()
  await page.locator('[data-category="woohoo"]').click()
}

async function openMenu(page: Page, path: string, count: number) {
  await page.locator(`[data-menu-path="${path}"]`).click()
  await expect(page.locator('article[data-setting]:visible')).toHaveCount(count)
  return page.locator('article[data-setting]:visible').evaluateAll(rows => rows.map(row => row.getAttribute('data-setting')!))
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

test('WooHoo navigation retains all 35 settings and preserves unknown codes, malformed CSV and incompatible imported types', async ({ page }) => {
  const source = {
    ...sample,
    Woohoo_RiskyWoohooPercents: '005,20,FUTURE,40,50',
    Woohoo_SameSexPregnantSim: 'future:recipient:0007',
    Woohoo_OppositeSexPregnantSim: 'future:recipient:0003',
    Woohoo_NudeWoohooGender: 'F,FUTURE_GENDER',
    Woohoo_NudityAges: 'YA,A,FUTURE_AGE',
    Future_WoohooData: { numericString: '0007', values: [true, null, { token: 'A,B' }] },
  }
  await importConfig(page, source)
  const rows = page.locator('article[data-setting]:visible')
  await expect(rows).toHaveCount(35)
  const allKeys = await rows.evaluateAll(nodes => nodes.map(node => node.getAttribute('data-setting')!))
  expect(new Set(allKeys)).toEqual(new Set(Object.keys(sample).filter(key => key.startsWith('Woohoo_'))))

  const branches = [
    ['WooHoo Actions', 7], ['WooHoo Pregnancy', 5], ['WooHoo Reactions', 4],
    ['Sim Nudity', 11], ['Other Settings', 8],
  ] as const
  const covered: string[] = []
  for (const [path, count] of branches) covered.push(...await openMenu(page, path, count))
  expect(covered).toHaveLength(35)
  expect(new Set(covered)).toEqual(new Set(allKeys))

  await openMenu(page, 'Sim Nudity', 11)
  const genders = page.locator('[data-setting="Woohoo_NudeWoohooGender"]')
  await expect(genders.getByRole('checkbox', { name: /: Female$/ })).toBeChecked()
  await expect(genders.getByRole('checkbox', { name: /: Male$/ })).not.toBeChecked()
  await expect(genders.getByRole('checkbox', { name: /FUTURE_GENDER \(from file\)/ })).toBeChecked()
  const ages = page.locator('[data-setting="Woohoo_NudityAges"]')
  await expect(ages.getByRole('checkbox')).toHaveCount(5)
  await expect(ages.getByRole('checkbox', { name: /FUTURE_AGE \(from file\)/ })).toBeChecked()
  await openMenu(page, 'Sim Nudity/Nudity Interactions', 8)
  await expect(rows.getByRole('switch')).toHaveCount(8)

  await openMenu(page, 'WooHoo Pregnancy', 5)
  for (const key of ['Woohoo_SameSexPregnantSim', 'Woohoo_OppositeSexPregnantSim'] as const) {
    const row = page.locator(`[data-setting="${key}"]`)
    await expect(row.getByRole('checkbox', { name: new RegExp(`${source[key]} \\(from file\\)`) })).toBeChecked()
    await expect(row.getByRole('textbox')).toHaveCount(0)
    await expect(row.getByRole('combobox')).toHaveCount(0)
  }
  const risky = page.locator('[data-setting="Woohoo_RiskyWoohooPercents"]')
  await expect(risky.getByRole('slider')).toHaveCount(0)
  await expect(risky.getByRole('textbox')).toHaveValue(source.Woohoo_RiskyWoohooPercents)
  expect(await exportConfig(page)).toEqual(source)

  const same = page.locator('[data-setting="Woohoo_SameSexPregnantSim"]')
  const opposite = page.locator('[data-setting="Woohoo_OppositeSexPregnantSim"]')
  for (const label of ['Target', 'Initiator']) await same.getByRole('checkbox', { name: new RegExp(`: ${label}$`) }).check()
  for (const label of ['Female', 'Male', 'Target', 'Initiator']) await opposite.getByRole('checkbox', { name: new RegExp(`: ${label}$`) }).check()
  expect(await exportConfig(page)).toEqual({
    ...source,
    Woohoo_SameSexPregnantSim: 'future:recipient:0007,T,I',
    Woohoo_OppositeSexPregnantSim: 'future:recipient:0003,F,M,T,I',
  })
  await opposite.getByRole('checkbox', { name: /: Female$/ }).uncheck()
  await opposite.getByRole('checkbox', { name: /: Target$/ }).uncheck()
  await same.getByRole('button', { name: 'Undo Same Sex Pregnancy Sim', exact: true }).click()
  expect(await exportConfig(page)).toEqual({ ...source, Woohoo_OppositeSexPregnantSim: 'future:recipient:0003,M,I' })
  await opposite.getByRole('button', { name: 'Undo Opposite Sex Pregnancy Sim', exact: true }).click()
  expect(await exportConfig(page)).toEqual(source)

  const incompatible = {
    ...source,
    Woohoo_RiskyWoohooPercents: [5, '020', null, { future: true }],
    Woohoo_SameSexPregnantSim: ['T', 'I'],
    Woohoo_OppositeSexPregnantSim: { future: 'F' },
  }
  await importConfig(page, incompatible)
  await openMenu(page, 'WooHoo Pregnancy', 5)
  await expect(risky.getByRole('slider')).toHaveCount(0)
  await expect(risky.getByRole('button', { name: 'Edit details for Risky WooHoo Percent', exact: true })).toBeVisible()
  for (const row of [same, opposite]) {
    await expect(row.getByRole('checkbox')).toHaveCount(0)
    await expect(row.getByRole('button', { name: /^Edit details for / })).toBeVisible()
  }
  expect(await exportConfig(page)).toEqual(incompatible)
})

test('WooHoo percentages preserve raw sibling tokens and invalid drafts remain blocked across menus and independent edits', async ({ page }) => {
  const source = { ...sample, Woohoo_RiskyWoohooPercents: '005, 020,30.0,40' }
  await importConfig(page, source)
  await openMenu(page, 'WooHoo Pregnancy', 5)
  const same = page.locator('[data-setting="Woohoo_SameSexPregnantSim"]')
  const opposite = page.locator('[data-setting="Woohoo_OppositeSexPregnantSim"]')
  await expect(same.getByRole('checkbox', { checked: true })).toHaveCount(1)
  await expect(same.getByRole('checkbox', { name: /: Target$/ })).toBeChecked()
  await expect(opposite.getByRole('checkbox', { checked: true })).toHaveCount(1)
  await expect(opposite.getByRole('checkbox', { name: /: Female$/ })).toBeChecked()
  const risky = page.locator('[data-setting="Woohoo_RiskyWoohooPercents"]')
  await expect(risky.getByRole('slider')).toHaveCount(4)
  const youngAdult = risky.getByRole('textbox', { name: /: Young Adult$/ })
  await risky.getByRole('slider', { name: /: Young Adult$/ }).press('ArrowRight')
  await expect(youngAdult).toHaveValue('21')
  await youngAdult.fill('42.5')
  expect(await exportConfig(page)).toEqual({ ...source, Woohoo_RiskyWoohooPercents: '005,42.5,30.0,40' })

  const teen = risky.getByRole('textbox', { name: /: Teen$/ })
  await teen.fill('101')
  await risky.getByRole('textbox', { name: /: Adult$/ }).fill('70.5')
  await expect(teen).toHaveValue('101')
  await expect(teen).toHaveAttribute('aria-invalid', 'true')
  const chance = page.locator('[data-setting="Woohoo_TryForBabyPercent"]')
  await expect(chance.getByRole('slider')).toHaveAttribute('aria-valuemin', '0')
  await expect(chance.getByRole('slider')).toHaveAttribute('aria-valuemax', '100')
  await chance.getByRole('textbox').fill('62.5')
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeDisabled()

  await openMenu(page, 'Other Settings', 8)
  await expect(risky).toBeAttached()
  await expect(risky).toBeHidden()
  const duration = page.locator('[data-setting="Woohoo_BirthControlDuration"]')
  await expect(duration.getByRole('slider')).toHaveAttribute('aria-valuemin', '1')
  await expect(duration.getByRole('slider')).toHaveAttribute('aria-valuemax', '24')
  await expect(duration.getByText('hours', { exact: true })).toBeVisible()
  await duration.getByRole('slider').press('End')
  await expect(duration.getByRole('textbox')).toHaveValue('24')
  await duration.getByRole('textbox').fill('25')
  await expect(duration.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  const rest = page.locator('[data-setting="Woohoo_AutonomousMinRestTime"]')
  await expect(rest.getByText('hours', { exact: true })).toBeVisible()
  await expect(rest.getByRole('slider')).toHaveAttribute('aria-valuemin', '0')
  await expect(rest.getByRole('slider')).toHaveAttribute('aria-valuemax', '24')

  await openMenu(page, 'WooHoo Pregnancy', 5)
  await expect(teen).toHaveValue('101')
  await expect(risky.getByRole('textbox', { name: /: Adult$/ })).toHaveValue('70.5')
  await risky.getByRole('button', { name: /^Undo / }).click()
  await expect(risky.getByRole('textbox', { name: /: Teen$/ })).toHaveValue('5')
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeDisabled()
  await openMenu(page, 'Other Settings', 8)
  await expect(duration.getByRole('textbox')).toHaveValue('25')
  await duration.getByRole('textbox').fill('24')
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeEnabled()
  expect(await exportConfig(page)).toEqual({ ...source, Woohoo_TryForBabyPercent: 62.5, Woohoo_BirthControlDuration: 24 })
})
