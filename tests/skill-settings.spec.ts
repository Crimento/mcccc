import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import type { SettingsRecord } from '../src/lib/config'

const sample = JSON.parse(readFileSync(new URL('../mc_settings.cfg', import.meta.url), 'utf8')) as SettingsRecord
const lists = {
  Skill_Difficulty_Blacklist: 'Skill Difficulty Exclude List',
  Skill_Difficulty_Whitelist: 'Skill Difficulty Include List',
  Skill_Freeze_List: 'Skill Freeze Progression List',
  Skill_Cheats_Bypass: 'Bypass Skill List',
} as const
type ListKey = keyof typeof lists
const unknownId = '900719925474099312345'
let importSequence = 0

function setting(page: Page, key: string) {
  return page.locator(`article[data-setting="${key}"]`)
}

async function importConfig(page: Page, config: SettingsRecord, replaceExisting = false) {
  const name = `skill-settings-${++importSequence}.cfg`
  await page.getByLabel('Import config file').setInputFiles({
    name, mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(config)),
  })
  if (replaceExisting) {
    await page.getByRole('button', { name: 'Import new configuration', exact: true }).click()
  }
  await expect(page.getByText(name, { exact: true })).toBeVisible()
  await page.locator('[data-category="core"]').click()
  await page.locator('[data-menu-path="Gameplay/Skill Settings"]').click()
}

