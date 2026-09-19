export type AutosaveBlock = {
  id: 'main' | 'interval' | 'settings'
  label: string
  keys: string[]
}

// Presentation groups for seven existing settings; never infer additional
// editable settings from an Autosave_ prefix or insert missing config keys.
export const autosaveBlocks: AutosaveBlock[] = [
  {
    id: 'main',
    label: 'Main',
    keys: ['Autosave_Enabled', 'Autosave_ShowConfirmation'],
  },
  {
    id: 'interval',
    label: 'Autosave interval',
    keys: ['Autosave_IntervalType', 'Autosave_IntervalAmount'],
  },
  {
    id: 'settings',
    label: 'Autosave settings',
    keys: ['Autosave_Name', 'Autosave_HexSlotNumber', 'Autosave_MaxSaveNumber'],
  },
]

export const autosaveKeys = new Set(autosaveBlocks.flatMap(block => block.keys))
