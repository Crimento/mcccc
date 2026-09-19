import referenceData from '../data/settings-reference.json'
import { inGameSettings, type DefaultNumberFieldMeta } from '../data/in-game-settings'
import { dresserMakeupOutfitOptions, dresserStandardOutfitOptions } from '../data/dresser-choices'
import {
  populationLotOptions, populationImmortalOptions, populationChoiceOptions,
  populationChallengeLotChoices, populationChallengeTimeChoices,
  populationImportTrayTypeChoices, populationImportTagChoices,
  populationImportNameChoices, populationMoveOutElderChoices,
} from '../data/population-choices'
import { neighborhoodActionPlanOptions } from '../data/neighborhood-action-plans'
import { motiveDecayKeys } from './motive-decay'
import { personalityTraitOptions, petTraitOptions } from './trait-settings'
import { walkstyleKeys, walkstyleOptions } from './walkstyles'
import { cleanerHouseholdOptions } from './cleaner-settings'
import { notificationAudienceOptions } from './notification-audiences'
import { getNavigation } from './navigation'
import { getOccultPregnancyFields } from './occult-pregnancy'
import { getOccultSharedMeta } from './occult-settings'
import { settingDescriptions } from './setting-descriptions'

export { categories, compareSettingsForNavigation } from './navigation'

export type { DefaultNumberFieldMeta } from '../data/in-game-settings'

export type Option = { value: string; label: string; group?: string }
export type SliderBounds = { min: number; max: number; step: number; allowOutOfRange?: boolean }
export type CsvNumberFieldsMeta = {
  labels: string[]; min: number; max: number; step: number; unit?: string
  indices?: number[]
  tokenCount?: number
  totalMax?: number
  remainderLabel?: string
}

export type SettingMeta = {
  key: string
  label: string
  description: string
  category: string
  menuPath: string[]
  menuPaths?: string[][]
  section: string
  kind: 'boolean' | 'number' | 'text' | 'select' | 'multiselect' | 'json'
  options?: Option[]
  emptySelectionLabel?: string
  min?: number
  max?: number
  step?: number
  unit?: string
  range?: SliderBounds
  rangeFields?: Record<string, SliderBounds>
  csvNumbers?: CsvNumberFieldsMeta
  arrayNumbers?: CsvNumberFieldsMeta
  occultAging?: 'multiplier' | 'maximum'
  valueLabels?: Record<string, string>
  numericFields?: Record<string, DefaultNumberFieldMeta>
  documentationSource?: 'official' | 'in-game'
  sourceNote?: string
  defaultValue?: boolean | string | number
  defaultLabel?: string
  internal?: boolean
  readOnlyReason?: string
  impact?: {
    level: 'interrupts' | 'gameplay'
    title: string
    description: string
  }
  documented: boolean
}

type Reference = {
  SettingName: string
  Description: string
  MenuPath: string
  DefaultValue: string
  Module: string
}

export const referenceSource = 'https://deaderpool-mccc.com/search.html'
export const referenceDataSource = 'https://deaderpool-mccc.com/otherassets/menu_data.json'
export const referenceInfo = {
  sourceUrl: referenceDataSource,
  retrievedAt: '2026-09-16',
  recordCount: referenceData.length,
}
const reference = new Map<string, Reference>(referenceData.map((item) => [item.SettingName, item]))
const inGameReference = new Map(Object.entries(inGameSettings))
// Explicitly excluded from editing at the user's request. Their behavior is not
// documented here; retain their data without inferring other keys by name.
const internalSettings = new Set(['Autosave_CurrentSaveNumber', 'DP_OneTimeUpdate', 'DP_UseOnly'])

const options = (...entries: [string, string][]): Option[] =>
  entries.map(([value, label]) => ({ value, label }))

const adultAges = options(['T', 'Teen'], ['YA', 'Young adult'], ['A', 'Adult'], ['E', 'Elder'])
// Confirmed by the user's AgeStopHuman menu and all-selected config string.
const humanAges = options(
  ['I', 'Infant'], ['TD', 'Toddler'], ['C', 'Child'], ['T', 'Teen'],
  ['YA', 'Young Adult'], ['A', 'Adult'], ['E', 'Elder'],
)
const genders = options(['M', 'Male'], ['F', 'Female'])
const days = options(
  ['MO', 'Monday'], ['TU', 'Tuesday'], ['WE', 'Wednesday'], ['TH', 'Thursday'],
  ['FR', 'Friday'], ['SA', 'Saturday'], ['SU', 'Sunday'],
)
const notificationAudience = notificationAudienceOptions(undefined, { AL: 'All Sims outside the active household' })
const storyAudience = notificationAudienceOptions(['0', 'N', 'P', 'R', 'AL'])
const occupancy = options(
  ['', 'Any household'], ['HL', 'Homeless only'],
  ['PH', 'Prefer Sims with homes'], ['HO', 'Sims with homes only'],
)
const menuVisibility = options(['A', 'Always'], ['ASH', 'While holding Shift'], ['N', 'Hidden'])
const nonActiveNaming = options(
  ['N', 'All'], ['A', 'Include Active Sims Only'], ['P', 'Include Played Households'], ['R', 'Related to Active Household'],
)

