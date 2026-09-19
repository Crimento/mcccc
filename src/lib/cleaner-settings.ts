import { validateNumericInput } from './config'

const householdChoices = [
  { value: 'A', label: 'Include Active Household' },
  { value: 'AO', label: 'Include Active Sims Only' },
  { value: 'N', label: 'Include NPC Households' },
  { value: 'P', label: 'Include Played Households' },
  { value: 'PO', label: 'Include Played Sims Only' },
]

// Only the first position was confirmed as editable in the user's game.
// Keep every byte after its comma, including unfamiliar relationship levels.
export function cleanerHouseholdOptions(value: string) {
  const comma = value.indexOf(',')
  if (comma < 1 || !value.slice(comma + 1).trim()) return undefined
  const suffix = value.slice(comma)
  return householdChoices.map(choice => ({ ...choice, value: `${choice.value}${suffix}` }))
}

export const petRelationshipOptions = [
  { value: 'A', label: 'Acquaintances' },
  { value: 'C', label: 'Custom Level Relationships' },
  { value: 'F', label: 'Friends' },
  { value: 'Z', label: 'Zero Level Relationships' },
] as const

export const petCustomLevelBounds = { min: 0, max: 100, step: 1 }

type PetRelationship = { mode: 'A' | 'F' | 'Z' } | { mode: 'C'; level: number; rawLevel: string }

export function parsePetRelationship(value: string): PetRelationship | null {
  const tokens = value.split(',')
  const mode = tokens[0]?.trim()
  if (tokens.length === 1 && (mode === 'A' || mode === 'F' || mode === 'Z')) return { mode }
  if (tokens.length === 2 && mode === 'C') {
    const rawLevel = tokens[1]!
    const result = validateNumericInput(rawLevel)
    // Bounds are validated by the editor when changed; existing outliers stay intact.
    if (result.valid && result.value !== undefined) return { mode, level: result.value, rawLevel }
  }
  return null
}

export const cleanerRelationshipKeys = new Set([
  'Cleaner_CleanRelationships', 'Cleaner_CleanPetRelationships', 'Cleaner_LeaveRelationshipCount',
])
