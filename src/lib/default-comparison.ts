import referenceData from '../data/settings-reference.json'
import defaultSettings from '../data/default-settings.json'
import { getSettingMeta, type SettingMeta } from './catalog'
import { isEqual, type JsonValue } from './config'
import { occultSpecies } from './occult-settings'

export type DefaultComparison = {
  status: 'default' | 'different' | 'unknown'
  label?: string
  reason?: string
  source?: 'snapshot' | 'reference'
}

type KnownDefault = { value: JsonValue; label?: string }
const referenceDefaults = new Map(referenceData.map(entry => [entry.SettingName, entry.DefaultValue]))
const snapshot: Record<string, JsonValue> = defaultSettings
const numberSyntax = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i

// These exact-key translations were reviewed against complete DefaultValue
// entries in settings-reference.json. They are not inferred from the example
// config, UI labels, or a prefix of arbitrary prose.
const reviewedDefaults: Record<string, JsonValue> = {
  Autosave_Name: 'MC Save',
  Autosave_HexSlotNumber: '1111',
  Autosave_IntervalType: 'RH', // Reference: "Real-world Hour".
  Population_DisableImmortalSims: '', // "Blank for EA default".
  Dresser_RunOnAgeUp: '',
  Dresser_MakeupOutfits: 'E,F,P,AT,SW,SL',
  Dresser_ChangeOutfitAfterCareerF: '',
  Dresser_ChangeOutfitAfterCareerM: '',
  Dresser_MakeupGenders: 'F',
  Dresser_MakeupAges: 'T,YA,A',
  Dresser_MultipleOutfitGenders: 'M,F',
  Cleaner_CleanRelationships: 'N,A',
  Cleaner_CleanPetRelationships: 'A',
  Relationship_MoveinAges: 'YA,A,E', // Reference's "Young Adult, Adult, Elders".
  Relationship_MoveinRomanceAmt: 50, // Explicitly identified as Sweethearts.
  Pregnancy_AgePercentage: '20,20,20,20',
  Marriage_AgePercentage: '20,20,20,20',
  Occult_AgePercentage: '30,30,30,30',
  Pregnancy_CatAgePercentage: '20,20',
  Pregnancy_DogAgePercentage: '20,20',
  Pregnancy_HorseAgePercentage: '20,20',
  Woohoo_RiskyWoohooPercents: '0,0,0,0',
  Pregnancy_PetAgeToRun: 'A',
  Pregnancy_TargetSimAges: 'A',
  Pregnancy_SeedSimAges: 'A',
  Marriage_TargetSimAges: 'A',
  Marriage_SpouseSimAges: 'A',
  Marriage_RequiredTraitsList: [], // Reference explicitly says an empty list.
  Marriage_ConflictTraitsList: [],
  Pregnancy_OffspringGenderPercents: { M: 50, F: 50 },
  // The reference specifies every outcome for each of these six arrays.
  Pregnancy_PercentWeights: {
    '1': [100], '2': [90, 10], '3': [89, 10, 1], '4': [75, 15, 7, 3],
    '5': [55, 25, 13, 5, 2], '6': [35, 30, 18, 11, 4, 2],
  },
  // Species identifiers are already verified by the occult editor. The
  // reference specifies Mermaid elders and Vampires as the only exceptions.
  Occult_OccultTypeAgeMultiplier: Object.fromEntries(occultSpecies.map(({ code }) => [
    code, [100, 100, 100, 100, code === 'MM' ? 335 : 100],
  ])),
  Occult_OccultTypeMaximumAge: Object.fromEntries(occultSpecies.map(({ code }) => [code, code === 'V' ? 'YA' : '0'])),
}
for (const species of ['Aliens', 'Vampires', 'Mermaids', 'Spellcasters', 'Werewolves', 'Fairies']) {
  reviewedDefaults[`Occult_Maximum${species}`] = -1 // Each entry explicitly says "-1 = No limit".
}

