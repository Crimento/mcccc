// Walkstyle codes confirmed in-game by the user. The sample's empty values
// correspond to “Sims 4 Default walkstyle” in the bundled reference.
export const walkstyleOptions = [
  { value: '', label: 'Default walkstyle' },
  { value: 'B', label: 'Bouncy' },
  { value: 'CR', label: 'Creepy' },
  { value: 'F', label: 'Feminine' },
  { value: 'G', label: 'Goofy' },
  { value: 'P', label: 'Perky' },
  { value: 'SL', label: 'Sluggish' },
  { value: 'SN', label: 'Snooty' },
  { value: 'SW', label: 'Swagger' },
  { value: 'T', label: 'Tough' },
]

export const walkstyleColumns = [
  {
    id: 'male', label: 'Male',
    profiles: [
      { key: 'Appearance_DefaultWalkstyle_TM', label: 'Teen' },
      { key: 'Appearance_DefaultWalkstyle_YAM', label: 'Young Adult' },
      { key: 'Appearance_DefaultWalkstyle_AM', label: 'Adult' },
      { key: 'Appearance_DefaultWalkstyle_EM', label: 'Elder' },
    ],
  },
  {
    id: 'female', label: 'Female',
    profiles: [
      { key: 'Appearance_DefaultWalkstyle_TF', label: 'Teen' },
      { key: 'Appearance_DefaultWalkstyle_YAF', label: 'Young Adult' },
      { key: 'Appearance_DefaultWalkstyle_AF', label: 'Adult' },
      { key: 'Appearance_DefaultWalkstyle_EF', label: 'Elder' },
    ],
  },
] as const

export const walkstyleKeys = new Set<string>(walkstyleColumns.flatMap(column => column.profiles.map(profile => profile.key)))
