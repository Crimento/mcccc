// Group only known settings; keep navigation paths and each saved value separate.
export const populationSettingBlocks = [
  {
    id: 'housing', label: 'Housing and move-in limits',
    keys: [
      'Population_AllowHomelessMoveIn', 'Population_MaximumHomeless',
      'Population_OpenHouses', 'Population_HomelessApartmentPercent',
      'Population_MaximumHouseholdPets', 'Population_EnforceVampireHomes',
    ],
  },
  {
    id: 'moving-exclusions', label: 'Households to bypass',
    keys: [
      'Population_BypassPlayedHouseholds', 'Population_BypassAncestralMoveouts',
      'Population_BypassBusinessOwnerMoveouts', 'Population_MovingBypassDorms',
    ],
  },
  {
    id: 'move-outs', label: 'Moving household members',
    keys: ['Population_MoveOutEldersType', 'Population_MoveOutSingleSim', 'Population_MoveTeenDependent'],
  },
  {
    id: 'demographics', label: 'Population ages and gender',
    keys: [
      'Population_PercentBaby', 'Population_PercentInfant', 'Population_PercentToddler',
      'Population_PercentChild', 'Population_PercentAdult', 'Population_PercentElder',
      'Population_PercentMale',
    ],
  },
  {
    id: 'generated-sims', label: 'Generated Sim settings',
    keys: ['Population_ButlerAges', 'Population_RunDresser'],
  },
  {
    id: 'tray-imports', label: 'Tray imports',
    keys: [
      'Population_RandomUseTraySimPercent', 'Population_RandomLimitHouseholdType',
      'Population_UseTagsOnImportSims', 'Population_ImportSimNameChoice',
      'Population_RandomUseTrayGenderSet', 'Population_RandomUseTrayOutfits',
      'Population_ImportBypassAppearance',
    ],
  },
  {
    id: 'cas-gender', label: 'CAS gender settings',
    keys: ['Population_MatchCasToFrame', 'Population_PercentFemaleFrame', 'Population_PercentMaleFrame'],
  },
  {
    id: 'lot-challenges', label: 'Random lot challenges',
    keys: [
      'Population_RandomChallengeLotType', 'Population_RandomChallengeMaxNum',
      'Population_RandomChallengeTimeUnits', 'Population_RandomChallengeMaxTime',
    ],
  },
] as const

export const populationSettingKeys = new Set<string>(populationSettingBlocks.flatMap(block => block.keys))
