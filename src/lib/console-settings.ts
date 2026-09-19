export type ConsoleBlock = {
  id: 'visuals' | 'general-cheats' | 'buildbuy'
  label: string
  description: string
  keys: string[]
}

// Presentation groups only. Each saved setting remains independent, including
// the hidden-object setting when ShowLiveObjects invokes that cheat in-game.
export const consoleBlocks: ConsoleBlock[] = [
  {
    id: 'visuals',
    label: 'Visuals',
    description: 'Choose whether overhead indicators and hover effects appear in the game.',
    keys: ['Headline_Effects_Enabled', 'Hover_Effects_Enabled'],
  },
  {
    id: 'general-cheats',
    label: 'General cheats',
    description: 'Set up testing cheats, debug commands, and full editing in Create-a-Sim.',
    keys: ['Testing_Cheats_Enabled', 'Debug_Cheats_Enabled', 'Full_Edit_CAS'],
  },
  {
    id: 'buildbuy',
    label: 'BuildBuy mode cheats',
    description: 'Control object placement, building access, and unlocked or hidden objects.',
    keys: [
      'BB_Move_Objects_Enabled', 'BB_Ignore_Unlocks_Enabled', 'BB_Free_Build_Enabled',
      'BB_Debug_Objects_Enabled', 'BB_Show_Live_Objects',
    ],
  },
]

export const consoleSettingKeys = new Set(consoleBlocks.flatMap(block => block.keys))
