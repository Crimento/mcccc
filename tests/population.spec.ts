import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import type { SettingsRecord } from '../src/lib/config'

const sample = JSON.parse(readFileSync(new URL('../mc_settings.cfg', import.meta.url), 'utf8')) as SettingsRecord

async function importConfig(page: Page, config: SettingsRecord = sample) {
  await page.getByLabel('Import config file').setInputFiles({
    name: 'population.cfg', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(config)),
  })
  await expect(page.getByText('population.cfg', { exact: true })).toBeVisible()
  await page.locator('[data-category="population"]').click()
}

async function openMenu(page: Page, path: string, count: number) {
  await page.locator(`[data-menu-path="${path}"]`).click()
  await expect(page.locator('article[data-setting]:visible')).toHaveCount(count)
  return page.locator('article[data-setting]:visible').evaluateAll(rows => rows.map(row => row.getAttribute('data-setting')!))
}

async function selectChoice(page: Page, key: string, label: string) {
  await page.locator(`[data-setting="${key}"]`).getByRole('combobox').click()
  await page.getByRole('option', { name: label, exact: true }).click()
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

test('Population menus cover every setting once and keep nested import and CAS controls reachable', async ({ page }) => {
  await importConfig(page)
  const rows = page.locator('article[data-setting]:visible')
  await expect(rows).toHaveCount(45)
  await expect(page.locator('[data-population-settings-group] article[data-setting]')).toHaveCount(36)
  const allKeys = await rows.evaluateAll(nodes => nodes.map(node => node.getAttribute('data-setting')!))
  expect(new Set(allKeys)).toEqual(new Set(Object.keys(sample).filter(key => key.startsWith('Population_'))))
  expect(allKeys[0]).toBe('Population_BarNights')

  const branches = [
    ['Moving Settings', 13], ['Populating Settings', 19], ['Random Lot Challenges', 4],
    ['Neighborhood Stories Settings', 1], ['Other Settings', 7],
  ] as const
  const covered = ['Population_BarNights']
  let populating: string[] = []
  for (const [path, count] of branches) {
    const keys = await openMenu(page, path, count)
    covered.push(...keys)
    if (path === 'Populating Settings') populating = keys
  }
  expect(covered).toHaveLength(45)
  expect(new Set(covered)).toEqual(new Set(allKeys))

  await openMenu(page, 'Populating Settings', 19)
  const imported = await openMenu(page, 'Populating Settings/Import Tray Settings', 7)
  expect(imported).toContain('Population_RandomUseTraySimPercent')
  const cas = await openMenu(page, 'Populating Settings/CAS Custom Gender Settings', 3)
  expect(new Set(cas)).toEqual(new Set([
    'Population_MatchCasToFrame', 'Population_PercentFemaleFrame', 'Population_PercentMaleFrame',
  ]))
  expect(imported.every(key => populating.includes(key))).toBe(true)
  expect(cas.every(key => populating.includes(key) && !imported.includes(key))).toBe(true)
  expect(populating.filter(key => !imported.includes(key) && !cas.includes(key))).toHaveLength(9)

  await page.locator('[data-category="population"]').click()
  await expect(rows).toHaveCount(45)
  expect(await exportConfig(page)).toEqual(sample)
})

test('grouped Population choices preserve unfamiliar codes and export confirmed dropdown values without changing other data', async ({ page }) => {
  const source = {
    ...sample,
    Population_NumAdjustLot: 'THR,HSC,WBY,GYM,LIB,LOU,BAR,PAR,POL,MUS,APT,ART,KAO,MYS,CAF,CLU,CHA,DAN,RES,SPA,BCH,SDY,MIX,ESP,CRM,CMM,RBM,DEB,MAK,MRK,GAR,FUTURE_LOT',
    Population_DisableImmortalSims: 'CTL,RNT,GF,GTW,HOR,JH,BTU,SN,SV,SE,CLN,CL,FUTURE_IMMORTAL',
    Population_RandomChallengeLotType: 'future:lot:007',
    Population_RandomChallengeTimeUnits: 'future:time:003',
    Population_MoveOutEldersType: 'future:elders:001',
    Population_RandomLimitHouseholdType: 'future:households:001',
    Population_UseTagsOnImportSims: 'future:tags:002',
    Population_ImportSimNameChoice: 'future:name:003',
    Future_PopulationData: { numericString: '0007', values: [true, null, { token: 'A,B' }] },
  }
  await importConfig(page, source)
  expect(await exportConfig(page)).toEqual(source)

  const nights = page.locator('[data-setting="Population_BarNights"]')
  await expect(nights.getByRole('checkbox')).toHaveCount(7)
  const nightLabels = await nights.getByRole('checkbox').evaluateAll(choices => choices.map(choice => choice.getAttribute('aria-label')!.split(': ').at(-1)))
  expect(nightLabels).toEqual(['Aliens Night', 'Bear Night', 'Ghosts Night', 'Guys Night', 'Knight Night', 'Ladies Night', 'Singles Night'])
  await nights.getByRole('checkbox', { name: /: Bear Night$/ }).uncheck()

  await openMenu(page, 'Other Settings', 7)
  const lots = page.locator('[data-setting="Population_NumAdjustLot"]')
  await expect(lots.getByRole('checkbox', { checked: true })).toHaveCount(32)
  for (const group of ['Base Game', 'City Living', 'Get Together', 'Dine Out', 'Spa Day', 'Island Living', 'Discover University', 'Eco Lifestyle', 'High School Years', 'Other choices from your file']) {
    await expect(lots.getByRole('group', { name: group, exact: true })).toBeVisible()
  }
  await lots.getByRole('group', { name: 'Base Game', exact: true }).getByRole('checkbox', { name: /: Gym$/ }).uncheck()
  await lots.getByRole('group', { name: 'High School Years', exact: true }).getByRole('checkbox', { name: /: High School$/ }).uncheck()
  const unknownLots = lots.getByRole('group', { name: 'Other choices from your file', exact: true })
  await expect(unknownLots.getByRole('checkbox', { name: /: FUTURE_LOT \(from file\)$/ })).toBeChecked()
  await expect(unknownLots.getByRole('checkbox')).toHaveCount(1)
  await expect(lots.getByRole('group', { name: 'City Living', exact: true }).getByRole('checkbox', { name: /: Arts Center$/ })).toBeChecked()

  const immortal = page.locator('[data-setting="Population_DisableImmortalSims"]')
  await expect(immortal.getByRole('checkbox', { checked: true })).toHaveCount(13)
  expect(await immortal.getByRole('checkbox').evaluateAll(choices => choices.slice(0, 12)
    .map(choice => choice.getAttribute('aria-label')!.split(': ').at(-1)))).toEqual([
    'City Living', 'Cottage Living', 'For Rent', 'Get Famous', 'Get To Work', 'Horse Ranch',
    'Jasmine Holiday', 'Journey to Batuu', 'Seasons', 'Service Sims', 'Snowy Escape', 'Tragic Clown',
  ])
  await immortal.getByRole('checkbox', { name: /: Horse Ranch$/ }).uncheck()
  await immortal.getByRole('checkbox', { name: /: City Living$/ }).uncheck()
  await expect(immortal.getByRole('checkbox', { name: /: FUTURE_IMMORTAL \(from file\)$/ })).toBeChecked()

  await openMenu(page, 'Random Lot Challenges', 4)
  for (const key of ['Population_RandomChallengeLotType', 'Population_RandomChallengeTimeUnits'] as const) {
    const row = page.locator(`[data-setting="${key}"]`)
    await expect(row.getByRole('combobox')).toHaveText(`${source[key]} (from file)`)
    await expect(row.getByRole('textbox')).toHaveCount(0)
  }
  await selectChoice(page, 'Population_RandomChallengeLotType', 'All Lots')
  await selectChoice(page, 'Population_RandomChallengeTimeUnits', 'Sim Hours')
  await openMenu(page, 'Moving Settings', 13)
  await expect(page.locator('[data-setting="Population_MoveOutEldersType"]').getByRole('combobox')).toHaveText(`${source.Population_MoveOutEldersType} (from file)`)
  await selectChoice(page, 'Population_MoveOutEldersType', 'Non-Ancestral')
  await openMenu(page, 'Populating Settings/Import Tray Settings', 7)
  for (const key of ['Population_RandomLimitHouseholdType', 'Population_UseTagsOnImportSims', 'Population_ImportSimNameChoice'] as const) {
    await expect(page.locator(`[data-setting="${key}"]`).getByRole('combobox')).toHaveText(`${source[key]} (from file)`)
  }
  await selectChoice(page, 'Population_RandomLimitHouseholdType', 'Only My Sims')
  await selectChoice(page, 'Population_UseTagsOnImportSims', 'Only Limit Tag')
  await selectChoice(page, 'Population_ImportSimNameChoice', 'Use Non-Duplicate Name')

  const expected = {
    ...source,
    Population_NumAdjustLot: source.Population_NumAdjustLot.split(',').filter(code => code !== 'GYM' && code !== 'HSC').join(','),
    Population_DisableImmortalSims: source.Population_DisableImmortalSims.split(',').filter(code => code !== 'HOR' && code !== 'CL').join(','),
    Population_BarNights: 'GU,AL,GH,KN,LA,SI',
    Population_RandomChallengeLotType: 'ALL', Population_RandomChallengeTimeUnits: 'SH',
    Population_MoveOutEldersType: 'NA', Population_RandomLimitHouseholdType: 'P',
    Population_UseTagsOnImportSims: 'T', Population_ImportSimNameChoice: 'D',
  }
  expect(await exportConfig(page)).toEqual(expected)
  await selectChoice(page, 'Population_UseTagsOnImportSims', 'Disabled')
  await openMenu(page, 'Moving Settings', 13)
  await selectChoice(page, 'Population_MoveOutEldersType', 'None')
  expect(await exportConfig(page)).toEqual({ ...expected, Population_UseTagsOnImportSims: '', Population_MoveOutEldersType: '' })
  await page.getByRole('textbox', { name: 'Search settings' }).fill('Population_NumAdjustLot')
  await lots.getByRole('button', { name: /^Undo / }).click()
  expect(await exportConfig(page)).toEqual({
    ...expected, Population_UseTagsOnImportSims: '', Population_MoveOutEldersType: '',
    Population_NumAdjustLot: source.Population_NumAdjustLot,
  })
  await page.getByRole('textbox', { name: 'Search settings' }).fill('Population_DisableImmortalSims')
  await immortal.getByRole('button', { name: /^Undo / }).click()
  expect(await exportConfig(page)).toEqual({
    ...expected, Population_UseTagsOnImportSims: '', Population_MoveOutEldersType: '',
    Population_NumAdjustLot: source.Population_NumAdjustLot, Population_DisableImmortalSims: source.Population_DisableImmortalSims,
  })
})

test('Population numeric controls keep independent percentages and invalid housing or challenge drafts across menus', async ({ page }) => {
  await importConfig(page)
  const percentageKeys = [
    'PercentBaby', 'PercentInfant', 'PercentToddler', 'PercentChild', 'PercentAdult', 'PercentElder',
    'PercentMale', 'PercentFemaleFrame', 'PercentMaleFrame', 'RandomUseTraySimPercent', 'HomelessApartmentPercent',
  ]
  for (const suffix of percentageKeys) {
    const slider = page.locator(`[data-setting="Population_${suffix}"]`).getByRole('slider')
    await expect(slider).toHaveAttribute('aria-valuemin', '0')
    await expect(slider).toHaveAttribute('aria-valuemax', '100')
  }
  const homeless = page.locator('[data-setting="Population_MaximumHomeless"]')
  const houses = page.locator('[data-setting="Population_OpenHouses"]')
  await expect(homeless.getByRole('slider')).toHaveAttribute('aria-valuemin', '-1')
  await expect(homeless.getByRole('slider')).toHaveAttribute('aria-valuemax', '100')
  await expect(homeless.getByText('Unlimited (-1)', { exact: true })).toBeVisible()
  await expect(houses.getByRole('slider')).toHaveAttribute('aria-valuemin', '0')
  await expect(houses.getByRole('slider')).toHaveAttribute('aria-valuemax', '100')
  await expect(houses.getByRole('textbox')).toHaveValue('1')
  await homeless.getByRole('slider').press('End')
  await houses.getByRole('slider').press('Home')
  expect(await exportConfig(page)).toEqual({ ...sample, Population_MaximumHomeless: 100, Population_OpenHouses: 0 })

  await openMenu(page, 'Random Lot Challenges', 4)
  const challenge = page.locator('[data-setting="Population_RandomChallengeMaxNum"]')
  await expect(challenge.getByRole('textbox')).toHaveValue('0')
  await expect(challenge.getByText('Disabled (0)', { exact: true })).toBeVisible()
  await challenge.getByRole('slider').press('End')
  await expect(challenge.getByRole('textbox')).toHaveValue('12')
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeEnabled()
  await challenge.getByRole('textbox').fill('13')
  await expect(challenge.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeDisabled()

  await openMenu(page, 'Moving Settings', 13)
  await homeless.getByRole('textbox').fill('101')
  await expect(homeless.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  for (const invalid of ['-1', '1.5']) {
    await houses.getByRole('textbox').fill(invalid)
    await expect(houses.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  }
  await houses.getByRole('textbox').fill('100')
  await page.locator('[data-setting="Population_HomelessApartmentPercent"]').getByRole('textbox').fill('75.5')
  const pets = page.locator('[data-setting="Population_MaximumHouseholdPets"]')
  await expect(pets.getByRole('slider')).toHaveAttribute('aria-valuemin', '-1')
  await expect(pets.getByRole('slider')).toHaveAttribute('aria-valuemax', '103')
  await pets.getByRole('textbox').fill('-1')
  await expect(pets.getByText('Unlimited (-1)', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeDisabled()

  await openMenu(page, 'Random Lot Challenges', 4)
  await expect(challenge.getByRole('textbox')).toHaveValue('13')
  await challenge.getByRole('button', { name: /^Undo / }).click()
  await expect(challenge.getByRole('textbox')).toHaveValue('0')
  await expect(page.getByRole('button', { name: /^Export config/ })).toBeDisabled()

  await openMenu(page, 'Populating Settings', 19)
  await page.locator('[data-setting="Population_PercentBaby"]').getByRole('textbox').fill('100')
  await page.locator('[data-setting="Population_PercentElder"]').getByRole('textbox').fill('100')
  await page.locator('[data-setting="Population_PercentAdult"]').getByRole('textbox').fill('100')
  await page.getByRole('textbox', { name: 'Search settings' }).fill('Population_MaximumHomeless')
  await expect(homeless.getByRole('textbox')).toHaveValue('101')
  await expect(homeless.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  await homeless.getByRole('button', { name: /^Undo / }).click()
  await expect(homeless.getByRole('textbox')).toHaveValue('-1')
  expect(await exportConfig(page)).toEqual({
    ...sample,
    Population_HomelessApartmentPercent: 75.5,
    Population_MaximumHouseholdPets: -1,
    Population_PercentBaby: 100,
    Population_PercentElder: 100,
    Population_PercentAdult: 100,
    Population_OpenHouses: 100,
  })
})