// These codes are documented by the official reference or the separately
// attributed in-game observations. Do not infer encodings from display names.
const singleChoices: Record<string, Option[]> = {
  Appearance_ApplyTemplate: options(['', 'Manual'], ['A', 'On age-up'], ['Z', 'On zone-in']),
  Dresser_ChangeOutfitAfterCareerF: [{ value: '', label: 'Keep career outfit' }, ...dresserStandardOutfitOptions()],
  Dresser_ChangeOutfitAfterCareerM: [{ value: '', label: 'Keep career outfit' }, ...dresserStandardOutfitOptions()],
  ...Object.fromEntries([...walkstyleKeys].map(key => [key, walkstyleOptions])),
  // Codes and labels confirmed by the user from the in-game interval dropdown.
  Autosave_IntervalType: options(
    ['PM', 'Pre-Midnight Alarm'], ['RH', 'Real Hours'], ['SD', 'Sim Day'], ['SH', 'Sim Hour'],
  ),
  Marriage_OccupancyType: occupancy,
  Pregnancy_OccupancyType: occupancy,
  Pregnancy_RelationshipOnly: options(
    ['N', 'No limits'], ['M', 'Married Only'], ['S', 'Significant Other'], ['W', 'WooHoo partners'],
  ),
  Pregnancy_AllowMalePregnancy: options(
    ['N', 'No pregnancy'], ['Y', 'Allow pregnancy'], ['S', 'Same sex only'],
  ),
  // These naming audiences share confirmed choices, but remain independent
  // saved settings. getSettingMeta returns a fresh option array for each field.
  Pregnancy_NameInactiveAdoption: nonActiveNaming,
  Pregnancy_NameInactiveOffspring: nonActiveNaming,
  Pregnancy_OffspringTraitsType: options(
    ['N', 'Inherit no Traits'], ['F', 'Inherit Maximum Number'], ['R', 'Inherit Random Number'],
  ),
  Marriage_ManualRenameSpouses: options(['N', 'All'], ['P', 'Played households'], ['A', 'None']),
  Marriage_SameNeighborhood: options(
    ['A', 'Always Limit Partners by Neighborhood'], ['N', 'Never Limit Partners by Neighborhood'],
    ['P', 'Prefer Partners In Same Neighborhood'],
  ),
  Marriage_RenameOppositeSex: options(
    ['N', 'Keep both names'], ['M', "Use the man's name"], ['F', "Use the woman's name"],
    ['R', 'Choose either name randomly'], ['RN', 'Random name or no change'],
  ),
  // Exact choices confirmed by the user during the Population menu review.
  Population_MoveOutEldersType: populationChoiceOptions(populationMoveOutElderChoices),
  Population_RandomLimitHouseholdType: populationChoiceOptions(populationImportTrayTypeChoices),
  Population_UseTagsOnImportSims: populationChoiceOptions(populationImportTagChoices),
  Population_ImportSimNameChoice: populationChoiceOptions(populationImportNameChoices),
  Population_RandomChallengeLotType: populationChoiceOptions(populationChallengeLotChoices),
  Population_RandomChallengeTimeUnits: populationChoiceOptions(populationChallengeTimeChoices),
  Occult_AlienFrequency: options(
    ['0', 'No abductions'], ['N', 'Normal'], ['H', 'High'], ['A', 'Alien invasion'],
  ),
  Occult_ForceAlienDisguiseType: options(
    ['', "Default (don't force)"], ['H', 'Force Disguise'], ['A', 'Force No Disguise'],
  ),
  // The user confirmed the in-game single choice and its M/F codes.
  Occult_AbductionPregnancyGenders: genders,
  Occult_AlienPollinatorGenders: genders,
  Show_MarriageNotificationType: notificationAudience,
  Show_BirthNotificationType: notificationAudience,
  Show_PregnancyNotificationType: notificationAudience,
  Show_PregnancyAffairNotificationType: notificationAudience,
  Show_RelChangeNotificationType: notificationAudienceOptions(),
  Show_AgeUpNotificationType: notificationAudience,
  Show_MovingNotificationType: notificationAudience,
  Show_VersionCheckNotification: options(
    ['N', 'None'], ['A', 'Always Check'], ['G', 'When Game Updates'],
  ),
  // The old reference key is intentionally not aliased to Show_DeathNotificationType.
  Show_DeathNotifications: notificationAudience,
  Show_DeathNotificationType: notificationAudienceOptions(),
  Show_NSAdoptionType: storyAudience,
  Show_NSPregnancyType: storyAudience,
  Show_NSPopulationType: storyAudience,
  Show_NSCareerType: storyAudience,
  Show_NSDeathType: storyAudience,
  Show_PetPregnancyNotificationType: notificationAudienceOptions(['0', 'N', 'P', 'R', 'AL'], {
    N: 'NPC pets', P: 'Played / active pets', R: 'Related to active pets', AL: 'All pets outside the active household',
  }),
  Show_PetDeathNotificationType: notificationAudienceOptions(['0', 'N', 'P', 'AL'], {
    N: 'NPC pets', P: 'Played pets', AL: 'All pets outside the active household',
  }),
  Show_Cheats_Menu_Type: menuVisibility,
  Show_Computer_Menu_Type: menuVisibility,
  Show_Gnome_Menu_Type: menuVisibility,
  Show_Sim_Menu_Type: options(
    ['A', 'All menus'], ['ASH', 'All menus while holding Shift'], ['N', 'Hidden'],
    ['S', 'On Sims only'], ['SSH', 'On Sims while holding Shift'], ['R', 'Relationship panel only'],
  ),
  Pay_Child_Support_Type: options(
    ['N', 'None'], ['A', 'All parents'], ['M', 'Married parents only'], ['U', 'Unmarried parents only'],
  ),
  // These four inheritance codes were confirmed by the user; older reference
  // labels without confirmed codes are not inferred or added as options.
  Inherit_Sim_Type: options(
    ['0', 'None'], ['AL', 'All'], ['A', 'Active Only'], ['N', 'NPC Only'],
  ),
  RelationshipCullingType: options(
    ['E', 'Game default'], ['D', 'Disabled'], ['C', 'Use MC Cleaner rules'],
  ),
  Silence_Phone_Texts: options(['A', 'All texts'], ['F', 'Festival texts only'], ['N', 'No texts']),
}

// These user-confirmed dropdowns store JSON numbers rather than string codes.
// Keep this separate from string choices so an unusual imported type is retained.
const numericChoices: Record<string, Option[]> = {
  Relationship_BreakupMoveoutSim: options(
    ['0', 'None'], ['1', 'Male Sim'], ['2', 'Female Sim'], ['3', 'Random Sim'],
  ),
  Relationship_MoveinRomanceAmt: options(
    ['25', 'Lovers'], ['50', 'Sweethearts'], ['75', 'Soul Mates'], ['100', 'True Lovers'],
  ),
}

