import type { JsonValue } from './config'
import { personalityTraitOptions } from './trait-settings'

const knownTraitCodes = new Set(personalityTraitOptions.map(option => option.value))

/**
 * Required/conflicting pairs apply bidirectionally in MCCC. Their stored order
 * and raw IDs are preserved here; neither pair normalization nor deduplication
 * is needed to represent that behavior. Padded IDs remain imported strings.
 */
export function isMarriageTraitPair(value: JsonValue): value is [string, string] {
  return Array.isArray(value) && value.length === 2
    && typeof value[0] === 'string' && value[0].trim().length > 0
    && typeof value[1] === 'string' && value[1].trim().length > 0
}

function isEntryIndex(values: JsonValue[], index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < values.length
}

export function updateMarriageTraitPair(
  values: JsonValue[], index: number, position: 0 | 1, code: string,
): JsonValue[] {
  if (!isEntryIndex(values, index) || (position !== 0 && position !== 1) || !knownTraitCodes.has(code)) return values
  const pair = values[index]!
  if (!isMarriageTraitPair(pair) || pair[position] === code) return values

  const changed: [string, string] = [pair[0], pair[1]]
  changed[position] = code
  const next = [...values]
  next[index] = changed
  return next
}

export function addMarriageTraitPair(values: JsonValue[], first: string, second: string): JsonValue[] {
  if (!knownTraitCodes.has(first) || !knownTraitCodes.has(second)) return values
  return [...values, [first, second]]
}

export function removeMarriageTraitPair(values: JsonValue[], index: number): JsonValue[] {
  if (!isEntryIndex(values, index) || !isMarriageTraitPair(values[index]!)) return values
  return [...values.slice(0, index), ...values.slice(index + 1)]
}
