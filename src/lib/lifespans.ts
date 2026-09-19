export type LifespanSpeciesId = 'human' | 'cat' | 'dog' | 'horse'
export type LifespanProfileLabel = 'Short' | 'Normal' | 'Long'
export type LifespanSpecies = {
  id: LifespanSpeciesId
  label: 'Humans' | 'Cats' | 'Dogs' | 'Horses'
  description: string
  fields: { key: string; label: string }[]
  profiles: { key: string; label: LifespanProfileLabel }[]
}

function petFields(): LifespanSpecies['fields'] {
  return [
    { key: 'Child', label: 'Child' },
    { key: 'Adult', label: 'Adult' },
    { key: 'Elder', label: 'Elder' },
  ]
}

// These are views of twelve existing saved settings. Neither this inventory nor
// its lookup infers profiles from key prefixes or creates missing config data.
export const lifespanSpecies: LifespanSpecies[] = [
  {
    id: 'human',
    label: 'Humans',
    description: 'Set each age duration in days for Short, Normal, and Long lifespans. Values can range from 0 to 4000, including decimals. A value of 0 uses the EA default shown below each slider.',
    fields: [
      { key: 'Baby', label: 'Newborn' },
      { key: 'Infant', label: 'Infant' },
      { key: 'Toddler', label: 'Toddler' },
      { key: 'Child', label: 'Child' },
      { key: 'Teen', label: 'Teen' },
      { key: 'YoungAdult', label: 'Young Adult' },
      { key: 'Adult', label: 'Adult' },
      { key: 'Elder', label: 'Elder' },
    ],
    profiles: [
      { key: 'AgeSpanShort', label: 'Short' },
      { key: 'AgeSpanNormal', label: 'Normal' },
      { key: 'AgeSpanLong', label: 'Long' },
    ],
  },
  {
    id: 'cat',
    label: 'Cats',
    description: 'Set each age duration in days for Short, Normal, and Long lifespans. Custom values can range from 1 to 1000, including decimals. A value of 0 uses the EA default shown below each slider.',
    fields: petFields(),
    profiles: [
      { key: 'AgeSpanCatShort', label: 'Short' },
      { key: 'AgeSpanCatNormal', label: 'Normal' },
      { key: 'AgeSpanCatLong', label: 'Long' },
    ],
  },
  {
    id: 'dog',
    label: 'Dogs',
    description: 'Set each age duration in days for Short, Normal, and Long lifespans. Custom values can range from 1 to 1000, including decimals. A value of 0 uses the EA default shown below each slider.',
    fields: petFields(),
    profiles: [
      { key: 'AgeSpanDogShort', label: 'Short' },
      { key: 'AgeSpanDogNormal', label: 'Normal' },
      { key: 'AgeSpanDogLong', label: 'Long' },
    ],
  },
  {
    id: 'horse',
    label: 'Horses',
    description: 'Set each age duration in days for Short, Normal, and Long lifespans. Custom values can range from 1 to 1000, including decimals. A value of 0 uses the EA default shown below each slider.',
    fields: petFields(),
    profiles: [
      { key: 'AgeSpanHorseShort', label: 'Short' },
      { key: 'AgeSpanHorseNormal', label: 'Normal' },
      { key: 'AgeSpanHorseLong', label: 'Long' },
    ],
  },
]

const speciesByKey = new Map(lifespanSpecies.flatMap(species =>
  species.profiles.map(profile => [profile.key, species] as const),
))

export function lifespanSpeciesForKey(key: string): LifespanSpecies | undefined {
  return speciesByKey.get(key)
}
