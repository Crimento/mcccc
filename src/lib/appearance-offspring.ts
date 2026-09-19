// Exact Create-a-Sim offspring settings; Pregnancy's Offspring menu is separate.
export const appearanceOffspringBlocks = [
  {
    id: 'physical', label: 'Physical attributes',
    keys: ['Appearance_UseParentAppearance', 'Appearance_ParentAppearanceVariance'],
  },
  {
    id: 'skin', label: 'Skin inheritance',
    keys: ['Appearance_UseParentSkinTones', 'Appearance_UseParentFacialDetails', 'CAS_BypassBlueBabies'],
  },
] as const

export const appearanceOffspringKeys = new Set<string>(appearanceOffspringBlocks.flatMap(block => block.keys))
