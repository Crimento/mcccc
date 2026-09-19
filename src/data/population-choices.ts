// Menu labels and saved codes confirmed during the in-game review.
export type PopulationChoice = { label: string; value: string }
export type PopulationOption = { label: string; value: string; group?: string }

export const populationLotGroups: { label: string; choices: PopulationChoice[] }[] = [
  {
    label: 'Base Game',
    choices: [
      { label: 'Bar', value: 'BAR' },
      { label: 'Gym', value: 'GYM' },
      { label: 'Library', value: 'LIB' },
      { label: 'Lounge', value: 'LOU' },
      { label: 'Museum', value: 'MUS' },
      { label: 'Park', value: 'PAR' },
      { label: 'Pool', value: 'POL' },
      { label: 'Walkby on All Lots', value: 'WBY' },
    ],
  },
  {
    label: 'City Living',
    choices: [
      { label: 'Apartments', value: 'APT' },
      { label: 'Arts Center', value: 'ART' },
      { label: 'Karaoke Bar', value: 'KAO' },
      { label: 'Myshuno Meadows', value: 'MYS' },
    ],
  },
  {
    label: 'Get Together',
    choices: [
      { label: 'Cafe', value: 'CAF' },
      { label: 'Chalet Gardens', value: 'CHA' },
      { label: 'Go Dancing on Lot', value: 'DAN' },
      // The reference calls CLU "clubs"; the reviewed menu says Nightclub.
      { label: 'Nightclub', value: 'CLU' },
    ],
  },
  { label: 'Dine Out', choices: [{ label: 'Restaurant', value: 'RES' }] },
  { label: 'Spa Day', choices: [{ label: 'Spa', value: 'SPA' }] },
  { label: 'Island Living', choices: [{ label: 'Beach', value: 'BCH' }] },
  {
    label: 'Discover University',
    choices: [
      { label: 'College Cram', value: 'CRM' },
      { label: 'Debate Practice', value: 'DEB' },
      { label: 'Robot Building Meetup', value: 'RBM' },
      { label: 'Study Group', value: 'SDY' },
      { label: 'University Commons', value: 'CMM' },
      { label: 'University Mixer Night', value: 'MIX' },
      { label: 'eSports Tournament', value: 'ESP' },
    ],
  },
  {
    label: 'Eco Lifestyle',
    choices: [
      { label: 'Garden', value: 'GAR' },
      { label: 'Maker Space', value: 'MAK' },
      { label: 'Marketplace', value: 'MRK' },
    ],
  },
  {
    label: 'High School Years',
    choices: [{ label: 'High School', value: 'HSC' }, { label: 'Thrift Store', value: 'THR' }],
  },
]

export const populationImmortalChoices: PopulationChoice[] = [
  { label: 'City Living', value: 'CL' },
  { label: 'Cottage Living', value: 'CTL' },
  { label: 'For Rent', value: 'RNT' },
  { label: 'Get Famous', value: 'GF' },
  { label: 'Get To Work', value: 'GTW' },
  { label: 'Horse Ranch', value: 'HOR' },
  { label: 'Jasmine Holiday', value: 'JH' },
  { label: 'Journey to Batuu', value: 'BTU' },
  { label: 'Seasons', value: 'SN' },
  { label: 'Service Sims', value: 'SV' },
  { label: 'Snowy Escape', value: 'SE' },
  { label: 'Tragic Clown', value: 'CLN' },
]

// Each setting retains its own confirmed codes even where meanings overlap.
export const populationChallengeLotChoices: PopulationChoice[] = [
  { label: 'Active Home Lot Only', value: 'A' },
  { label: 'All Lots', value: 'ALL' },
  { label: 'Residential Lots Only', value: 'R' },
]

export const populationChallengeTimeChoices: PopulationChoice[] = [
  { label: 'Sim Days', value: 'SD' },
  { label: 'Sim Hours', value: 'SH' },
]

export const populationImportTrayTypeChoices: PopulationChoice[] = [
  { label: 'Any Saved Sims', value: 'A' },
  { label: 'Only My Sims', value: 'P' },
  { label: 'Only Other Sims', value: 'O' },
]

export const populationImportTagChoices: PopulationChoice[] = [
  { label: 'Disabled', value: '' },
  { label: 'Limit Bypass Tags', value: 'B' },
  { label: 'Only Limit Tag', value: 'T' },
]

export const populationImportNameChoices: PopulationChoice[] = [
  // N is the documented default: Skip, not "Never Use Import Name".
  { label: 'Skip Sim If Name Exists', value: 'N' },
  { label: 'Always Use Import Name', value: 'U' },
  { label: 'Never Use Import Name', value: 'NN' },
  { label: 'Use Non-Duplicate Name', value: 'D' },
]

export const populationMoveOutElderChoices: PopulationChoice[] = [
  { label: 'None', value: '' },
  { label: 'All Elders', value: 'A' },
  { label: 'Non-Ancestral', value: 'NA' },
]

export function populationChoiceOptions(
  choices: readonly PopulationChoice[],
  group?: string,
): PopulationOption[] {
  return choices.map(choice => ({
    label: choice.label,
    value: choice.value,
    ...(group === undefined ? {} : { group }),
  }))
}

export function populationLotOptions(): PopulationOption[] {
  return populationLotGroups.flatMap(group => populationChoiceOptions(group.choices, group.label))
}

export function populationImmortalOptions(): PopulationOption[] {
  return populationChoiceOptions(populationImmortalChoices)
}
