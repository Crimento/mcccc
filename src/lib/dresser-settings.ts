import { dresserStandardOutfitOptions, dresserSituationLabels } from '../data/dresser-choices'

const situationCodes = ['CW', 'D', 'RNT', 'HOR', 'HF', 'IL', 'SRN', 'RF', 'SF', 'THR', 'UNV', 'V'] as const
const situations = situationCodes.map((code, index) => ({ code, label: dresserSituationLabels[index]! }))
const knownSituations = new Set<string>(situationCodes)
const knownOutfits = new Set(dresserStandardOutfitOptions().map(option => option.value))

function parseEntry(raw: string) {
  const colon = raw.indexOf(':')
  if (colon < 1 || colon !== raw.lastIndexOf(':')) return null
  const code = raw.slice(0, colon).trim()
  const outfit = raw.slice(colon + 1).trim()
  return code && outfit ? { code, outfit, colon } : null
}

export function situationOutfitEntries(value: string) {
  const parsed = value.split(',').map(parseEntry)
  return situations.map(situation => {
    const values = [...new Set(parsed.flatMap(entry => entry?.code === situation.code ? [entry.outfit] : []))]
    return { ...situation, values, ambiguous: values.length > 1 }
  })
}

export function situationOutfitUnknownEntries(value: string): string[] {
  return value.split(',').filter(raw => {
    if (!raw.trim()) return false
    const entry = parseEntry(raw)
    return !entry || !knownSituations.has(entry.code)
  })
}

// Edit only entries for the selected situation, preserving every unrelated raw
// token. Duplicate entries stay in place; an explicit choice updates each match.
export function updateSituationOutfit(value: string, code: string, outfit: string | null): string {
  if (!knownSituations.has(code) || (outfit !== null && !knownOutfits.has(outfit))) return value
  let matched = false
  const tokens = value.split(',').flatMap(raw => {
    const entry = parseEntry(raw)
    if (entry?.code !== code) return [raw]
    matched = true
    if (outfit === null) return []
    const rawOutfit = raw.slice(entry.colon + 1)
    const before = rawOutfit.match(/^\s*/)?.[0] ?? ''
    const after = rawOutfit.match(/\s*$/)?.[0] ?? ''
    return [`${raw.slice(0, entry.colon + 1)}${before}${outfit}${after}`]
  })
  if (!matched) return outfit === null ? value : `${value ? `${value},` : ''}${code}:${outfit}`
  return tokens.join(',')
}

export const dresserOutfitBlocks = [
  {
    id: 'after-career', label: 'After-work outfits',
    keys: ['Dresser_ChangeOutfitAfterCareerF', 'Dresser_ChangeOutfitAfterCareerM'],
  },
  {
    id: 'multiple', label: 'Multiple outfits',
    keys: ['Dresser_PercentMultipleOutfits', 'Dresser_MaximumMultipleOutfits', 'Dresser_MultipleOutfitGenders', 'Dresser_MultipleOutfitAges'],
  },
  {
    id: 'situations', label: 'Situation outfits',
    keys: ['Dresser_SituationUseStandardOutfits', 'Dresser_ReplaceSituationOutfits'],
  },
] as const

export const dresserOutfitKeys = new Set<string>(dresserOutfitBlocks.flatMap(block => block.keys))
