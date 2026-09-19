// School and university retain their independent config entries and controls.
export const educationBlocks = [
  {
    id: 'school', label: 'School',
    keys: ['Career_Homework_Speed', 'Career_ChildrenQuitSchool', 'Career_TeensQuitSchool'],
  },
  {
    id: 'university', label: 'University',
    keys: ['Career_University_Difficulty_Adjustment', 'Career_University_Homework_Speed', 'Career_Decay_Ratio_SecretSociety'],
  },
] as const

export const educationSettingKeys = new Set<string>(educationBlocks.flatMap(block => block.keys))
