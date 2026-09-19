// Each range keeps its own config entry. Grouping changes only the presentation.
export const appearanceLimitColumns = [
  {
    id: 'female', label: 'Female',
    keys: ['Appearance_FemaleFitLimits', 'Appearance_FemaleLeanLimits'],
  },
  {
    id: 'male', label: 'Male',
    keys: ['Appearance_MaleFitLimits', 'Appearance_MaleLeanLimits'],
  },
] as const

export const appearanceLimitKeys = new Set<string>(appearanceLimitColumns.flatMap(column => column.keys))