async function openSkills(page: Page, key: ListKey) {
  const row = setting(page, key)
  await row.getByRole('button', { name: `Edit skills for ${lists[key]}`, exact: true }).click()
  await expect(row.getByRole('button', { name: `Close skills for ${lists[key]}`, exact: true }))
    .toHaveAttribute('aria-expanded', 'true')
  return row
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

test('four independent skill lists preserve unknown raw tokens when verified skills and difficulty change', async ({ page }) => {
  const source = {
    ...sample,
    Skill_Difficulty_Blacklist: ` 16699 , 000777,${unknownId}, 000777 ,0016699`,
    Skill_Difficulty_Whitelist: `16705,274197, ${unknownId} `,
    Skill_Freeze_List: '194727,255249, 000777,000777',
    Skill_Cheats_Bypass: ` 16699, ${unknownId},${unknownId} `,
    Future_Skill_Data: { IDs: ['000777', unknownId], values: [null, false] },
  }
  await importConfig(page, source)
  const group = page.locator('[data-skill-settings-group]')
  await expect(group.locator('article[data-setting]:visible')).toHaveCount(5)
  for (const [key, label] of Object.entries(lists)) {
    await expect(setting(page, key).getByRole('button', { name: `Edit skills for ${label}`, exact: true }))
      .toHaveAttribute('aria-expanded', 'false')
  }
  expect(await exportConfig(page)).toEqual(source)

  const blacklist = await openSkills(page, 'Skill_Difficulty_Blacklist')
  await expect(blacklist).toContainText(unknownId)
  await expect(blacklist.getByRole('checkbox', { name: /000777|0016699|900719925474099312345/ })).toHaveCount(0)
  await blacklist.getByRole('checkbox', { name: `${lists.Skill_Difficulty_Blacklist}: Charisma`, exact: true }).uncheck()
  const whitelist = await openSkills(page, 'Skill_Difficulty_Whitelist')
  await expect(whitelist.getByRole('checkbox', { name: `${lists.Skill_Difficulty_Whitelist}: Cooking`, exact: true })).toBeChecked()
  await whitelist.getByRole('checkbox', { name: `${lists.Skill_Difficulty_Whitelist}: Acting`, exact: true }).check()
  await expect(whitelist.getByRole('checkbox', { name: `${lists.Skill_Difficulty_Whitelist}: Entrepreneur`, exact: true })).toBeChecked()
  await expect(whitelist.getByRole('checkbox', { name: `${lists.Skill_Difficulty_Whitelist}: Fabrication`, exact: true })).not.toBeChecked()
  await whitelist.getByRole('checkbox', { name: `${lists.Skill_Difficulty_Whitelist}: Fabrication`, exact: true }).check()
  const freeze = await openSkills(page, 'Skill_Freeze_List')
  await expect(freeze.getByRole('checkbox', { name: `${lists.Skill_Freeze_List}: Acting`, exact: true })).toBeChecked()
  await freeze.getByRole('checkbox', { name: `${lists.Skill_Freeze_List}: Cooking`, exact: true }).check()
  await expect(freeze.getByRole('checkbox', { name: `${lists.Skill_Freeze_List}: Medium`, exact: true })).toBeChecked()
  await expect(freeze.getByRole('checkbox', { name: `${lists.Skill_Freeze_List}: Media Production`, exact: true })).not.toBeChecked()
  await freeze.getByRole('checkbox', { name: `${lists.Skill_Freeze_List}: Media Production`, exact: true }).check()
  const bypass = await openSkills(page, 'Skill_Cheats_Bypass')
  await bypass.getByRole('checkbox', { name: `${lists.Skill_Cheats_Bypass}: Charisma`, exact: true }).uncheck()
  await bypass.getByRole('checkbox', { name: `${lists.Skill_Cheats_Bypass}: Acting`, exact: true }).check()

  const adjustment = setting(page, 'Skill_Difficulty_Adjustment')
  await expect(adjustment.getByRole('slider')).toHaveAttribute('aria-valuemin', '-50')
  await expect(adjustment.getByRole('slider')).toHaveAttribute('aria-valuemax', '10')
  await adjustment.getByRole('slider', { name: 'Skill Difficulty Adjustment', exact: true }).press('Home')
  await expect(adjustment.getByRole('textbox')).toHaveValue('-50')
  expect(await exportConfig(page)).toEqual({
    ...source,
    Skill_Difficulty_Adjustment: -50,
    Skill_Difficulty_Blacklist: ` 000777,${unknownId}, 000777 ,0016699`,
    Skill_Difficulty_Whitelist: `16705,274197, ${unknownId} ,194727,231908`,
    Skill_Freeze_List: '194727,255249, 000777,000777,16705,192655',
    Skill_Cheats_Bypass: ` ${unknownId},${unknownId} ,194727`,
  })
})

test('skill picker search and selections survive collapse while invalid difficulty survives mobile navigation', async ({ page }) => {
  const source = { ...sample, Skill_Freeze_List: ` ${unknownId} ` }
  await importConfig(page, source)
  await page.setViewportSize({ width: 390, height: 844 })
  const adjustment = setting(page, 'Skill_Difficulty_Adjustment')
  await adjustment.getByRole('textbox').fill('11')
  const freeze = await openSkills(page, 'Skill_Freeze_List')
  const search = freeze.getByRole('searchbox', { name: `Search skills for ${lists.Skill_Freeze_List}`, exact: true })
  await search.fill('Charisma')
  const charisma = freeze.getByRole('checkbox', { name: `${lists.Skill_Freeze_List}: Charisma`, exact: true })
  await charisma.check()
  await expect(freeze.getByRole('checkbox')).toHaveCount(1)
  await freeze.getByRole('button', { name: `Close skills for ${lists.Skill_Freeze_List}`, exact: true }).click()
  await expect(charisma).toBeHidden()
  await openSkills(page, 'Skill_Freeze_List')
  await expect(search).toHaveValue('Charisma')
  await expect(charisma).toBeChecked()
  await expect(adjustment.getByRole('textbox')).toHaveValue('11')
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeDisabled()
  await expectNoHorizontalOverflow(page)

  await page.getByRole('button', { name: 'Open categories', exact: true }).click()
  await page.locator('[data-menu-path="Money Settings"]').click()
  await expect(adjustment).toBeAttached()
  await expect(adjustment).toBeHidden()
  await page.getByRole('textbox', { name: 'Search settings' }).fill('Skill_Difficulty_Adjustment')
  await expect(adjustment.getByRole('textbox')).toHaveValue('11')
  await expect(adjustment.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  await adjustment.getByRole('textbox').fill('0.5')
  await expect(adjustment.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  await adjustment.getByRole('button', { name: 'Undo Skill Difficulty Adjustment', exact: true }).click()
  await expect(adjustment.getByRole('textbox')).toHaveValue('0')
  await expect(page.getByRole('button', { name: /^Export\b/ })).toBeEnabled()
  await page.getByRole('textbox', { name: 'Search settings' }).fill('Skill_Freeze_List')
  await expect(search).toHaveValue('Charisma')
  await expect(charisma).toBeChecked()
  await expectNoHorizontalOverflow(page)
  expect(await exportConfig(page)).toEqual({ ...source, Skill_Freeze_List: ` ${unknownId} ,16699` })
})

test('partial and incompatible skill imports retain their types and do not carry learned names or selections into another file', async ({ page }) => {
  const source = {
    Skill_Difficulty_Blacklist: [16699, '000777'],
    Skill_Difficulty_Whitelist: null,
    Skill_Freeze_List: { skill: '16705', unknown: [false, '001'] },
    Skill_Cheats_Bypass: ` ${unknownId} ,000777`,
    Future_Skill_Data: { numericString: '0007', nested: [null, true] },
  }
  await importConfig(page, source)
  await expect(page.locator('[data-skill-settings-group] article[data-setting]:visible')).toHaveCount(4)
  await expect(setting(page, 'Skill_Difficulty_Adjustment')).toHaveCount(0)
  for (const key of ['Skill_Difficulty_Blacklist', 'Skill_Difficulty_Whitelist', 'Skill_Freeze_List']) {
    await expect(setting(page, key).getByRole('button', { name: /^Edit skills for / })).toHaveCount(0)
  }
  expect(await exportConfig(page)).toEqual(source)
  const bypass = await openSkills(page, 'Skill_Cheats_Bypass')
  await expect(bypass).toContainText(unknownId)
  await expect(bypass.getByRole('checkbox', { name: /000777|900719925474099312345/ })).toHaveCount(0)
  await bypass.getByRole('checkbox', { name: `${lists.Skill_Cheats_Bypass}: Cooking`, exact: true }).check()
  expect(await exportConfig(page)).toEqual({ ...source, Skill_Cheats_Bypass: ` ${unknownId} ,000777,16705` })

  const next = { Skill_Difficulty_Adjustment: 0, Skill_Cheats_Bypass: `${unknownId} `, Future_Skill_Data: '0009' }
  await importConfig(page, next, true)
  await expect(page.locator('[data-skill-settings-group] article[data-setting]:visible')).toHaveCount(2)
  for (const key of ['Skill_Difficulty_Blacklist', 'Skill_Difficulty_Whitelist', 'Skill_Freeze_List']) {
    await expect(setting(page, key)).toHaveCount(0)
  }
  const nextBypass = await openSkills(page, 'Skill_Cheats_Bypass')
  await expect(nextBypass).toContainText(unknownId)
  await expect(nextBypass.getByRole('checkbox', { name: /900719925474099312345/ })).toHaveCount(0)
  await expect(nextBypass.getByRole('checkbox', { name: `${lists.Skill_Cheats_Bypass}: Cooking`, exact: true })).not.toBeChecked()
  await setting(page, 'Skill_Difficulty_Adjustment').getByRole('textbox').fill('5')
  expect(await exportConfig(page)).toEqual({ ...next, Skill_Difficulty_Adjustment: 5 })
})