// Probe only metadata, never saved data: controls depend on the imported type,
// but a malformed numeric import must not turn a string choice's default into
// a numeric default. Cache these stable schema hints for the live editor.
const schemas = new Map<string, { string: SettingMeta; number: SettingMeta; object: SettingMeta }>()
function schema(key: string) {
  let result = schemas.get(key)
  if (!result) {
    result = { string: getSettingMeta(key, ''), number: getSettingMeta(key, 0), object: getSettingMeta(key, {}) }
    schemas.set(key, result)
  }
  return result
}

function numeric(value: string): number | undefined {
  if (!numberSyntax.test(value.trim())) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function optionCode(meta: SettingMeta, text: string): string | undefined {
  const exact = meta.options?.find(option => option.value === text)
  if (exact) return exact.value
  const matching = meta.options?.filter(option => option.label.toLowerCase() === text.toLowerCase()) ?? []
  return matching.length === 1 ? matching[0]!.value : undefined
}

function resolveDefault(meta: SettingMeta): KnownDefault | undefined {
  // This file was freshly recreated by MCCC and supplied explicitly as the
  // default snapshot. It takes precedence over older reference documentation.
  if (Object.hasOwn(snapshot, meta.key)) return { value: snapshot[meta.key]! }
  if (meta.defaultValue !== undefined) return { value: meta.defaultValue, label: meta.defaultLabel }
  const hints = schema(meta.key)
  const numericFields = hints.object.numericFields
  if (numericFields) return {
    value: Object.fromEntries(Object.entries(numericFields).map(([key, field]) => [key, field.defaultSentinel])),
    label: 'EA default (0 for every age)',
  }
  if (Object.hasOwn(reviewedDefaults, meta.key)) return { value: reviewedDefaults[meta.key]! }
  const raw = referenceDefaults.get(meta.key)?.trim()
  if (!raw) return undefined

  if (hints.object.rangeFields
    && raw === "All body part ranges default to '-100,100', which is EA's default ranges.") return {
    value: Object.fromEntries(Object.keys(hints.object.rangeFields).map(key => [key, [-100, 100]])),
    label: '−100 to 100 for every documented body part',
  }

  const quoted = raw.startsWith("'") && raw.endsWith("'") && !raw.slice(1, -1).includes("'")
    ? raw.slice(1, -1) : undefined
  let literal: JsonValue | undefined = quoted
  if (literal === undefined) {
    try { literal = JSON.parse(raw) as JsonValue } catch { /* Only complete JSON literals are accepted. */ }
  }
  if (typeof literal === 'number' && !Number.isFinite(literal)) return undefined

  if (hints.string.options) {
    const text = typeof literal === 'string' ? literal : raw
    if (text === '' || /^blank$/i.test(text)) return { value: '' }
    const codes = hints.string.kind === 'multiselect'
      ? text.split(',').map(token => optionCode(hints.string, token.trim()))
      : [optionCode(hints.string, text)]
    return codes.every(code => code !== undefined) ? { value: codes.join(',') } : undefined
  }
  if (hints.number.kind === 'select') {
    const value = numeric(typeof literal === 'string' ? literal : raw)
    return value !== undefined && hints.number.options?.some(option => option.value === String(value)) ? { value } : undefined
  }
  if (/^(true|enabled)$/i.test(raw)) return { value: true }
  if (/^(false|disabled)$/i.test(raw)) return { value: false }
  if (/^blank$/i.test(raw)) return { value: '' }
  if (literal !== undefined) return { value: literal }

  // Ordered numeric CSV and range strings have an explicit storage schema;
  // their number formatting is irrelevant, but order and every position matter.
  if ((hints.string.csvNumbers || hints.string.range || getSettingMeta(meta.key, raw).csvNumbers)
    && raw.split(',').length > 1 && raw.split(',').every(token => numeric(token) !== undefined)) return { value: raw }
  const value = numeric(raw)
  if (value !== undefined) return { value }
  if (hints.number.unit && raw.endsWith(` ${hints.number.unit}`)) {
    const amount = numeric(raw.slice(0, -hints.number.unit.length - 1))
    if (amount !== undefined) return { value: amount }
  }
  return undefined
}

function compatibleShape(current: JsonValue, expected: JsonValue): boolean {
  if (current === null || expected === null) return current === null && expected === null
  if (typeof current !== typeof expected) return false
  if (typeof expected === 'number') return typeof current === 'number' && Number.isFinite(current)
  if (typeof expected !== 'object') return true
  if (Array.isArray(expected)) {
    if (!Array.isArray(current)) return false
    // A documented empty list has no fixed entry schema or required slots.
    return expected.length === 0 || (current.length === expected.length
      && expected.every((value, index) => compatibleShape(current[index]!, value)))
  }
  if (Array.isArray(current) || typeof current !== 'object') return false
  const keys = Object.keys(expected)
  return Object.keys(current).length === keys.length
    && keys.every(key => Object.hasOwn(current, key) && compatibleShape(current[key]!, expected[key]!))
}

function defaultLabel(meta: SettingMeta, value: JsonValue): string {
  if (typeof value === 'boolean') return value ? 'Enabled' : 'Disabled'
  if (typeof value === 'string') {
    if (!value) return schema(meta.key).string.options?.find(option => option.value === '')?.label ?? 'Empty'
    const hints = schema(meta.key).string
    if (hints.options) return value.split(',').map(code => hints.options!.find(option => option.value === code)?.label ?? code).join(', ')
    return value
  }
  if (typeof value === 'number') {
    const label = schema(meta.key).number.options?.find(option => option.value === String(value))?.label
    return label ?? `${value}${meta.unit === '%' ? '%' : meta.unit ? ` ${meta.unit}` : ''}`
  }
  if (Array.isArray(value) && value.length === 0) return 'Empty list'
  return 'Documented structured values'
}

/** Compare with the verified snapshot or reference, independently of import. */
export function compareSettingDefault(meta: SettingMeta, current: JsonValue): DefaultComparison {
  if (meta.internal) return { status: 'unknown', reason: 'Internal setting; no user-facing default comparison.' }
  const known = resolveDefault(meta)
  if (!known) return { status: 'unknown', reason: 'A complete, unambiguous default is not documented for this setting.' }
  const source = Object.hasOwn(snapshot, meta.key) ? 'snapshot' : 'reference'
  const curatedLabel = meta.defaultValue !== undefined && isEqual(meta.defaultValue, known.value) ? meta.defaultLabel : undefined
  const sentinelFields = schema(meta.key).object.numericFields
  const sentinelLabel = sentinelFields && isEqual(known.value, Object.fromEntries(Object.entries(sentinelFields)
    .map(([key, field]) => [key, field.defaultSentinel]))) ? 'EA default (0 for every age)' : undefined
  const label = known.label ?? curatedLabel ?? sentinelLabel
    ?? (source === 'snapshot' && known.value !== null && typeof known.value === 'object' ? 'Default configuration values' : defaultLabel(meta, known.value))
  if (!compatibleShape(current, known.value)) return {
    status: 'unknown', label, source, reason: 'The saved type or structure differs from the known default; missing or unfamiliar fields cannot be compared safely.',
  }
  let equal: boolean
  const hints = schema(meta.key).string
  if (typeof current === 'string' && typeof known.value === 'string' && hints.kind === 'multiselect') {
    const tokens = (value: string) => [...new Set(value.split(',').map(token => token.trim()).filter(Boolean))].sort()
    equal = isEqual(tokens(current), tokens(known.value))
  } else if (typeof current === 'string' && typeof known.value === 'string'
    && (meta.csvNumbers || hints.csvNumbers || hints.range || getSettingMeta(meta.key, known.value).csvNumbers)) {
    const actual = current.split(',').map(numeric)
    const expected = known.value.split(',').map(numeric)
    if (actual.length !== expected.length || actual.some(value => value === undefined) || expected.some(value => value === undefined)) return {
      status: 'unknown', label, source, reason: 'The saved numeric list has missing, unfamiliar or malformed positions.',
    }
    equal = isEqual(actual as number[], expected as number[])
  } else equal = isEqual(current, known.value)
  return { status: equal ? 'default' : 'different', label, source }
}
