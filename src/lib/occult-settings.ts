import type { SettingMeta } from './catalog'
import type { JsonValue } from './config'

// Species identifiers from the supplied aging objects. MM/V are corroborated
// by the reference's Mermaid elder multiplier and Vampire maximum-age defaults.
export const occultSpecies = [
  { code: 'A', label: 'Aliens' },
  { code: 'FR', label: 'Fairies' },
  { code: 'MM', label: 'Mermaids' },
  { code: 'WT', label: 'Spellcasters' },
  { code: 'V', label: 'Vampires' },
  { code: 'WW', label: 'Werewolves' },
] as const

function isRecord(value: unknown): value is Record<string, JsonValue> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function getOccultSharedMeta(key: string, value: unknown): Partial<SettingMeta> {
  if (key === 'Occult_UseCustomPregnancy') {
    return {
      menuPaths: occultSpecies.map(({ label }) => [label, 'Other Pregnancy']),
      description: 'Enable the custom offspring percentages set under Other Pregnancy. This switch applies to all occult types. When disabled, the game’s default pregnancy rules apply.',
    }
  }
  const mode = key === 'Occult_OccultTypeAgeMultiplier' ? 'multiplier'
    : key === 'Occult_OccultTypeMaximumAge' ? 'maximum' : undefined
  if (!mode || !isRecord(value)) return {}
  return {
    occultAging: mode,
    menuPaths: occultSpecies.filter(({ code }) => Object.hasOwn(value, code))
      .map(({ label }) => [label, 'Aging Settings']),
  }
}

export function settingMenuPaths(meta: SettingMeta): string[][] {
  return meta.menuPaths?.length ? meta.menuPaths : [meta.menuPath]
}

export function occultAgingEntries(meta: SettingMeta, value: JsonValue) {
  if (!meta.occultAging || !isRecord(value)) return []
  const known = occultSpecies.filter(({ code }) => Object.hasOwn(value, code))
    .map(({ code, label }) => ({ code: String(code), label: String(label) }))
  const entries = [...known, ...Object.keys(value).filter(code => !known.some(item => item.code === code))
    .map(code => ({ code, label: `${code} (from file)` }))]
  return entries.map(({ code, label }) => {
    const fieldValue = value[code]!
    const child: SettingMeta = {
      key: `${meta.key}.${code}`, label: meta.label, description: '',
      category: 'occult', menuPath: [], section: label, kind: 'json', documented: true,
    }
    if (known.some(item => item.code === code)) {
      if (meta.occultAging === 'multiplier') {
        child.arrayNumbers = {
          labels: ['Child', 'Teen', 'Young Adult', 'Adult', 'Elder'],
          min: 1, max: 500, step: 1, unit: '%',
        }
      } else if (typeof fieldValue === 'string') {
        child.kind = 'select'
        child.options = [
          { value: '0', label: 'Normal aging' },
          { value: 'T', label: 'Teen' },
          { value: 'YA', label: 'Young Adult' },
          { value: 'A', label: 'Adult' },
          { value: 'E', label: 'Elder' },
        ]
      }
    }
    return { code, label, meta: child, value: fieldValue }
  })
}
