export type AppearanceTemplateGroup = {
  id: 'female' | 'male'
  label: string
  description: string
  profiles: { key: string; label: string }[]
}

// Exact existing profiles only. Body fields and their anatomical display order
// come from each profile's catalogue metadata, not from inferred key names.
export const appearanceTemplateGroups: AppearanceTemplateGroup[] = [
  {
    id: 'female',
    label: 'Female',
    description: 'Set female body-part ranges separately for each age. Each age keeps its own appearance template.',
    profiles: [
      { key: 'Appearance_TF_Template', label: 'Teen' },
      { key: 'Appearance_YAF_Template', label: 'Young Adult' },
      { key: 'Appearance_AF_Template', label: 'Adult' },
      { key: 'Appearance_EF_Template', label: 'Elder' },
    ],
  },
  {
    id: 'male',
    label: 'Male',
    description: 'Set male body-part ranges separately for each age. Each age keeps its own appearance template.',
    profiles: [
      { key: 'Appearance_TM_Template', label: 'Teen' },
      { key: 'Appearance_YAM_Template', label: 'Young Adult' },
      { key: 'Appearance_AM_Template', label: 'Adult' },
      { key: 'Appearance_EM_Template', label: 'Elder' },
    ],
  },
]

const groupsByKey = new Map(appearanceTemplateGroups.flatMap(group =>
  group.profiles.map(profile => [profile.key, group] as const),
))

export const appearanceTemplateKeys = new Set(groupsByKey.keys())

export function appearanceTemplateGroupForKey(key: string): AppearanceTemplateGroup | undefined {
  return groupsByKey.get(key)
}
