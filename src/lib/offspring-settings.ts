import type { JsonValue, SettingsRecord } from './config'

export const offspringSettingBlocks = [
  {
    id: 'size', label: 'Number of offspring',
    keys: ['Pregnancy_MaxOffspring', 'Pregnancy_MaxHouseholdChildren', 'Pregnancy_PercentWeights'],
  },
  {
    id: 'gender', label: 'Offspring gender and identical siblings',
    keys: ['Pregnancy_OffspringGenderPercents', 'Pregnancy_OffspringGender', 'Pregnancy_IdenticalOffspringChance'],
  },
  {
    id: 'traits', label: 'Inherited traits',
    keys: ['Pregnancy_OffspringTraitsType', 'Pregnancy_OffspringTraitsMax'],
  },
  {
    id: 'names', label: 'Offspring names',
    keys: ['Pregnancy_NameInactiveOffspring', 'Pregnancy_SyncChildSurname'],
  },
] as const

export const offspringSettingKeys = new Set<string>(offspringSettingBlocks.flatMap(block => block.keys))

export function isSettingsObject(value: JsonValue | undefined): value is SettingsRecord {
  return value !== undefined && value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function offspringGenders(value: JsonValue | undefined): number[] | undefined {
  if (!isSettingsObject(value)) return undefined
  const genders = [value.M, value.F]
  return genders.every(value => typeof value === 'number' && Number.isFinite(value))
    ? genders as number[] : undefined
}

export function offspringCount(value: JsonValue | undefined): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 6
    ? value : undefined
}