// A multiselect still reads and writes a comma-delimited STRING in mc_settings.cfg.
// The UI must retain unrecognized imported tokens when known choices are changed.
const multipleChoices: Record<string, Option[]> = {
  CAS_Trait_Blacklist: personalityTraitOptions,
  CAS_Pet_Trait_Blacklist: petTraitOptions,
  Bypass_Sim_Menus: options(
    ['REL', 'Relationships'], ['SimCom', 'Sim Commands'], ['Flag', 'Sim Flags'],
    ['CAS', 'Modify in CAS'], ['HCAS', 'Modify Household in CAS'],
    ['MCCH', 'MC Cheats'], ['MCCA', 'MC CAS'], ['MCCO', 'MC Control'],
    ['MCDR', 'MC Dresser'], ['MCPR', 'MC Pregnancy'], ['MCTU', 'MC Tuner'],
  ),
  AgeStopHuman: humanAges,
  Neighborhood_Action_Plan_Bypass: neighborhoodActionPlanOptions,
  Relationship_MoveinAges: adultAges,
  Marriage_TargetSimAges: adultAges,
  Marriage_SpouseSimAges: adultAges,
  Pregnancy_TargetSimAges: adultAges,
  Pregnancy_SeedSimAges: adultAges,
  Marriage_SpouseGenders: genders,
  Pregnancy_InsiminateGenders: genders,
  // Older/alternate files use a separate M/F CSV setting, not the current
  // numeric gender-percentages object. Keep both imported keys independent.
  Pregnancy_OffspringGender: genders,
  Pregnancy_PauseSimsPregnancy: options(['A', 'Active Sims'], ['P', 'Played Sims'], ['N', 'NPC Sims']),
  Marriage_DaysToRun: days,
  Pregnancy_DaysToRun: days,
  // The user's current menu includes Infant, matching I in the supplied file.
  // B is the reference's Baby code, displayed with the current Newborn label.
  Pregnancy_AdoptionAges: options(
    ['B', 'Newborn'], ['I', 'Infant'], ['TD', 'Toddler'], ['C', 'Child'], ['T', 'Teen'],
  ),
  Pregnancy_PetAgeToRun: options(['A', 'Adult'], ['E', 'Elder']),
  Pregnancy_PetPartnerAge: options(['A', 'Adult'], ['E', 'Elder']),
  Occult_AbductionAges: options(['C', 'Child'], ...adultAges.map(({ value, label }) => [value, label] as [string, string])),
  Occult_AbductionPregnancyAges: adultAges,
  // Recipient codes and combinations confirmed by the user. Each choice is
  // independent, including combinations of genders and interaction roles.
  Woohoo_SameSexPregnantSim: options(['T', 'Target'], ['I', 'Initiator']),
  Woohoo_OppositeSexPregnantSim: options(
    ['F', 'Female'], ['M', 'Male'], ['T', 'Target'], ['I', 'Initiator'],
  ),
  Woohoo_NudityAges: adultAges,
  Woohoo_NudeWoohooGender: genders,
  // These complete lists were confirmed by selecting every age in-game and
  // inspecting the resulting I,TD,C,T,YA,A,E config strings.
  Dresser_RunOnAgeUp: humanAges,
  Dresser_FacialHairAges: adultAges,
  Dresser_MakeupAges: humanAges,
  Dresser_MakeupGenders: genders,
  Dresser_MultipleOutfitAges: humanAges,
  Dresser_MultipleOutfitGenders: genders,
  Population_ButlerAges: adultAges,
  Population_BarNights: options(
    ['AL', 'Aliens Night'], ['BE', 'Bear Night'], ['GH', 'Ghosts Night'], ['GU', 'Guys Night'],
    ['KN', 'Knight Night'], ['LA', 'Ladies Night'], ['SI', 'Singles Night'],
  ),
  // The user's complete in-game lists supplement the older website reference.
  Population_NumAdjustLot: populationLotOptions(),
  Population_DisableImmortalSims: populationImmortalOptions(),
  Dresser_MakeupOutfits: dresserMakeupOutfitOptions(),
}

