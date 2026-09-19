// The six direct Relationship Settings entries only. Auto-relationship,
// breakup, and move-in settings retain their separate menus and saved values.
export const generalRelationshipKeys = new Set([
  'RelationshipCullingType',
  'Allow_Teen_Parenting',
  'Friendship_Difficulty_Adjustment',
  'Decay_Ratio_Friendship',
  'Romance_Difficulty_Adjustment',
  'Decay_Ratio_Romantic',
])

export type AutoRelationshipBlock = {
  id: 'household-bypass' | 'breakup' | 'move-in'
  title: string
  keys: string[]
}

export const autoRelationshipBlocks: AutoRelationshipBlock[] = [
  {
    id: 'household-bypass',
    title: 'Household bypass',
    keys: ['Relationship_BypassPlayedHouseholds', 'Relationship_BypassAncestral'],
  },
  {
    id: 'breakup',
    title: 'Breakup Settings',
    keys: [
      'Relationship_BreakupPercent', 'Relationship_BreakupMarriagePercent',
      'Relationship_BreakupMoveoutSim', 'Relationship_BreakupMoveoutOffspring',
    ],
  },
  {
    id: 'move-in',
    title: 'Move-In Settings',
    keys: [
      'Relationship_MoveinAges', 'Relationship_MoveinPercent',
      'Relationship_MoveinRomanceAmt', 'Relationship_MoveinHomeless',
    ],
  },
]

export const autoRelationshipKeys = new Set(autoRelationshipBlocks.flatMap(block => block.keys))
