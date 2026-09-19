export type PregnancySettingsGroup = {
  id: string
  label: string
  menuPath: string[]
  blocks: {
    id: string
    label: string
    keys: readonly string[]
    columns?: 2 | 3
  }[]
}

// Presentation only: every key retains its own metadata, navigation path,
// imported value, validation, and Undo. Offspring has its own existing group.
export const pregnancySettingGroups: readonly PregnancySettingsGroup[] = [
  {
    id: 'adoption', label: 'Adoption Settings', menuPath: ['Adoption Settings'],
    blocks: [
      {
        id: 'chances', label: 'Adoption chances',
        keys: ['Pregnancy_OppositeSexAdoptionPercent', 'Pregnancy_SameSexAdoptionPercent'],
      },
      {
        id: 'adopted-sims', label: 'Adopted Sims and naming',
        keys: ['Pregnancy_AdoptionAges', 'Pregnancy_AdoptionPercentMale', 'Pregnancy_NameInactiveAdoption'],
      },
    ],
  },
  {
    id: 'marriage-selection', label: 'Marriage Sim Selection', menuPath: ['Marriage Sim Selection'],
    blocks: [
      {
        id: 'schedule', label: 'Schedule and marriage chances',
        keys: ['Marriage_DaysToRun', 'Marriage_AgePercentage'],
      },
      {
        id: 'eligibility', label: 'Ages and gender preferences',
        keys: ['Marriage_TargetSimAges', 'Marriage_UseGenderPreference', 'Marriage_FlagGenderPreferencePercent'],
      },
      {
        id: 'households', label: 'Household eligibility and exclusions',
        keys: [
          'Marriage_AllowHomeless', 'Marriage_BypassDorms', 'Marriage_BypassPlayedHouseholds',
          'Marriage_BypassRenters', 'Marriage_BypassRobots', 'Marriage_BypassActiveRomanticInterest',
        ],
      },
    ],
  },
  {
    id: 'neighborhood-stories', label: 'Neighborhood Stories Settings', menuPath: ['Neighborhood Stories Settings'],
    blocks: [
      {
        id: 'rules', label: 'Neighborhood Stories rules',
        keys: ['Pregnancy_LimitNS', 'Pregnancy_OnlyNSPregnancy', 'Pregnancy_NSAdoptChildLimit', 'Pregnancy_NSAdoptPetLimit'],
      },
    ],
  },
  {
    id: 'other-marriage', label: 'Other Marriage', menuPath: ['Other Marriage'],
    blocks: [
      {
        id: 'confirmation-names', label: 'Confirmation and spouse names',
        keys: [
          'Marriage_ManualConfirmation', 'Marriage_ManualRenameSpouses',
          'Marriage_RenameOppositeSex', 'Marriage_RenameSameGender',
        ],
      },
      {
        id: 'households', label: 'Households, neighborhoods, and service roles',
        keys: ['Marriage_MoveFamilies', 'Marriage_SameNeighborhood', 'Marriage_RemoveServiceRoleLimit'],
      },
      {
        id: 'compatibility', label: 'Gender and trait rules',
        keys: ['Marriage_RequireCASPregnancy', 'Marriage_UseFrameForGender', 'Marriage_UseTraitsForMarriage'],
      },
    ],
  },
  {
    id: 'other-pregnancy', label: 'Other Pregnancy', menuPath: ['Other Pregnancy'],
    blocks: [
      {
        id: 'timing', label: 'Pregnancy timing and pauses',
        keys: [
          'Pregnancy_Duration', 'Pregnancy_AgeWhenPregnant',
          'Pregnancy_PauseSimsPregnancy', 'Pregnancy_PauseOnPlayableLabor',
        ],
      },
      {
        id: 'moods', label: 'Pregnancy moods',
        keys: ['Pregnancy_UseRandomMoods', 'Pregnancy_RandomMoodDuration'],
      },
      {
        id: 'households', label: 'Automatic marriage and households',
        keys: ['Pregnancy_AutoMarryPercent', 'Pregnancy_BypassBusinessOwnerMoveouts'],
      },
      {
        id: 'confirmation-eligibility', label: 'Confirmation and eligibility rules',
        keys: ['Pregnancy_ManualConfirmation', 'Pregnancy_UseFrameForGender', 'Pregnancy_UseTraitsForPregnancy'],
      },
    ],
  },
  {
    id: 'partner-selection', label: 'Partner Sim Selection', menuPath: ['Partner Sim Selection'],
    blocks: [
      {
        id: 'ages-genders', label: 'Partner ages and genders',
        keys: [
          'Pregnancy_SeedSimAges', 'Pregnancy_InsiminateGenders',
          'Pregnancy_UseSameAgeGroup', 'Pregnancy_SameSexPercentage',
        ],
      },
      {
        id: 'relationships', label: 'Relationship eligibility',
        keys: ['Pregnancy_RelationshipOnly', 'Pregnancy_AllowAffairsPercent', 'Pregnancy_EnforceFamily'],
      },
      {
        id: 'preferences', label: 'Partner preferences',
        keys: ['Pregnancy_SameOccultOnly', 'Pregnancy_OccupancyType', 'Pregnancy_UseAttractionValues'],
      },
    ],
  },
  {
    id: 'pet-pregnancy', label: 'Pet Pregnancy Settings', menuPath: ['Pet Pregnancy Settings'],
    blocks: [
      {
        id: 'eligibility-notifications', label: 'Eligible pets and notifications',
        keys: [
          'Pregnancy_PetAgeToRun', 'Pregnancy_PetPartnerAge',
          'Pregnancy_PetAllowHomeless', 'Show_PetPregnancyNotificationType',
        ],
      },
      {
        id: 'limits', label: 'Pet household and offspring limits',
        keys: ['Pregnancy_PetMaxHouseholdChildren', 'Pregnancy_PetMaxOffspring'],
      },
      {
        id: 'percentages', label: 'Pregnancy chances by species', columns: 3,
        keys: ['Pregnancy_CatAgePercentage', 'Pregnancy_DogAgePercentage', 'Pregnancy_HorseAgePercentage'],
      },
    ],
  },
  {
    id: 'pregnant-selection', label: 'Pregnant Sim Selection', menuPath: ['Pregnant Sim Selection'],
    blocks: [
      {
        id: 'schedule', label: 'Schedule and pregnancy chances',
        keys: ['Pregnancy_DaysToRun', 'Pregnancy_AgePercentage'],
      },
      {
        id: 'eligibility', label: 'Ages and pregnancy eligibility',
        keys: [
          'Pregnancy_TargetSimAges', 'Pregnancy_AgeUpDaysLimit', 'Pregnancy_AllowMalePregnancy',
          'Pregnancy_UseGenderPreference', 'Pregnancy_FlagGenderPreferencePercent',
        ],
      },
      {
        id: 'households', label: 'Household eligibility and exclusions',
        keys: [
          'Pregnancy_AllowHomeless', 'Pregnancy_BypassDorms', 'Pregnancy_BypassPlayedHouseholds',
          'Pregnancy_BypassRenters', 'Pregnancy_BypassRobots', 'Pregnancy_BypassActiveRomanticInterest',
        ],
      },
    ],
  },
  {
    id: 'spouse-selection', label: 'Spouse Sim Selection', menuPath: ['Spouse Sim Selection'],
    blocks: [
      {
        id: 'ages-genders', label: 'Spouse ages and genders',
        keys: [
          'Marriage_SpouseSimAges', 'Marriage_SpouseGenders',
          'Marriage_UseSameAgeGroup', 'Marriage_SameSexPercentage',
        ],
      },
      {
        id: 'preferences', label: 'Spouse preferences',
        keys: ['Marriage_OccupancyType', 'Marriage_SameOccultOnly', 'Marriage_UseAttractionValues'],
      },
      {
        id: 'trait-pairs', label: 'Marriage trait pairs',
        keys: ['Marriage_RequiredTraitsList', 'Marriage_ConflictTraitsList'],
      },
    ],
  },
]

export const pregnancySettingKeys = new Set<string>(
  pregnancySettingGroups.flatMap(group => group.blocks.flatMap(block => block.keys)),
)