// Bounds come from explicit official descriptions or user-confirmed controls.
const numberBounds: Record<string, { min?: number; max?: number; step?: number; unit?: string }> = {
  Dresser_PercentUseCustomSkinTone: { min: 0, max: 100, step: 1, unit: '%' },
  Dresser_PercentMultipleOutfits: { min: 0, max: 100, step: 1, unit: '%' },
  Dresser_MaximumMultipleOutfits: { min: 1, max: 5, step: 1 },
  Appearance_ParentAppearanceVariance: { min: 0, max: 100, step: 1, unit: '%' },
  ...Object.fromEntries([...motiveDecayKeys].map(key => [key, { min: 0, max: 500, step: 1, unit: '%' }])),
  ...Object.fromEntries(['Aliens', 'Fairies', 'Mermaids', 'Spellcasters', 'Vampires', 'Werewolves']
    .map(species => [`Occult_Maximum${species}`, { min: -1, max: 50, step: 1 }])),
  // Confirmed by the user from the in-game abduction controls.
  Occult_AbductionStartHour: { min: 0, max: 23, step: 1, unit: 'hours' },
  Occult_AbductionDuration: { min: 1, max: 24, step: 1, unit: 'hours' },
  Occult_TimeBetweenAbductions: { min: 1, max: 24, step: 1, unit: 'hours' },
  Woohoo_AutonomousMinRestTime: { min: 0, max: 24, step: 1, unit: 'hours' },
  Woohoo_BirthControlDuration: { min: 1, max: 24, step: 1, unit: 'hours' },
  Pregnancy_Duration: { min: 1, max: 120, step: 1, unit: 'days' },
  Pregnancy_RandomMoodDuration: { min: 1, max: 23, unit: 'Sim hours' },
  Pregnancy_AgeUpDaysLimit: { min: 0, max: 10, step: 1, unit: 'days' },
  Pregnancy_NSAdoptChildLimit: { min: -1, max: 7, step: 1 },
  Pregnancy_NSAdoptPetLimit: { min: -1, max: 7, step: 1 },
  Pregnancy_MaxOffspring: { min: 1, max: 6, step: 1 },
  Pregnancy_PetMaxOffspring: { min: 1, max: 6, step: 1 },
  Pregnancy_MaxHouseholdChildren: { min: 1, max: 50, step: 1 },
  Pregnancy_PetMaxHouseholdChildren: { min: 1, max: 50, step: 1 },
  Population_RandomChallengeMaxTime: { min: 1, max: 100, step: 1 },
  Population_RandomChallengeMaxNum: { min: 0, max: 12, step: 1 },
  Population_MaximumHomeless: { min: -1, max: 100, step: 1 },
  Population_OpenHouses: { min: 0, max: 100, step: 1 },
  Population_MaximumHouseholdPets: { min: -1, max: 103, step: 1 },
  Population_MaxSimsInZone: { min: 5, max: 200, step: 1 },
  ...Object.fromEntries([
    'Population_PercentBaby', 'Population_PercentInfant', 'Population_PercentToddler',
    'Population_PercentChild', 'Population_PercentAdult', 'Population_PercentElder',
    'Population_PercentMale', 'Population_PercentFemaleFrame', 'Population_PercentMaleFrame',
    'Population_RandomUseTraySimPercent', 'Population_HomelessApartmentPercent',
    'Marriage_FlagGenderPreferencePercent', 'Marriage_SameSexPercentage',
    'Pregnancy_AdoptionPercentMale', 'Pregnancy_OppositeSexAdoptionPercent', 'Pregnancy_SameSexAdoptionPercent',
    'Pregnancy_IdenticalOffspringChance', 'Pregnancy_AutoMarryPercent', 'Pregnancy_AllowAffairsPercent',
    'Pregnancy_FlagGenderPreferencePercent', 'Pregnancy_SameSexPercentage',
    'Woohoo_TryForBabyPercent',
  ].map(key => [key, { min: 0, max: 100, unit: '%' }])),
  Occult_VampireExpAdjustment: { min: -10, max: 10, step: 1 },
  Club_OpenMemberSlots: { min: 0, max: 7, step: 1 },
  // User-confirmed integer ranges; the official descriptions also state the maxima.
  Autosave_IntervalAmount: { min: 1, max: 24, step: 1 },
  Autosave_MaxSaveNumber: { min: 1, max: 10, step: 1 },
  // User-reviewed gameplay ranges.
  Game_Time_Speed: { min: 1, max: 1000, step: 1 },
  Maximum_Household_Size: { min: 8, max: 104, step: 1 },
  Maximum_Rename_Length: { min: 14, max: 255, step: 1 },
  // User-confirmed bill ranges agree with the reference's adjustment examples.
  Bill_AmountPercentApartment: { min: -100, max: 1000, step: 1, unit: '%' },
  Bill_Amount_Percent: { min: -100, max: 1000, step: 1, unit: '%' },
  Pay_Child_Support_Percent: { min: 1, max: 1000, step: 1, unit: '%' },
  Pregnancy_OffspringTraitsMax: { min: 1, max: 20, step: 1 },
  Club_ClubMemberCount: { min: 8, max: 50, step: 1 },
  Club_MaximumClubCount: { min: 1, max: 50, step: 1 },
  Skill_Difficulty_Adjustment: { min: -50, max: 10, step: 1 },
  Career_Difficulty_Adjustment: { min: -50, max: 10, step: 1 },
  Career_University_Difficulty_Adjustment: { min: -50, max: 10, step: 1 },
  Career_Homework_Speed: { min: -3, max: 50, step: 1 },
  Career_University_Homework_Speed: { min: -3, max: 50, step: 1 },
  Career_Decay_Ratio_SecretSociety: { min: 0, max: 500, step: 1, unit: '%' },
  Cleaner_LeaveRelationshipCount: { min: 0, max: 100, step: 1 },
  Tuner_MaximumArchive: { min: 0, max: 200, step: 1 },
  Friendship_Difficulty_Adjustment: { min: -50, max: 10, step: 1 },
  Decay_Ratio_Friendship: { min: 0, max: 500, step: 1, unit: '%' },
  Romance_Difficulty_Adjustment: { min: -50, max: 10, step: 1 },
  Decay_Ratio_Romantic: { min: 0, max: 500, step: 1, unit: '%' },
  Relationship_BreakupPercent: { min: 0, max: 100, step: 1, unit: '%' },
  Relationship_BreakupMarriagePercent: { min: 0, max: 100, step: 1, unit: '%' },
  Relationship_BreakupMoveoutOffspring: { min: 0, max: 100, step: 1, unit: '%' },
  Relationship_MoveinPercent: { min: 0, max: 100, step: 1, unit: '%' },
  LifeSkill_Difficulty_Adjustment: { min: -50, max: 10, step: 1 },
  Fame_Difficulty_Adjustment: { min: -50, max: 10, step: 1 },
  Prestige_Difficulty_Adjustment: { min: -50, max: 10, step: 1 },
}

const numberValueLabels: Record<string, Record<string, string>> = {
  ...Object.fromEntries(['Aliens', 'Fairies', 'Mermaids', 'Spellcasters', 'Vampires', 'Werewolves']
    .map(species => [`Occult_Maximum${species}`, { '-1': 'Unlimited' }])),
  Population_MaximumHomeless: { '-1': 'Unlimited' },
  Population_MaximumHouseholdPets: { '-1': 'Unlimited', '0': 'No automatic stray move-in' },
  Population_RandomChallengeMaxNum: { '0': 'Disabled' },
  Pregnancy_NSAdoptChildLimit: { '-1': 'Neighborhood Stories default', '0': 'No adoptions' },
  Pregnancy_NSAdoptPetLimit: { '-1': 'Neighborhood Stories default', '0': 'No adoptions' },
}

// Display-only defaults from the user's choice review and bundled reference.
// These never replace the imported value or create a missing setting.
const populationDefaults: Record<string, Pick<SettingMeta, 'defaultValue' | 'defaultLabel'>> = {
  Population_MoveOutEldersType: { defaultValue: '', defaultLabel: 'None' },
  Population_RandomLimitHouseholdType: { defaultValue: 'A', defaultLabel: 'Any Saved Sims' },
  Population_UseTagsOnImportSims: { defaultValue: '', defaultLabel: 'Disabled' },
  Population_ImportSimNameChoice: { defaultValue: 'N', defaultLabel: 'Skip Sim If Name Exists' },
  Population_RandomChallengeLotType: { defaultValue: 'A', defaultLabel: 'Active Home Lot Only' },
  Population_RandomChallengeTimeUnits: { defaultValue: 'SD', defaultLabel: 'Sim Days' },
  Population_MaximumHomeless: { defaultValue: -1, defaultLabel: 'Unlimited' },
  Population_OpenHouses: { defaultValue: 1, defaultLabel: '1' },
}

