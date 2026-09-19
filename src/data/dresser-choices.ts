// Menu labels and every saved code were confirmed during the in-game review.
export type DresserOutfitChoice = { label: string; value: string }

export const dresserAgeLabels = [
  'Infant', 'Toddler', 'Child', 'Teen', 'Young Adult', 'Adult', 'Elder',
] as const

export const dresserStandardOutfits: DresserOutfitChoice[] = [
  { label: 'Everyday', value: 'E' },
  { label: 'Formal', value: 'F' },
  { label: 'Athletic', value: 'AT' },
  { label: 'Sleep', value: 'SL' },
  { label: 'Party', value: 'P' },
  { label: 'Swimwear', value: 'SW' },
  { label: 'Hot Weather', value: 'HW' },
  { label: 'Cold Weather', value: 'CW' },
]

export const dresserSpecialOutfits: DresserOutfitChoice[] = [
  { label: 'Bathing', value: 'B' },
  { label: 'Batuu', value: 'BT' },
  { label: 'Career', value: 'C' },
  { label: 'Situation', value: 'SI' },
  { label: 'Special', value: 'SP' },
]

export const dresserSituationLabels = [
  'City Walkby Situations',
  'Date Situations',
  'For Rent Street Loungers',
  'Horse Ranch Dance Hall',
  'Humor Festival Situations',
  'Island Living Situations',
  'Rain Walkby Situations',
  'Romantic Festival Situations',
  'Spice Festival Situations',
  'Thrift Store Situations',
  'University Situations',
  'Vampire Situations',
] as const

// The user confirmed the standard uppercase codes for after-career outfits
// and situation replacements, including Hot Weather and Cold Weather.
export function dresserStandardOutfitOptions(): { value: string; label: string }[] {
  return dresserStandardOutfits.map(choice => ({ value: choice.value, label: choice.label }))
}

// Only makeup uses these additional categories. After-work and situation
// replacements continue to use the eight standard outfits above.
export function dresserMakeupOutfitOptions(): { value: string; label: string }[] {
  return [...dresserStandardOutfits, ...dresserSpecialOutfits]
    .map(choice => ({ value: choice.value, label: choice.label }))
}
