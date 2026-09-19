export type AdditionalSettingGroup = {
  id: string
  label: string
  category: string
  menuPath: string[]
  blocks: {
    id: string
    label: string
    keys: readonly string[]
    fullWidthKeys?: readonly string[]
  }[]
}

// Presentation only: exact existing keys stay in their current menu paths.
// Missing settings are never inserted, and future keys retain the standard editor.
export const additionalSettingGroups: AdditionalSettingGroup[] = [
  {
    id: 'core-gameplay', label: 'Gameplay settings', category: 'core', menuPath: ['Gameplay'],
    blocks: [
      { id: 'child-care', label: 'Child care', keys: ['Adopt_Neglected_Child', 'Adopt_No_Caregiver'] },
      {
        id: 'progression', label: 'Progression difficulty',
        keys: ['LifeSkill_Difficulty_Adjustment', 'Prestige_Difficulty_Adjustment', 'Fame_Difficulty_Adjustment'],
      },
    ],
  },
  {
    id: 'core-death', label: 'Death settings', category: 'core', menuPath: ['Gameplay', 'Death Settings'],
    blocks: [{
      id: 'death', label: 'Death settings',
      keys: ['Allow_NS_Deaths', 'Sims_Are_Immortal', 'Sim_Death_Only_On_Lot'],
    }],
  },
  {
    id: 'core-logging', label: 'Logging settings', category: 'core',
    menuPath: ['Notifications/Console/Menu Settings', 'Logging Settings'],
    blocks: [{
      id: 'logging', label: 'Logging',
      keys: ['Logging_Enabled', 'Logging_Append', 'Logging_LessLENotes'],
    }],
  },
  {
    id: 'appearance-walkstyle', label: 'Automatic walkstyles', category: 'appearance', menuPath: [],
    blocks: [{
      id: 'automatic-walkstyles', label: 'Automatic walkstyles',
      keys: ['CAS_AutoCelebrityWalkstyle', 'Appearance_AgeupChangeWalkstyle'],
    }],
  },
  {
    id: 'cleaner-accessories', label: 'Outfit accessory syncing', category: 'cleaner', menuPath: ['Item Cleaner'],
    blocks: [{
      id: 'accessories', label: 'Outfit accessory syncing',
      keys: ['Cleaner_MatchGlasses', 'Cleaner_MatchMedicalDevices'],
    }],
  },
  {
    id: 'cleaner-neighborhood', label: 'Neighborhood cleanup', category: 'cleaner', menuPath: ['Neighborhood Cleaner'],
    blocks: [{
      id: 'neighborhood', label: 'Neighborhood cleanup',
      keys: ['Cleaner_BypassFamilyGhosts', 'Cleaner_CleanCulled', 'Cleaner_SyncHouseholdNames'],
    }],
  },
  {
    id: 'dresser-facial-hair', label: 'Facial hair settings', category: 'dresser', menuPath: ['Facial Hair Settings'],
    blocks: [{
      id: 'facial-hair', label: 'Facial hair',
      keys: ['Dresser_FacialHairAges', 'Dresser_FacialHairPercent'],
    }],
  },
  {
    id: 'dresser-makeup', label: 'Makeup settings', category: 'dresser', menuPath: ['Makeup Settings'],
    blocks: [
      {
        id: 'makeup-checks', label: 'Makeup checks',
        keys: ['Dresser_RunMakeupCheck', 'Dresser_MakeupAges', 'Dresser_MakeupGenders', 'Dresser_MakeupOutfits'],
        fullWidthKeys: ['Dresser_MakeupOutfits'],
      },
      {
        id: 'facepaint-dark-form', label: 'Facepaint and dark form',
        keys: ['Dresser_IncludeDarkFormMakeup', 'Dresser_CopyPasteFacepaint', 'Dresser_MakeupIncludesFacePaint'],
      },
    ],
  },
  {
    id: 'dresser-outfit-cleanup', label: 'Outfit cleanup preferences', category: 'dresser', menuPath: ['Outfits Settings'],
    blocks: [{
      id: 'outfit-cleanup', label: 'Outfit cleanup preferences',
      keys: ['Dresser_IncludeDarkFormOutfits', 'Dresser_OnlyUseSavedOutfits'],
    }],
  },
  {
    id: 'population-other', label: 'Other population settings', category: 'population', menuPath: ['Other Settings'],
    blocks: [
      {
        id: 'lot-population', label: 'Lot population',
        keys: ['Population_MaxSimsInZone', 'Population_RandomizeVisitingSims', 'Population_NumAdjustLot'],
        fullWidthKeys: ['Population_NumAdjustLot'],
      },
      {
        id: 'special-visitors', label: 'Special visitors',
        keys: ['Population_AllowNoClowns', 'Population_ReaperStopStalking'],
      },
      {
        id: 'sim-persistence', label: 'Sim persistence',
        keys: ['Population_BypassCulling', 'Population_DisableImmortalSims'],
        fullWidthKeys: ['Population_DisableImmortalSims'],
      },
    ],
  },
  {
    id: 'woohoo-actions', label: 'WooHoo actions', category: 'woohoo', menuPath: ['WooHoo Actions'],
    blocks: [
      {
        id: 'partners', label: 'Partners',
        keys: ['Woohoo_AllowFamily', 'Woohoo_FriendlierWoohooPartner', 'Woohoo_AllowTeens'],
      },
      {
        id: 'try-for-baby', label: 'Try for Baby availability',
        keys: ['Woohoo_AllowTFB', 'Woohoo_AllowGhostTFB', 'Woohoo_ElderTryForBaby', 'Woohoo_SameSexTryForBaby'],
      },
    ],
  },
  {
    id: 'woohoo-pregnancy', label: 'WooHoo pregnancy', category: 'woohoo', menuPath: ['WooHoo Pregnancy'],
    blocks: [
      {
        id: 'chances', label: 'Pregnancy chances',
        keys: ['Woohoo_RiskyWoohooPercents', 'Woohoo_UseFertileInRisky', 'Woohoo_TryForBabyPercent'],
      },
      {
        id: 'recipients', label: 'Pregnancy recipients',
        keys: ['Woohoo_SameSexPregnantSim', 'Woohoo_OppositeSexPregnantSim'],
      },
    ],
  },
  {
    id: 'woohoo-reactions', label: 'WooHoo reactions', category: 'woohoo', menuPath: ['WooHoo Reactions'],
    blocks: [{
      id: 'reactions', label: 'Reactions',
      keys: ['Woohoo_BedSharing', 'Woohoo_DisableJealousy', 'Woohoo_UsePrivacy', 'Woohoo_SleepyWoohoo'],
    }],
  },
  {
    id: 'woohoo-nudity', label: 'Nudity preferences', category: 'woohoo', menuPath: ['Sim Nudity'],
    blocks: [{
      id: 'preferences', label: 'Nudity preferences',
      keys: ['Woohoo_NudeWoohooGender', 'Woohoo_NudityAges', 'Woohoo_RemainNude'],
    }],
  },
  {
    id: 'woohoo-nudity-interactions', label: 'Nudity interactions', category: 'woohoo',
    menuPath: ['Sim Nudity', 'Nudity Interactions'],
    blocks: [
      {
        id: 'woohoo-interactions', label: 'WooHoo interactions',
        keys: ['Woohoo_NudeWoohoo', 'Woohoo_NudeInHotTub', 'Woohoo_NudeInHotSprings', 'Woohoo_NudeInSauna', 'Woohoo_NudeInShower'],
      },
      {
        id: 'other-activities', label: 'Other activities',
        keys: ['Woohoo_NudeSpa', 'Woohoo_NudeYoga', 'Woohoo_NudeWorkout'],
      },
    ],
  },
  {
    id: 'woohoo-other', label: 'Other WooHoo settings', category: 'woohoo', menuPath: ['Other Settings'],
    blocks: [
      {
        id: 'autonomy', label: 'Autonomy',
        keys: ['Woohoo_AutonomousWoohoo', 'Woohoo_AutonomousTryForBaby', 'Woohoo_AutonomousMinRestTime', 'Woohoo_ExtremeWoohoo'],
      },
      {
        id: 'birth-control', label: 'Birth control',
        keys: ['Woohoo_UseBirthControl', 'Woohoo_BirthControlDuration', 'Woohoo_BirthControlAllMoods'],
      },
      { id: 'skill', label: 'WooHoo skill', keys: ['Woohoo_UseWoohooSkill'] },
    ],
  },
]