const pregnancyDefaults: Record<string, Pick<SettingMeta, 'defaultValue' | 'defaultLabel'>> = {
  Pregnancy_OffspringGender: { defaultValue: 'M,F', defaultLabel: 'Male and Female' },
  Pregnancy_RelationshipOnly: { defaultValue: 'N', defaultLabel: 'No limits' },
  Pregnancy_AllowMalePregnancy: { defaultValue: 'N', defaultLabel: 'No pregnancy' },
  Pregnancy_PetPartnerAge: { defaultValue: 'A', defaultLabel: 'Adult' },
  Pregnancy_PetMaxOffspring: { defaultValue: 3, defaultLabel: '3' },
  Pregnancy_AgeUpDaysLimit: { defaultValue: 0, defaultLabel: '0 days' },
  Pregnancy_NameInactiveAdoption: { defaultValue: 'A', defaultLabel: 'Include Active Sims Only' },
  Pregnancy_NameInactiveOffspring: { defaultValue: 'A', defaultLabel: 'Include Active Sims Only' },
  Pregnancy_OffspringTraitsType: { defaultValue: 'N', defaultLabel: 'Inherit no Traits' },
  Marriage_ManualRenameSpouses: { defaultValue: 'A', defaultLabel: 'None' },
  Marriage_SameNeighborhood: { defaultValue: 'N', defaultLabel: 'Never Limit Partners by Neighborhood' },
  Pregnancy_PauseSimsPregnancy: { defaultValue: '', defaultLabel: 'None' },
  Pregnancy_MaxOffspring: { defaultValue: 3, defaultLabel: '3' },
  Pregnancy_RandomMoodDuration: { defaultValue: 1, defaultLabel: '1 Sim hour' },
}

const appearanceRange: SliderBounds = { min: -100, max: 100, step: 1 }
const appearanceTemplateRange: SliderBounds = { ...appearanceRange, allowOutOfRange: true }

// These four strings are explicitly documented as lower/upper appearance
// limits, unlike other comma-delimited values that contain ordered percentages.
const csvRanges: Record<string, SliderBounds> = {
  Appearance_FemaleFitLimits: appearanceRange,
  Appearance_FemaleLeanLimits: appearanceRange,
  Appearance_MaleFitLimits: appearanceRange,
  Appearance_MaleLeanLimits: appearanceRange,
}

// These ordered age percentages are independent chances, not shares of a total.
const csvNumberFields: Record<string, CsvNumberFieldsMeta> = {
  ...Object.fromEntries(['Marriage_AgePercentage', 'Pregnancy_AgePercentage', 'Woohoo_RiskyWoohooPercents'].map(key => [key, {
    labels: ['Teen', 'Young Adult', 'Adult', 'Elder'], min: 0, max: 100, step: 1, unit: '%',
  }])),
  ...Object.fromEntries(['Cat', 'Dog', 'Horse'].map(species => [`Pregnancy_${species}AgePercentage`, {
    labels: ['Adult', 'Elder'], min: 0, max: 100, step: 1, unit: '%',
  }])),
  Occult_RiskyVampPercentages: {
    labels: ['Ask for Permission to Drink', 'Compel for a Small Drink', 'Compel for a Deep Drink', 'Drink Uncontrollable'],
    min: 0, max: 100, step: 1, unit: '%',
  },
  Occult_AgePercentage: {
    labels: ['Teen', 'Young Adult', 'Adult', 'Elder'],
    min: 0,
    max: 100,
    step: 1,
    unit: '%',
  },
  Dresser_FacialHairPercent: {
    labels: ['Teen', 'Young Adult', 'Adult', 'Elder'],
    min: 0,
    max: 100,
    step: 1,
    unit: '%',
  },
}

// The reference describes these eight templates as per-body-part ranges, with
// the normal EA domain of -100..100. The supplied config verifies the exact
// child names and array representation. Keep the whitelist explicit: a new
// template or an unknown two-number array must retain its generic editor.
function bodyRanges(chestDetail: 'ChestLift' | 'ChestExpand'): Record<string, SliderBounds> {
  // Display body regions from top to bottom, with each arm/leg pair together.
  return Object.fromEntries([
    'Neck', 'Shoulders', 'ChestDepth', chestDetail, 'ChestSize',
    'UpperArms', 'LowerArms', 'Belly', 'Waist', 'Hips', 'Butt',
    'UpperLegs', 'LowerLegs', 'Feet',
  ].map((field) => [field, appearanceTemplateRange]))
}
const femaleBodyRanges = bodyRanges('ChestLift')
const maleBodyRanges = bodyRanges('ChestExpand')
const templateRanges: Record<string, Record<string, SliderBounds>> = {
  Appearance_AF_Template: femaleBodyRanges,
  Appearance_AM_Template: maleBodyRanges,
  Appearance_EF_Template: femaleBodyRanges,
  Appearance_EM_Template: maleBodyRanges,
  Appearance_TF_Template: femaleBodyRanges,
  Appearance_TM_Template: maleBodyRanges,
  Appearance_YAF_Template: femaleBodyRanges,
  Appearance_YAM_Template: maleBodyRanges,
}

