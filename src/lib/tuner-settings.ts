// Exact in-game Tuner keys. Child bill payments belong to MCCC Money Settings.
export const tunerSettingBlocks = [
  {
    id: 'social-behavior', label: 'Social interaction rules',
    keys: [
      'Tuner_AllowMultipleBFFs', 'Tuner_FriendlyAskSingle', 'Tuner_FriendlyStayNight',
      'Tuner_KissesAlwaysAvailable', 'Tuner_StopRandomFlirting',
    ],
  },
  {
    id: 'children-households', label: 'Children and households',
    keys: ['Tuner_Child_Baby_Care', 'Tuner_AllowTeenAskMoveIn', 'Tuner_AllowMonsterUnderBed'],
  },
  {
    id: 'death', label: 'Death-related behavior',
    keys: ['Tuner_AllowMoodDeath', 'Tuner_DisableWitnessDeath'],
  },
  {
    id: 'upgrades-homework', label: 'Upgrades and homework',
    keys: ['Tuner_InstantUpgrade', 'Put_Away_Books_Fix'],
  },
  {
    id: 'social-autonomy', label: 'Autonomous social interactions',
    keys: [
      'Tuner_AutoFlirty', 'Tuner_AutoProposal', 'Tuner_AutoMarriage',
      'Tuner_AutoMean', 'Tuner_AutoMischief',
    ],
  },
  {
    id: 'household-autonomy', label: 'Autonomous household tasks',
    keys: ['Tuner_AutoClean', 'Tuner_AutoRepair', 'Tuner_AutoGarden'],
  },
  {
    id: 'archive', label: 'Autonomy scan archive',
    keys: ['Tuner_ArchiveInteractions', 'Tuner_MaximumArchive'],
  },
] as const

export const tunerSettingKeys = new Set<string>(tunerSettingBlocks.flatMap(block => block.keys))