const impacts: Record<string, NonNullable<SettingMeta['impact']>> = {
  Woohoo_ExtremeWoohoo: {
    level: 'gameplay', title: 'More frequent autonomous WooHoo',
    description: 'This increases how often autonomous WooHoo happens. Autonomous WooHoo or Autonomous Try for Baby must also be enabled. Autonomous Rest Time controls the break between attempts.',
  },
  ...Object.fromEntries(['Marriage_FlagGenderPreferencePercent', 'Pregnancy_FlagGenderPreferencePercent'].map(key => [key, {
    level: 'gameplay' as const, title: 'Can set lasting gender-preference flags',
    description: 'A successful roll can flag a Sim for same-sex or opposite-sex partners in future random checks. Existing flags need to be cleared manually in MCCC.',
  }])),
  Pause_on_Zone: {
    level: 'interrupts', title: 'Pauses after loading a zone',
    description: 'When enabled, loading a new zone pauses the game. Resume play each time you want to continue.',
  },
  Show_MarriageNotificationType: {
    level: 'gameplay', title: 'Controls marriage notification posts',
    description: 'Choose which marriages appear in the notification feed. Broader audiences can produce more posts. This does not ask you to approve marriages; that is controlled by Confirm random marriages.',
  },
  Marriage_ManualConfirmation: {
    level: 'interrupts', title: 'Asks before random marriages',
    description: 'When enabled, MCCC asks you to approve each random marriage. Turning this off removes the approval dialog; marriage notification posts are controlled separately.',
  },
  Pregnancy_ManualConfirmation: {
    level: 'interrupts', title: 'Asks before random pregnancies',
    description: 'When enabled, MCCC asks you to approve its random pregnancies. This does not control Neighborhood Stories or manually started pregnancies.',
  },
  Autosave_ShowConfirmation: {
    level: 'interrupts', title: 'Pauses for an autosave decision',
    description: 'When enabled, a dialog lets you approve or cancel each scheduled autosave. With confirmation off, enabled autosaves proceed at their scheduled intervals.',
  },
  Pregnancy_PauseOnPlayableLabor: {
    level: 'interrupts', title: 'Shows a labor dialog',
    description: 'Notifies you when a Sim in an inactive played household goes into labor so you can switch households for the birth.',
  },
  Marriage_ManualRenameSpouses: {
    level: 'interrupts', title: 'Can open a name selection dialog',
    description: 'All or Played households can open a dialog to choose spouses’ surnames after non-active marriages. None disables these dialogs; active and Ancestral households are excluded.',
  },
  Pregnancy_NameInactiveOffspring: {
    level: 'interrupts', title: 'Can open baby naming dialogs',
    description: 'Expands naming dialogs to selected non-active households. This is separate from the birth notification post.',
  },
  Pregnancy_NameInactiveAdoption: {
    level: 'interrupts', title: 'Can open adoption naming dialogs',
    description: 'Controls naming dialogs for children adopted through random pregnancy-adoption results outside the active household.',
  },
  Maximum_Household_Size: {
    level: 'gameplay', title: 'Large households need special CAS handling',
    description: 'Above eight Sims, the official reference directs players to MCCC’s individual Modify in CAS command for additional Sims. Game and mod updates can also affect oversized households.',
  },
  Game_Time_Speed: {
    level: 'gameplay', title: 'Changes the game’s timing',
    description: 'The mod author warns that changing time speed can cause timing and weather issues. Higher values make a Sim day take longer.',
  },
}

const labels: Record<string, string> = {
  Appearance_FemaleFitLimits: 'Female muscle limits',
  Appearance_FemaleLeanLimits: 'Female body fat limits',
  Appearance_MaleFitLimits: 'Male muscle limits',
  Appearance_MaleLeanLimits: 'Male body fat limits',
  Appearance_AF_Template: 'Adult female body ranges',
  Appearance_AM_Template: 'Adult male body ranges',
  Appearance_EF_Template: 'Elder female body ranges',
  Appearance_EM_Template: 'Elder male body ranges',
  Appearance_TF_Template: 'Teen female body ranges',
  Appearance_TM_Template: 'Teen male body ranges',
  Appearance_YAF_Template: 'Young adult female body ranges',
  Appearance_YAM_Template: 'Young adult male body ranges',
  Marriage_ManualConfirmation: 'Confirm random marriages',
  Pregnancy_ManualConfirmation: 'Confirm random pregnancies',
  Autosave_ShowConfirmation: 'Confirm before autosaving',
  Show_MarriageNotificationType: 'Marriage notification audience',
  Show_PregnancyNotificationType: 'Pregnancy notification audience',
  Show_Notifications: 'Show MCCC notification posts',
  Relationship_MoveinAges: 'Ages allowed to move in together',
  Silence_Phone_Texts: 'Texts allowed when the phone is silenced',
}

// Shorter wording of the bundled reference, which remains available unedited.
// These descriptions retain their official-reference attribution.
const descriptionSummaries: Record<string, string> = {
  Dresser_ChangeOutfitAfterCareerF: 'Choose the outfit category female Sims change into after coming home from work. Keep career outfit leaves their work clothes on.',
  Dresser_ChangeOutfitAfterCareerM: 'Choose the outfit category male Sims change into after coming home from work. Keep career outfit leaves their work clothes on.',
  Dresser_MaximumMultipleOutfits: 'Generate this many outfits in each applicable category when an eligible new homeless Sim or aging-up Sim passes the Multiple Outfit Percentage check. The count is fixed, not randomly chosen. Set to 1 for no additional outfits.',
  Club_ClubMemberCount: 'Set the maximum members per club (default: 8). Buy both extra-slot perks to reach 8 members before increasing the limit. The club dialog only shows add-member slots up to 8; invite additional Sims through interactions.',
  Club_MaximumClubCount: 'Set how many clubs a Sim may join (default: 3). To join more than 3, use invitation interactions or MC Cheats → Cheat Sim Info → Expansion Cheats → Club Cheats; the club dialog cannot add more.',
  Club_OpenMemberSlots: 'When Monitor Club Members is enabled, leave this many slots open for manual invitations (default: 1). Existing members are never removed to make space; the limit applies as slots become available.',
  Cleaner_CleanRelationships: 'Choose whose relationships MC Cleaner can remove. Family relationships are kept. The saved relationship-cleaning level is preserved when you change this choice.',
  Cleaner_CleanPetRelationships: 'Remove pet relationships at the selected level or lower. Custom levels use absolute scores: a level of 25 removes relationships with scores from −25 through 25.',
  Career_ChildrenQuitSchool: 'Add Quit School to Sim Commands for active children. They can return only through Resume School, starting at a low grade. While enabled, school and Scouts both count as jobs, so children cannot do both.',
  Career_TeensQuitSchool: 'Add Quit School to Sim Commands for active teens. They can return only through Resume School, starting at a low grade. While enabled, school counts as a job, so teens cannot attend school and hold another job at the same time.',
  Career_Homework_Speed: 'Adjust child and teen homework, extra credit, and makeup homework progression. The default is 0. Negative values slow progress by 100% per point; positive values speed it up.',
  Career_University_Homework_Speed: 'Adjust university homework and term presentation progression. The default is 0. Negative values slow progress by 100% per point; positive values speed it up.',
  Career_University_Difficulty_Adjustment: 'Adjust how quickly Sims progress at university: 0 is normal, negative values slow progress, and positive values speed it up. The scale is 10% per negative point and 100% per positive point.',
  Appearance_UseParentAppearance: 'At the Teen age-up, choose fitness and fatness values between the parents’ values. Body parts match the parent of the same gender, or take values between both parents when both match. Parent Values Variance adds random variation.',
  Appearance_ParentAppearanceVariance: 'Allow inherited physical values to vary above or below the parents’ values by this percentage. For example, 10% allows variation of up to 10% in either direction. At 0%, no extra variation is added.',
  Appearance_UseParentSkinTones: 'When either parent has a custom skintone, randomly choose one parent’s skintone for the baby instead of blending the two.',
  Appearance_UseParentFacialDetails: 'Pass parents’ facial skin details to their children at the Teen age-up. If both parents have different versions of the same detail, such as freckles, each has a 50% chance of being inherited.',
  CAS_BypassBlueBabies: 'Give babies in human form human skin colors, including hybrid babies. This excludes blue, green, and purple hybrid colors and the blue/green EA CAS tones. When off, use the game’s normal skin-color generation.',
  CAS_Trait_Blacklist: 'Exclude selected traits when Sims are randomly generated or gain traits as they age up. Existing traits remain unchanged. This does not affect Sims generated with testing/debug cheats or imported from your library, and traits required for a Sim’s role are kept.',
  CAS_Pet_Trait_Blacklist: 'Exclude selected traits when pets are randomly generated or gain traits as they age up. Existing traits remain unchanged. This does not affect pets generated with testing/debug cheats, and traits required for a pet’s role are kept. Species labels distinguish traits with the same name.',
  RelationshipCullingType: 'Choose how unused relationships are removed: EA’s normal culling, no culling, or MC Cleaner’s configured rules. MC Cleaner must be installed to use its option. Restart the game after changing this setting.',
  Friendship_Difficulty_Adjustment: 'Adjust how quickly friendships build: 0 is normal, negative values slow progress, and positive values speed it up. The scale is 10% per negative point and 100% per positive point.',
  Romance_Difficulty_Adjustment: 'Adjust how quickly romantic relationships build: 0 is normal, negative values slow progress, and positive values speed it up. The scale is 10% per negative point and 100% per positive point.',
  Relationship_BreakupPercent: 'For unmarried couples, set the chance of applying each automatic relationship change, which may improve or reduce their relationship. A breakup occurs if friendship or romance drops below zero. Set to 0% to disable these breakups.',
  Relationship_BreakupMarriagePercent: 'For married couples, set the chance of applying each automatic relationship change, which may improve or reduce their relationship. A breakup occurs if friendship or romance drops below zero. Set to 0% to disable these breakups.',
  Relationship_BreakupMoveoutSim: 'Choose who moves into a homeless household after a breakup; None keeps both Sims in place. If one Sim lives with their parents, the other Sim moves out. Otherwise, use the selected gender or choose randomly; same-sex couples always use a random choice.',
  Relationship_BreakupMoveoutOffspring: 'Set the chance that children and younger offspring move with the Sim leaving after a breakup. At 0%, they stay in the original household.',
  Relationship_MoveinRomanceAmt: 'Choose the minimum romance level for moving in together: Lovers (25), Sweethearts (50), Soul Mates (75), or True Lovers (100).',
  Relationship_MoveinPercent: 'Set the chance that eligible Sims move in together; 0% disables this. Sims are excluded if they live with a significant other or a qualifying romantic partner, previously broke up or divorced each other, live in a dorm, have children, or are pregnant. Housed Sims will not leave their lot to join a homeless Sim. After moving in, they become significant others so MC Population’s single-Sim move-outs do not split them up.',
  Show_Sim_Menu_Type: 'Choose where MCCC menus appear: on Sims, in the relationship panel, or both. Shift-only options show menus only while Shift is held.',
  Show_Computer_Menu_Type: 'Choose when the MCCC menu appears on computers. If hidden, use the mc_settings console command to change settings.',
  Show_Gnome_Menu_Type: 'Choose when the MCCC menu appears on gnomes. This menu is hidden by default.',
  Show_Cheats_Menu_Type: 'Choose when MC Cheats menus appear on active Sims and lot mailboxes. Mailboxes offer world-affecting cheats; Sim menus offer cheats for that Sim.',
  Logging_LessLENotes: 'When enabled, show only the first Last Exception (LE) notification until you change zones or reload the current lot. Turn off to show every LE notification. Errors from mc_cmd_center.log still appear each time.',
  Show_Notifications: 'Show MCCC notification posts for events such as pregnancies, aging, deaths, and move-ins. Turning this off suppresses event notifications while keeping your individual choices.',
  Show_AutosaveNotifications: 'Notify when an autosave occurs and show the filename used.',
  Show_AgeUpNotificationType: 'Show a notification when a Sim ages up, for the selected audience.',
  Show_DeathNotifications: 'Show notifications when Sims die, including any inheritance, for the selected audience.',
  Show_PetDeathNotificationType: 'Show a notification when a pet dies, for the selected audience.',
  Show_HouseEmptyNotification: 'Notify when the last Sim in a household dies or moves out through in-game processes. Moves made manually in Manage Households do not trigger this notification.',
  Show_MovingNotificationType: 'Show notifications when Sims move into a new household, for the selected audience. Moves into elder retirement homes are excluded.',
  Show_MarriageNotificationType: 'Show a notification when a Sim marries, for the selected audience.',
  Show_BirthNotificationType: 'Show notifications when Sims give birth, for the selected audience.',
  Show_BirthNotificationDetails: 'Include all the babies’ names alongside the birth summary. When off, show only the summary.',
  Show_PregnancyNotificationType: 'Show a notification when a Sim becomes pregnant, for the selected audience.',
  Show_PregnancyAffairNotificationType: 'Show notifications about pregnancies from affairs when either the pregnant Sim or their partner matches the selected audience.',
  Show_NSPopulationType: 'Show notifications when Sims change residence through Neighborhood Stories, for the selected audience.',
  Show_NSPregnancyType: 'Show notifications when Sims become pregnant through Neighborhood Stories, for the selected audience.',
  Show_NSDeathType: 'Show notifications about random deaths caused by Neighborhood Stories, for the selected audience.',
  Show_NSPetAdoption: 'Show a notification whenever a household adopts a pet through Neighborhood Stories.',
  Show_NSAdoptionType: 'Show notifications when Sims are adopted through Neighborhood Stories, for the selected audience.',
  Show_NSCareerType: 'Show notifications when Sims change careers through Neighborhood Stories, for the selected audience.',
}

function readableKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/([a-z\d])([A-Z])/g, '$1 $2')
}

export function getSettingMeta(key: string, value: unknown): SettingMeta {
  const entry = reference.get(key)
  const observation = inGameReference.get(key)
  const path = entry?.MenuPath.split(/\s*(?:>|->)\s*/).filter(Boolean) ?? []
  const navigation = getNavigation(key, entry)
  const pregnancyFields = getOccultPregnancyFields(key, value)
  let kind: SettingMeta['kind']
  let choices: Option[] | undefined

  // Preserve the imported JSON type even if a newer catalogue expects otherwise.
  if (typeof value === 'boolean') kind = 'boolean'
  else if (typeof value === 'number') {
    choices = numericChoices[key]
    kind = choices ? 'select' : 'number'
  }
  else if (typeof value === 'string') {
    const householdChoices = key === 'Cleaner_CleanRelationships' ? cleanerHouseholdOptions(value) : undefined
    if (householdChoices) {
      kind = 'select'
      choices = householdChoices
    } else if (multipleChoices[key]) {
      kind = 'multiselect'
      choices = multipleChoices[key]
    } else if (singleChoices[key]) {
      kind = 'select'
      choices = singleChoices[key]
    } else kind = 'text'
  } else kind = 'json'

  return {
    key,
    label: navigation.label ?? observation?.label ?? labels[key] ?? path.at(-1)?.replace(/\.{3}$/, '') ?? readableKey(key),
    description: settingDescriptions[key] ?? observation?.description ?? descriptionSummaries[key] ?? entry?.Description ?? 'This key is not described in the bundled MCCC reference. Its original value and type are preserved when you export.',
    category: navigation.category,
    menuPath: navigation.menuPath,
    section: observation?.section ?? path.at(-2)?.replace(/\.{3}$/, '') ?? entry?.Module ?? 'Additional settings',
    kind,
    ...(key === 'Cleaner_ItemCleaner' ? {
      readOnlyReason: 'Editing is temporarily disabled because this option raised an exception during in-game testing. Your saved value is preserved.',
    } : {}),
    ...(choices ? { options: choices.map((choice) => ({ ...choice })) } : {}),
    ...(kind === 'multiselect' && (key === 'Marriage_DaysToRun' || key === 'Pregnancy_DaysToRun')
      ? { emptySelectionLabel: 'Using MCCC’s default schedule for the current aging speed.' } : {}),
    ...(kind === 'multiselect' && key === 'Neighborhood_Action_Plan_Bypass'
      ? { emptySelectionLabel: 'No neighborhood action plans are bypassed.' } : {}),
    ...(kind === 'multiselect' && key === 'Bypass_Sim_Menus'
      ? { emptySelectionLabel: 'No specific Sim menus are bypassed.' } : {}),
    ...(kind === 'multiselect' && key === 'Pregnancy_PauseSimsPregnancy'
      ? { emptySelectionLabel: 'No groups are paused by this setting.' } : {}),
    ...(kind === 'number' ? numberBounds[key] : {}),
    ...(kind === 'number' && numberValueLabels[key] ? { valueLabels: { ...numberValueLabels[key] } } : {}),
    ...getOccultSharedMeta(key, value),
    ...(pregnancyFields ? { csvNumbers: pregnancyFields } : {}),
    ...(typeof value === 'string' && csvRanges[key]
      ? { range: { ...csvRanges[key] } }
      : {}),
    ...(typeof value === 'string' && csvNumberFields[key]
      ? { csvNumbers: { ...csvNumberFields[key], labels: [...csvNumberFields[key].labels] } }
      : {}),
    ...(value !== null && typeof value === 'object' && !Array.isArray(value) && templateRanges[key]
      ? {
          rangeFields: Object.fromEntries(
            Object.entries(templateRanges[key]).map(([field, bounds]) => [field, { ...bounds }]),
          ),
        }
      : {}),
    ...(value !== null && typeof value === 'object' && !Array.isArray(value) && observation?.numericFields
      ? {
          numericFields: Object.fromEntries(
            Object.entries(observation.numericFields).map(([field, metadata]) => [field, { ...metadata }]),
          ),
        }
      : {}),
    ...(impacts[key] ? { impact: impacts[key] } : {}),
    ...(key === 'Appearance_ApplyTemplate' ? { defaultValue: '', defaultLabel: 'Manual' } : {}),
    ...(populationDefaults[key] ?? {}),
    ...(pregnancyDefaults[key] ?? {}),
    ...(key === 'Tuner_MaximumArchive' ? { defaultValue: 50, defaultLabel: '50' } : {}),
    ...(observation?.defaultValue !== undefined ? { defaultValue: observation.defaultValue } : {}),
    ...(observation?.defaultLabel !== undefined ? { defaultLabel: observation.defaultLabel } : {}),
    ...(internalSettings.has(key) ? { internal: true } : {}),
    documented: Boolean(entry || observation),
    ...(observation
      ? { documentationSource: 'in-game', sourceNote: observation.sourceNote }
      : entry ? { documentationSource: 'official' } : {}),
  }
}

export const presets: { id: string; name: string; description: string; changes: Record<string, string | number | boolean> }[] = [
  {
    id: 'quiet-play',
    name: 'Fewer confirmation dialogs',
    description: 'Let MCCC’s random marriages and pregnancies proceed without asking for approval. Notification preferences stay as they are.',
    changes: { Marriage_ManualConfirmation: false, Pregnancy_ManualConfirmation: false },
  },
  {
    id: 'quiet-notifications',
    name: 'Quiet notification feed',
    description: 'Hide MCCC’s event notification posts. Confirmation dialogs keep their current settings.',
    changes: { Show_Notifications: false },
  },
  {
    id: 'review-random-events',
    name: 'Review random events',
    description: 'Ask for approval before each random marriage or pregnancy generated by MCCC.',
    changes: { Marriage_ManualConfirmation: true, Pregnancy_ManualConfirmation: true },
  },
]
