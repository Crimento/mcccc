import { lifespanSpecies } from './lifespans'

export type MenuNode = { label: string; children?: MenuNode[] }
export type NavigationCategory = {
  id: string
  label: string
  description: string
  menus?: MenuNode[]
}

export const occultPregnancyPairs: Record<string, [string, string][]> = {
  Aliens: [
    ['Occult_CustomPregnancyAlienHybrid', 'Alien and Hybrid'],
    ['Occult_CustomPregnancyHybridHybrid', 'Hybrid'],
    ['Occult_CustomPregnancyAlienHuman', 'Alien and Human'],
    ['Occult_CustomPregnancyHybridHuman', 'Hybrid and Human'],
  ],
  Fairies: [
    ['Occult_CustomPregnancyFairyHuman', 'Fairy and Human'],
    ['Occult_CustomPregnancyFairyAlien', 'Fairy and Alien'],
    ['Occult_CustomPregnancyFairyVampire', 'Fairy and Vampire'],
    ['Occult_CustomPregnancyFairyMermaid', 'Fairy and Mermaid'],
    ['Occult_CustomPregnancyFairyWitch', 'Fairy and Spellcaster'],
    ['Occult_CustomPregnancyFairyWerewolf', 'Fairy and Werewolf'],
  ],
  Mermaids: [
    ['Occult_CustomPregnancyMermaidHuman', 'Mermaid and Human'],
    ['Occult_CustomPregnancyMermaidAlien', 'Mermaid and Alien'],
    ['Occult_CustomPregnancyMermaidVampire', 'Mermaid and Vampire'],
  ],
  Spellcasters: [
    ['Occult_CustomPregnancyWitchHuman', 'Spellcaster and Human'],
    ['Occult_CustomPregnancyWitchAlien', 'Spellcaster and Alien'],
    ['Occult_CustomPregnancyWitchVampire', 'Spellcaster and Vampire'],
    ['Occult_CustomPregnancyWitchMermaid', 'Spellcaster and Mermaid'],
  ],
  Vampires: [
    ['Occult_CustomPregnancyVampireHuman', 'Vampire and Human'],
    ['Occult_CustomPregnancyVampireAlien', 'Vampire and Alien'],
  ],
  Werewolves: [
    ['Occult_CustomPregnancyWerewolfHuman', 'Werewolf and Human'],
    ['Occult_CustomPregnancyWerewolfAlien', 'Werewolf and Alien'],
    ['Occult_CustomPregnancyWerewolfVampire', 'Werewolf and Vampire'],
    ['Occult_CustomPregnancyWerewolfMermaid', 'Werewolf and Mermaid'],
    ['Occult_CustomPregnancyWerewolfWitch', 'Werewolf and Spellcaster'],
  ],
}

function occultMenus(): MenuNode[] {
  return Object.entries(occultPregnancyPairs).map(([label, pairings]) => ({
    label,
    children: [
      ...(label === 'Aliens' ? [{ label: 'Abduction Pregnancy Settings' }, { label: 'Abduction Settings' }] : []),
      { label: 'Aging Settings' },
      {
        label: 'Other Pregnancy',
        children: [{ label: 'Custom Percentages', children: pairings.map(([, label]) => ({ label })) }],
      },
      ...(label === 'Vampires' ? [{ label: 'Risky Vampirism' }] : []),
    ],
  }))
}

export const categories: NavigationCategory[] = [
  {
    id: 'core', label: 'MCCC Settings', description: 'Aging, auto-save, gameplay, money, relationships, notifications, and menus.',
    menus: [
      {
        label: 'Age',
        children: [{ label: 'Age Span Durations', children: lifespanSpecies.map(species => ({ label: species.label })) }],
      },
      { label: 'Auto-Save' },
      { label: 'Gameplay', children: [{ label: 'Death Settings' }, { label: 'Motive Decay' }, { label: 'Skill Settings' }] },
      { label: 'Money Settings' },
      {
        label: 'Notifications/Console/Menu Settings',
        children: [
          { label: 'Console Command Settings', children: [{ label: 'BuildBuy Settings' }] },
          { label: 'Logging Settings' },
          {
            label: 'Notification Settings',
            children: [
              { label: 'Aging/Death Notifications' },
              { label: 'MC Population Notifications' },
              { label: 'MC Pregnancy Notifications' },
              { label: 'Neighborhood Stories Settings' },
            ],
          },
          { label: 'Show Menu Settings' },
        ],
      },
      {
        label: 'Relationship Settings',
        children: [{
          label: 'Auto-Relationship Settings',
          children: [{ label: 'Breakup Settings' }, { label: 'Move-In Settings' }],
        }],
      },
      { label: 'More MCCC Settings' },
    ],
  },
  {
    id: 'appearance', label: 'Create-a-Sim', description: 'Appearance templates, body limits, and Create-a-Sim preferences.',
    menus: [
      {
        label: 'Define Appearance Template',
        children: ['Female', 'Male'].map(label => ({
          label, children: ['Teen', 'Young Adult', 'Adult', 'Elder'].map(label => ({ label })),
        })),
      },
      { label: 'Exclude Traits' },
      { label: 'Fit/Fat limits', children: [{ label: 'Female' }, { label: 'Male' }] },
      { label: 'Offspring' },
      {
        label: 'Set Default Walkstyle',
        children: ['Female', 'Male'].map(label => ({
          label, children: ['Teen', 'Young Adult', 'Adult', 'Elder'].map(label => ({ label })),
        })),
      },
    ],
  },
  {
    id: 'careers', label: 'Career', description: 'Careers, school, university, and homework.',
    menus: [{ label: 'School' }, { label: 'University' }, { label: 'Neighborhood Stories Settings' }],
  },
  {
    id: 'cleaner', label: 'Cleaner', description: 'Item, Sim, neighborhood, and relationship cleanup.',
    menus: [
      { label: 'Item Cleaner' },
      { label: 'Neighborhood Cleaner' },
      { label: 'Relationship Cleaner' },
      { label: 'Sim Cleaner' },
    ],
  },
  { id: 'clubs', label: 'Clubs', description: 'Club membership, monitoring, and available places.' },
  {
    id: 'dresser', label: 'Dresser', description: 'Outfits, makeup, facial hair, and clothing cleanup.',
    menus: [
      { label: 'Facial Hair Settings' },
      { label: 'Makeup Settings' },
      {
        label: 'Outfits Settings',
        children: [{ label: 'Multiple Outfit Settings' }, { label: 'Replace Situation Outfits' }],
      },
    ],
  },
  {
    id: 'occult', label: 'Occult', description: 'Alien abductions and settings for occult Sims.',
    menus: occultMenus(),
  },
  {
    id: 'population', label: 'Population', description: 'Population, households, and moving settings.',
    menus: [
      { label: 'Moving Settings' },
      {
        label: 'Populating Settings',
        children: [{ label: 'Import Tray Settings' }, { label: 'CAS Custom Gender Settings' }],
      },
      { label: 'Random Lot Challenges' },
      { label: 'Neighborhood Stories Settings' },
      { label: 'Other Settings' },
    ],
  },
  {
    id: 'pregnancy', label: 'Pregnancy', description: 'Pregnancy, offspring, adoption, and random marriages.',
    menus: [
      { label: 'Adoption Settings' },
      { label: 'Marriage Sim Selection' },
      { label: 'Neighborhood Stories Settings' },
      { label: 'Offspring' },
      { label: 'Other Marriage' },
      { label: 'Other Pregnancy' },
      { label: 'Partner Sim Selection' },
      { label: 'Pet Pregnancy Settings', children: [{ label: 'Pregnancy Percentage' }] },
      { label: 'Pregnant Sim Selection' },
      { label: 'Spouse Sim Selection', children: [{ label: 'Marriage Trait Limits' }] },
    ],
  },
  {
    id: 'tuner', label: 'Tuner', description: 'Autonomy and interaction behavior.',
    menus: [
      { label: 'Change Interaction Behavior' },
      { label: 'Change Interaction Autonomy' },
      { label: 'Autonomy Scan' },
    ],
  },
  {
    id: 'woohoo', label: 'WooHoo', description: 'WooHoo, nudity, reactions, and related pregnancy preferences.',
    menus: [
      { label: 'WooHoo Actions' },
      { label: 'WooHoo Pregnancy' },
      { label: 'WooHoo Reactions' },
      { label: 'Sim Nudity', children: [{ label: 'Nudity Interactions' }] },
      { label: 'Other Settings' },
    ],
  },
  { id: 'other', label: 'Other settings', description: 'Imported settings whose module has not been verified.' },
]

type NavigationReference = { MenuPath: string; Module: string }
type Assignment = { category: string; menuPath: string[]; label?: string }
type RegisteredSetting = { key: string; category: string; label?: string; menuPath: string[]; order: number }

const registeredSettings = new Map<string, RegisteredSetting>()

function addSettings(category: string, menuPath: string[], settings: [string, string?][]) {
  settings.forEach(([key, label], order) => registeredSettings.set(key, { key, category, label, menuPath, order }))
}

function addCoreSettings(menuPath: string[], settings: [string, string][]) {
  addSettings('core', menuPath, settings)
}

// This is the user's observed menu structure. Only settings already present in
// the imported config are displayed; this catalogue never inserts missing keys.
for (const species of lifespanSpecies) {
  const singular = species.id[0]!.toUpperCase() + species.id.slice(1)
  addCoreSettings(['Age', 'Age Span Durations', species.label], species.profiles.map(profile => [
    profile.key, `${singular} lifespan — ${profile.label}`,
  ]))
}
addCoreSettings(['Age'], [['AgeStopHuman', 'Stop Human Aging']])
addCoreSettings(['Auto-Save'], [
  ['Autosave_Name', 'Name'],
  ['Autosave_HexSlotNumber', 'Slot Number'],
  ['Autosave_MaxSaveNumber', 'Maximum Save Slot Number'],
  ['Autosave_IntervalAmount', 'Save Interval Amount'],
  ['Autosave_IntervalType', 'Save Interval Type'],
  ['Autosave_ShowConfirmation', 'Show Confirmation Dialog'],
  ['Autosave_Enabled', 'Use Auto-Save'],
])
addCoreSettings(['Gameplay'], [
  ['Adopt_Neglected_Child', 'Adopt Neglected Child'],
  ['Adopt_No_Caregiver', 'Adopt No Caregiver'],
  ['LifeSkill_Difficulty_Adjustment', 'Character Values Difficulty Adjustment'],
  ['Prestige_Difficulty_Adjustment', 'Dynasty Prestige Difficulty Adjustment'],
  ['Fame_Difficulty_Adjustment', 'Fame Difficulty Adjustment'],
  ['Game_Time_Speed', 'Game Time Speed'],
  ['Maximum_Household_Size', 'Maximum Household Size'],
  ['Maximum_Rename_Length', 'Maximum Rename Length'],
  ['Neighborhood_Action_Plan_Bypass', 'Neighborhood Action Plans Bypass'],
  ['Pause_on_Zone', 'Pause on zone'],
  ['Teleport_Sims_Overlap', 'Teleport Sim Overlap'],
  ['Use_Random_Aging', 'Use Random Aging'],
])
addCoreSettings(['Gameplay', 'Death Settings'], [
  ['Allow_NS_Deaths', 'Allow NS Random Deaths'],
  ['Sims_Are_Immortal', 'Sims Are Immortal'],
  ['Sim_Death_Only_On_Lot', 'Sims Die On Lot'],
])
addCoreSettings(['Gameplay', 'Motive Decay'], [
  ['MotiveDecay_Sims', 'Sim Motive Decay Percent'],
  ['Pregnancy_BabyMotiveDecay', 'Baby Motive Decay Percent'],
  ['MotiveDecay_Vampires', 'Vampire Motive Decay Percent'],
  ['MotiveDecay_Cats', 'Cat Motive Decay Percent'],
  ['MotiveDecay_Dogs', 'Dog Motive Decay Percent'],
  ['MotiveDecay_Horses', 'Horse Motive Decay Percent'],
  ['Decay_Ratio_Fame', 'Fame Decay Percent'],
  ['Decay_Ratio_Prestige', 'Dynasty Prestige Decay Percent'],
])
addCoreSettings(['Gameplay', 'Skill Settings'], [
  ['Skill_Cheats_Bypass', 'Bypass Skill List'],
  ['Skill_Difficulty_Adjustment', 'Skill Difficulty Adjustment'],
  ['Skill_Difficulty_Blacklist', 'Skill Difficulty Exclude List'],
  ['Skill_Difficulty_Whitelist', 'Skill Difficulty Include List'],
  ['Skill_Freeze_List', 'Skill Freeze Progression List'],
])
addCoreSettings(['Money Settings'], [
  ['Tuner_Child_Pay_Bills', 'Allow Child Pay Bills'],
  ['Bill_AmountPercentApartment', 'Apartment Bill Percent'],
  ['Bill_AutoPay', 'Auto-pay Bills'],
  ['Bill_Amount_Percent', 'Change Bills Percent'],
  ['Pay_Child_Support_Percent', 'Child Support Percent'],
  ['Inherit_Sim_Type', 'Inheritance Sim Type'],
  ['Inherit_Spouse_First', 'Inheritance Spouse First'],
  ['Pay_Child_Support_Type', 'Pay Child Support'],
])
const consoleMenuPath = ['Notifications/Console/Menu Settings', 'Console Command Settings']
const notificationMenuPath = ['Notifications/Console/Menu Settings', 'Notification Settings']
addCoreSettings(['Notifications/Console/Menu Settings'], [
  // Save Current Order and Reset to Default Order are in-game actions for this
  // one saved object, not additional configuration fields.
  ['Menu_Order', 'Change Sim Menu Order'],
  ['Silence_Phone_Texts', 'Phone Texts'],
])
addCoreSettings(consoleMenuPath, [
  ['Debug_Cheats_Enabled', 'Debug Commands in Cheats'],
  ['Full_Edit_CAS', 'Enable Full Edit CAS'],
  ['Headline_Effects_Enabled', 'Headline Effects'],
  ['Hover_Effects_Enabled', 'Hover Effects'],
  ['Testing_Cheats_Enabled', 'Testing Cheats'],
])
addCoreSettings([...consoleMenuPath, 'BuildBuy Settings'], [
  ['BB_Debug_Objects_Enabled', 'BuyDebug Enabled'],
  ['BB_Free_Build_Enabled', 'Free Build Enabled'],
  ['BB_Ignore_Unlocks_Enabled', 'Ignore Unlocks Enabled'],
  ['BB_Move_Objects_Enabled', 'Move Objects Enabled'],
  ['BB_Show_Live_Objects', 'ShowLive Enabled'],
])
addCoreSettings(['Notifications/Console/Menu Settings', 'Logging Settings'], [
  ['Logging_Enabled', 'Message Logging'],
  ['Logging_Append', 'Append to Logfile'],
  ['Logging_LessLENotes', 'Less LE Notifications'],
])
addCoreSettings(notificationMenuPath, [
  ['Show_Notifications', 'Show Notifications'],
  ['Show_VersionCheckNotification', 'Show Version Update Notifications'],
  ['Show_AutosaveNotifications', 'Show Autosave Notifications'],
  ['Show_ClubMonitorNotifications', 'Show Club Monitor Notifications'],
])
addCoreSettings([...notificationMenuPath, 'Aging/Death Notifications'], [
  ['Show_AgeUpNotificationType', 'Show Age-Up Notifications'],
  ['Show_NPCBirthdayNotifications', 'Show NPC Birthday Notifications'],
  ['Show_DeathNotificationType', 'Show Death Notifications'],
  // Recognize the reference's legacy key only when an imported file has it.
  ['Show_DeathNotifications', 'Show Death Notifications'],
  ['Show_PetDeathNotificationType', 'Show Pet Death Notifications'],
])
addCoreSettings([...notificationMenuPath, 'MC Population Notifications'], [
  ['Show_HouseEmptyNotification', 'Show Empty House Notifications'],
  ['Show_MovingNotificationType', 'Show Moving Notifications'],
])
addCoreSettings([...notificationMenuPath, 'MC Pregnancy Notifications'], [
  ['Show_MarriageNotificationType', 'Show Marriage Notifications'],
  ['Show_BirthNotificationType', 'Show Birth Notifications'],
  ['Show_BirthNotificationDetails', 'Show Birth Notification Details'],
  ['Show_PregnancyNotificationType', 'Show Pregnancy Notifications'],
  ['Show_PregnancyAffairNotificationType', 'Show Pregnancy Affair Notifications'],
  ['Show_RelChangeNotificationType', 'Show Relationship Changes'],
])
addCoreSettings([...notificationMenuPath, 'Neighborhood Stories Settings'], [
  ['Show_NSPopulationType', 'Show Population Types'],
  ['Show_NSPregnancyType', 'Show Pregnancy Types'],
  ['Show_NSDeathType', 'Show Death Types'],
  ['Show_NSPetAdoption', 'Show Pet Adoptions'],
  ['Show_NSAdoptionType', 'Show Adoption Types'],
  ['Show_NSCareerType', 'Show Career Types'],
])
addCoreSettings(['Notifications/Console/Menu Settings', 'Show Menu Settings'], [
  ['Bypass_Sim_Menus', 'Bypass Specific Menus'],
  ['Show_Sim_Menu_Type', 'Show Sim Menu'],
  ['Show_Computer_Menu_Type', 'Show Computer Menu'],
  ['Show_Gnome_Menu_Type', 'Show Gnome Menu Type'],
  ['Show_Cheats_Menu_Type', 'Show Cheats Menu'],
])
addCoreSettings(['Relationship Settings'], [
  ['RelationshipCullingType', 'Relationship Culling'],
  ['Allow_Teen_Parenting', 'Allow Teen Parenting'],
  ['Friendship_Difficulty_Adjustment', 'Friendship Difficulty Adjustment'],
  ['Decay_Ratio_Friendship', 'Friendship Decay Percentage'],
  ['Romance_Difficulty_Adjustment', 'Romance Difficulty Adjustment'],
  ['Decay_Ratio_Romantic', 'Romantic Decay Percentage'],
])
const autoRelationshipMenuPath = ['Relationship Settings', 'Auto-Relationship Settings']
addCoreSettings(autoRelationshipMenuPath, [
  ['Relationship_BypassPlayedHouseholds', 'Bypass Played Households'],
  ['Relationship_BypassAncestral', 'Bypass Ancestral Households'],
])
addCoreSettings([...autoRelationshipMenuPath, 'Breakup Settings'], [
  ['Relationship_BreakupPercent', 'Couple Relationship Change Percent'],
  ['Relationship_BreakupMarriagePercent', 'Spouse Relationship Change Percent'],
  ['Relationship_BreakupMoveoutSim', 'Breakup Move-Out Sims'],
  ['Relationship_BreakupMoveoutOffspring', 'Move Children With Breakup'],
])
addCoreSettings([...autoRelationshipMenuPath, 'Move-In Settings'], [
  ['Relationship_MoveinAges', 'Move-In Ages'],
  ['Relationship_MoveinPercent', 'Romance Move-In Percent'],
  ['Relationship_MoveinRomanceAmt', 'Move-In Romance Level'],
  ['Relationship_MoveinHomeless', 'Allow Homeless Romance Move-In'],
])

addSettings('appearance', [], [
  ['Appearance_ApplyTemplate', 'Apply Appearance Template'],
  ['CAS_AutoCelebrityWalkstyle', 'Auto-Set Celebrity Walkstyle'],
  ['Appearance_AgeupChangeWalkstyle', 'Change Walkstyles on Age-up'],
  ['Appearance_MonitorPhysique', 'Monitor Physique'],
])

// Only the eight existing age/gender pairs are registered, in chronological order.
for (const [gender, genderCode] of [['Female', 'F'], ['Male', 'M']]) {
  for (const [age, ageCode] of [['Teen', 'T'], ['Young Adult', 'YA'], ['Adult', 'A'], ['Elder', 'E']]) {
    addSettings('appearance', ['Define Appearance Template', gender!, age!], [
      [`Appearance_${ageCode}${genderCode}_Template`],
    ])
    addSettings('appearance', ['Set Default Walkstyle', gender!, age!], [
      [`Appearance_DefaultWalkstyle_${ageCode}${genderCode}`],
    ])
  }
}
addSettings('appearance', ['Exclude Traits'], [
  ['CAS_Trait_Blacklist', 'Personality Traits'],
  ['CAS_Pet_Trait_Blacklist', 'Exclude Pet Traits'],
])
addSettings('appearance', ['Fit/Fat limits', 'Female'], [
  ['Appearance_FemaleFitLimits', 'Fit limits'],
  ['Appearance_FemaleLeanLimits', 'Fat limits'],
])
addSettings('appearance', ['Fit/Fat limits', 'Male'], [
  ['Appearance_MaleFitLimits', 'Fit limits'],
  ['Appearance_MaleLeanLimits', 'Fat limits'],
])
addSettings('appearance', ['Offspring'], [
  ['Appearance_UseParentAppearance', 'Use Parent Physical Attributes'],
  ['Appearance_ParentAppearanceVariance', 'Parent Values Variance Percent'],
  ['Appearance_UseParentSkinTones', 'Use Parent Skintones'],
  ['Appearance_UseParentFacialDetails', 'Use Parent Skin Details'],
  ['CAS_BypassBlueBabies', 'Bypass Blue Babies'],
])

addSettings('careers', [], [
  ['Career_FillCareerInactiveOnly', 'Bypass Played Household'],
  ['Career_Difficulty_Adjustment', 'Career Difficulty Adjustment'],
])
addSettings('careers', ['School'], [
  ['Career_Homework_Speed', 'School Homework Progression'],
  ['Career_ChildrenQuitSchool', 'Children Quit School'],
  ['Career_TeensQuitSchool', 'Teens Quit School'],
])
addSettings('careers', ['University'], [
  ['Career_University_Difficulty_Adjustment', 'University Difficulty Adjustment'],
  ['Career_University_Homework_Speed', 'University Homework Progression'],
  ['Career_Decay_Ratio_SecretSociety', 'Secret Society Decay Percent'],
])
addSettings('careers', ['Neighborhood Stories Settings'], [
  ['Career_LimitNS', 'Alter Neighborhood Stories'],
])

addSettings('cleaner', [], [
  ['Cleaner_CleanupMultiRelations', 'Clean-up Multi-Relations'],
  ['Cleaner_DetailLogging', 'Detail Logging'],
])
addSettings('cleaner', ['Item Cleaner'], [
  ['Cleaner_ItemCleaner', 'Cleaner Definitions'],
  ['Cleaner_MatchGlasses', 'Sync Glasses'],
  ['Cleaner_MatchMedicalDevices', 'Sync Medical Devices'],
])
addSettings('cleaner', ['Neighborhood Cleaner'], [
  ['Cleaner_BypassFamilyGhosts', 'Bypass Family Ghosts'],
  ['Cleaner_CleanCulled', 'Clean Culled Sims'],
  ['Cleaner_SyncHouseholdNames', 'Sync Household Names'],
])
addSettings('cleaner', ['Relationship Cleaner'], [
  // The reviewed control edits households while retaining the saved cleaning level.
  ['Cleaner_CleanRelationships', 'Households to Clean'],
  ['Cleaner_CleanPetRelationships', 'Pet Relationships to Clean'],
  ['Cleaner_LeaveRelationshipCount', 'Relationships to Leave'],
])
addSettings('cleaner', ['Sim Cleaner'], [
  ['Cleaner_SyncMarriedNames', 'Sync Married Names'],
])

addSettings('clubs', [], [
  ['Club_BypassPlayedHouseholds', 'Bypass Played Households'],
  ['Club_ClubMemberCount', 'Club Member Count'],
  ['Club_MaximumClubCount', 'Maximum Joinable Clubs'],
  ['Club_MonitorMembers', 'Monitor Club Members'],
  ['Club_OpenMemberSlots', 'Open Members'],
])

addSettings('dresser', [], [
  ['Dresser_RunOnAgeUp', 'Ages to Run on Age-up'],
  ['Dresser_CleanBathingOutfit', 'Automatically Clean Bathing Outfits'],
  ['Dresser_CustomItemsOnly', 'Custom Items Only'],
  ['Dresser_PercentUseCustomSkinTone', 'Percent Use Custom Skin Tone'],
])
addSettings('dresser', ['Facial Hair Settings'], [
  ['Dresser_FacialHairAges', 'Facial Hair Ages'],
  // One positional CSV setting supplies the four age-specific percentages.
  ['Dresser_FacialHairPercent', 'Facial Hair Percents'],
])
addSettings('dresser', ['Makeup Settings'], [
  ['Dresser_IncludeDarkFormMakeup', 'Check Dark Form Makeup'],
  ['Dresser_CopyPasteFacepaint', 'Copy/Paste Facepaint'],
  ['Dresser_MakeupAges', 'Makeup Ages'],
  ['Dresser_MakeupGenders', 'Makeup Genders'],
  ['Dresser_MakeupOutfits', 'Makeup Outfits'],
  ['Dresser_MakeupIncludesFacePaint', 'Remove Makeup/Facepaint'],
  ['Dresser_RunMakeupCheck', 'Run Makeup Check'],
])
addSettings('dresser', ['Outfits Settings'], [
  ['Dresser_IncludeDarkFormOutfits', 'Clean Dark Form Outfits'],
  ['Dresser_ChangeOutfitAfterCareerF', 'Female After Career Outfit'],
  ['Dresser_ChangeOutfitAfterCareerM', 'Male After Career Outfit'],
  ['Dresser_OnlyUseSavedOutfits', 'Only Use Saved Outfits'],
  ['Dresser_SituationUseStandardOutfits', 'Situation Use Standard'],
])
addSettings('dresser', ['Outfits Settings', 'Multiple Outfit Settings'], [
  ['Dresser_PercentMultipleOutfits', 'Multiple Outfit Percentage'],
  ['Dresser_MaximumMultipleOutfits', 'Maximum Outfits'],
  ['Dresser_MultipleOutfitGenders', 'Multiple Outfit Genders'],
  ['Dresser_MultipleOutfitAges', 'Multiple Outfit Ages'],
])
addSettings('dresser', ['Outfits Settings', 'Replace Situation Outfits'], [
  // All reviewed situation:outfit pairs remain inside this one config string.
  ['Dresser_ReplaceSituationOutfits', 'Replace Situation Outfits'],
])

// These three storage keys are shared across all six species. Their species
// views use [species, 'Aging Settings'] and [species, 'Other Pregnancy']; never
// assign the underlying objects or boolean exclusively to a single species.
addSettings('occult', [], [
  ['Occult_OccultTypeAgeMultiplier', 'Age Multiplier'],
  ['Occult_OccultTypeMaximumAge', 'Aging Maximum'],
  ['Occult_UseCustomPregnancy', 'Use Custom Pregnancy'],
])
addSettings('occult', ['Aliens'], [
  ['Occult_ForceAlienDisguiseType', 'Force Alien Disguise'],
  ['Occult_MaximumAliens', 'Maximum Aliens'],
])
addSettings('occult', ['Aliens', 'Abduction Pregnancy Settings'], [
  ['Occult_AgePercentage', 'Abduction Pregnancy Percent'],
  ['Occult_AbductionPregnancyAges', 'Abduction Pregnancy Ages'],
  ['Occult_AbductionPregnancyGenders', 'Abduction Pregnancy Genders'],
  ['Occult_AlienPollinatorGenders', 'Pollinator Gender'],
  ['Occult_IgnoreCasOnAbduction', 'Ignore CAS Preferences'],
])
addSettings('occult', ['Aliens', 'Abduction Settings'], [
  ['Occult_AbductionAges', 'Abduction Ages'],
  ['Occult_AlienFrequency', 'Abduction Frequency'],
  ['Occult_AbductionStartHour', 'Abduction Start Time'],
  ['Occult_AbductionDuration', 'Abduction Time Length'],
  ['Occult_AbductionAllowNPC', 'Allow NPC Abduction'],
  ['Occult_TimeBetweenAbductions', 'Hours Between Abductions'],
])
addSettings('occult', ['Fairies'], [['Occult_MaximumFairies', 'Maximum Fairies']])
addSettings('occult', ['Mermaids'], [
  ['Occult_ForceMermaidForm', 'Force Mermaid Form'],
  ['Occult_MaximumMermaids', 'Maximum Mermaids'],
])
addSettings('occult', ['Spellcasters'], [['Occult_MaximumSpellcasters', 'Maximum Spellcasters']])
addSettings('occult', ['Vampires'], [
  ['Occult_VampireExpAdjustment', 'Experience Adjustment'],
  ['Occult_ForceDarkform', 'Force Darkform'],
  ['Occult_VampireSkillOnAgeUp', 'Level on Age-up'],
  ['Occult_MaximumVampires', 'Maximum Vampires'],
])
addSettings('occult', ['Vampires', 'Risky Vampirism'], [
  ['Occult_RiskyVampNeedCreation', 'Only with Creation'],
  ['Occult_RiskyVampPercentages', 'Feeding Percentages'],
  ['Occult_RiskyVampNotification', 'Vampire Creation Notification'],
])
addSettings('occult', ['Werewolves'], [['Occult_MaximumWerewolves', 'Maximum Werewolves']])
for (const [species, pairings] of Object.entries(occultPregnancyPairs)) {
  for (const [key, label] of pairings) {
    addSettings('occult', [species, 'Other Pregnancy', 'Custom Percentages', label], [[key, label]])
  }
}

addSettings('population', [], [
  ['Population_BarNights', 'Enable or Disable Bar Nights'],
])
addSettings('population', ['Moving Settings'], [
  ['Population_AllowHomelessMoveIn', 'Allow Homeless Move-In'],
  ['Population_BypassAncestralMoveouts', 'Bypass Ancestral Households'],
  ['Population_BypassBusinessOwnerMoveouts', 'Bypass Business Owners'],
  ['Population_MovingBypassDorms', 'Bypass Dorm Residents'],
  ['Population_BypassPlayedHouseholds', 'Bypass Played Households'],
  ['Population_EnforceVampireHomes', 'Enforce Vampire Homes'],
  ['Population_HomelessApartmentPercent', 'Homeless Apartment Percent'],
  ['Population_MaximumHomeless', 'Maximum Homeless'],
  ['Population_MaximumHouseholdPets', 'Maximum Household Pets'],
  ['Population_MoveOutEldersType', 'Move Out Elders'],
  ['Population_MoveTeenDependent', 'Move Teens as Dependents'],
  ['Population_MoveOutSingleSim', 'Move Single Sims'],
  ['Population_OpenHouses', 'Open Houses'],
])
addSettings('population', ['Populating Settings'], [
  ['Population_PercentBaby', 'Percent Baby'],
  ['Population_PercentInfant', 'Percent Infant'],
  ['Population_PercentToddler', 'Percent Toddler'],
  ['Population_PercentChild', 'Percent Child'],
  ['Population_PercentAdult', 'Percent Adult'],
  ['Population_PercentElder', 'Percent Elder'],
  ['Population_PercentMale', 'Percent Male'],
  ['Population_ButlerAges', 'Butler Age'],
  ['Population_RunDresser', 'Run Dresser'],
])
addSettings('population', ['Populating Settings', 'Import Tray Settings'], [
  ['Population_RandomUseTraySimPercent', 'Import Tray Sim Percent'],
  ['Population_RandomLimitHouseholdType', 'Import Tray Sim Type'],
  ['Population_UseTagsOnImportSims', 'Limit Import By Tags'],
  ['Population_RandomUseTrayGenderSet', 'Include Gender Options'],
  ['Population_RandomUseTrayOutfits', 'Include Clothing'],
  ['Population_ImportSimNameChoice', 'Import Sim Name'],
  ['Population_ImportBypassAppearance', 'Import Bypass Appearance'],
])
addSettings('population', ['Populating Settings', 'CAS Custom Gender Settings'], [
  ['Population_MatchCasToFrame', 'Match CAS Settings To Frame'],
  ['Population_PercentFemaleFrame', 'Percent Female Physical Frame'],
  ['Population_PercentMaleFrame', 'Percent Male Physical Frame'],
])
addSettings('population', ['Random Lot Challenges'], [
  ['Population_RandomChallengeLotType', 'Apply to Lot Type'],
  ['Population_RandomChallengeTimeUnits', 'Challenge Unit Type'],
  ['Population_RandomChallengeMaxTime', 'Maximum Challenge Frequency'],
  ['Population_RandomChallengeMaxNum', 'Maximum Challenge Number'],
])
addSettings('population', ['Neighborhood Stories Settings'], [
  ['Population_LimitNS', 'Alter Neighborhood Stories'],
])
addSettings('population', ['Other Settings'], [
  // Pack-specific lot options and immortal-Sim options each belong to one
  // imported setting, not separate configuration keys or sidebar branches.
  ['Population_NumAdjustLot', 'Adjust Sims on Lot'],
  ['Population_AllowNoClowns', 'Bypass Clown Walkby'],
  ['Population_BypassCulling', 'Bypass Sim Culling'],
  ['Population_DisableImmortalSims', 'Disable Immortal Sims'],
  ['Population_MaxSimsInZone', 'Maximum Sims In Zone'],
  ['Population_ReaperStopStalking', 'No Reaper Stalking'],
  ['Population_RandomizeVisitingSims', 'Randomize Visiting Sims'],
])

addSettings('pregnancy', ['Adoption Settings'], [
  ['Pregnancy_AdoptionAges', 'Adoption Ages'],
  ['Pregnancy_AdoptionPercentMale', 'Adoption Percent Male'],
  ['Pregnancy_OppositeSexAdoptionPercent', 'Opposite Sex Adoption Percent'],
  ['Pregnancy_NameInactiveAdoption', 'Rename Non-Active Adoptions'],
  ['Pregnancy_SameSexAdoptionPercent', 'Same Sex Adoption Percent'],
])
addSettings('pregnancy', ['Marriage Sim Selection'], [
  ['Marriage_AllowHomeless', 'Allow Homeless Marriage'],
  ['Marriage_BypassDorms', 'Bypass Dorm Residents'],
  ['Marriage_BypassPlayedHouseholds', 'Bypass Played Households'],
  ['Marriage_BypassRenters', 'Bypass Renters'],
  ['Marriage_BypassRobots', 'Bypass Robots'],
  ['Marriage_BypassActiveRomanticInterest', 'Bypass Active Sim Romances'],
  ['Marriage_DaysToRun', 'Days to Run Checks'],
  ['Marriage_FlagGenderPreferencePercent', 'Flag Gender Preference Percent'],
  ['Marriage_AgePercentage', 'Marriage Percentage'],
  ['Marriage_UseGenderPreference', 'Use Gender Preference'],
  ['Marriage_TargetSimAges', 'Valid Marriage Ages'],
])
addSettings('pregnancy', ['Neighborhood Stories Settings'], [
  ['Pregnancy_LimitNS', 'Alter Neighborhood Stories'],
  ['Pregnancy_NSAdoptChildLimit', 'Child Adoption Limit'],
  ['Pregnancy_OnlyNSPregnancy', 'Only Use Neighborhood Stories'],
  ['Pregnancy_NSAdoptPetLimit', 'Pet Adoption Limit'],
])
addSettings('pregnancy', ['Offspring'], [
  ['Pregnancy_IdenticalOffspringChance', 'Identical Offspring Chance'],
  ['Pregnancy_OffspringTraitsType', 'Inherit Trait Type'],
  ['Pregnancy_MaxHouseholdChildren', 'Maximum Household Children'],
  ['Pregnancy_OffspringTraitsMax', 'Maximum Inherit Traits'],
  ['Pregnancy_MaxOffspring', 'Maximum Offspring'],
  ['Pregnancy_OffspringGenderPercents', 'Offspring Gender Percents'],
  ['Pregnancy_OffspringGender', 'Offspring Gender'],
  ['Pregnancy_PercentWeights', 'Offspring Percents'],
  ['Pregnancy_NameInactiveOffspring', 'Rename Non-Active Offspring'],
  ['Pregnancy_SyncChildSurname', 'Sync Child Surname'],
])
addSettings('pregnancy', ['Other Marriage'], [
  ['Marriage_ManualConfirmation', 'Manual Confirmation'],
  ['Marriage_ManualRenameSpouses', 'Manually Rename Spouses'],
  ['Marriage_MoveFamilies', 'Move Families'],
  ['Marriage_RemoveServiceRoleLimit', 'Remove Service Limit'],
  ['Marriage_RenameOppositeSex', 'Rename Opposite Sex'],
  ['Marriage_RenameSameGender', 'Rename Same Gender'],
  ['Marriage_RequireCASPregnancy', 'Require CAS Pregnancy Match'],
  ['Marriage_SameNeighborhood', 'Same Neighborhood'],
  ['Marriage_UseFrameForGender', 'Use Physical Frame for Gender'],
  ['Marriage_UseTraitsForMarriage', 'Use Traits for Marriage'],
])
addSettings('pregnancy', ['Other Pregnancy'], [
  ['Pregnancy_AgeWhenPregnant', 'Allow Pregnancy Aging'],
  ['Pregnancy_AutoMarryPercent', 'Auto-Marry Percentage'],
  ['Pregnancy_BypassBusinessOwnerMoveouts', 'Bypass Business Owners'],
  ['Pregnancy_ManualConfirmation', 'Manual Confirmation'],
  ['Pregnancy_PauseSimsPregnancy', 'Pause Sims Pregnancy'],
  ['Pregnancy_PauseOnPlayableLabor', 'Pause on Playable Labor'],
  ['Pregnancy_Duration', 'Pregnancy Duration'],
  ['Pregnancy_RandomMoodDuration', 'Random Mood Duration'],
  ['Pregnancy_UseFrameForGender', 'Use Physical Frame for Gender'],
  ['Pregnancy_UseRandomMoods', 'Use Random Moods'],
  ['Pregnancy_UseTraitsForPregnancy', 'Use Traits for Pregnancy'],
])
addSettings('pregnancy', ['Partner Sim Selection'], [
  ['Pregnancy_AllowAffairsPercent', 'Allow Affairs Percentage'],
  ['Pregnancy_EnforceFamily', 'Enforce Family'],
  ['Pregnancy_RelationshipOnly', 'Limit By Relationship'],
  ['Pregnancy_OccupancyType', 'Occupancy Preference'],
  ['Pregnancy_InsiminateGenders', 'Partner Gender'],
  ['Pregnancy_SameOccultOnly', 'Same Occult Only'],
  ['Pregnancy_SameSexPercentage', 'Same-Sex Percentage'],
  ['Pregnancy_UseAttractionValues', 'Use Attraction Values'],
  ['Pregnancy_UseSameAgeGroup', 'Use Same Age-Group'],
  ['Pregnancy_SeedSimAges', 'Valid Partner Ages'],
])
addSettings('pregnancy', ['Pet Pregnancy Settings'], [
  ['Pregnancy_PetAgeToRun', 'Ages to Run Pregnancy'],
  ['Pregnancy_PetAllowHomeless', 'Allow Homeless Pregnancy'],
  ['Pregnancy_PetMaxHouseholdChildren', 'Maximum Household Children'],
  ['Pregnancy_PetMaxOffspring', 'Maximum Offspring'],
  ['Pregnancy_PetPartnerAge', 'Partner Age'],
  ['Show_PetPregnancyNotificationType', 'Show Pregnancy Notifications'],
])
// Each pet percentage and trait list keeps its existing configuration key;
// their constituent ages, traits, and weights are edited within that setting.
addSettings('pregnancy', ['Pet Pregnancy Settings', 'Pregnancy Percentage'], [
  ['Pregnancy_CatAgePercentage', 'Cats'],
  ['Pregnancy_DogAgePercentage', 'Dogs'],
  ['Pregnancy_HorseAgePercentage', 'Horses'],
])
addSettings('pregnancy', ['Pregnant Sim Selection'], [
  ['Pregnancy_AllowHomeless', 'Allow Homeless Pregnancy'],
  ['Pregnancy_BypassDorms', 'Bypass Dorm Residents'],
  ['Pregnancy_BypassPlayedHouseholds', 'Bypass Played Households'],
  ['Pregnancy_BypassRenters', 'Bypass Renters'],
  ['Pregnancy_BypassRobots', 'Bypass Robots'],
  ['Pregnancy_BypassActiveRomanticInterest', 'Bypass Active Sim Romances'],
  ['Pregnancy_AgeUpDaysLimit', 'Days Until Max Age'],
  ['Pregnancy_DaysToRun', 'Days to Run Checks'],
  ['Pregnancy_FlagGenderPreferencePercent', 'Flag Gender Preference Percent'],
  ['Pregnancy_AllowMalePregnancy', 'Male Pregnancy'],
  ['Pregnancy_AgePercentage', 'Pregnancy Percentage'],
  ['Pregnancy_UseGenderPreference', 'Use Gender Preference'],
  ['Pregnancy_TargetSimAges', 'Valid Target Ages'],
])
addSettings('pregnancy', ['Spouse Sim Selection'], [
  ['Marriage_OccupancyType', 'Occupancy Preference'],
  ['Marriage_SameOccultOnly', 'Same Occult Only'],
  ['Marriage_SameSexPercentage', 'Same-Sex Percentage'],
  ['Marriage_SpouseGenders', 'Spouse Gender'],
  ['Marriage_UseAttractionValues', 'Use Attraction Values'],
  ['Marriage_UseSameAgeGroup', 'Use Same Age-Group'],
  ['Marriage_SpouseSimAges', 'Valid Spouse Ages'],
])
addSettings('pregnancy', ['Spouse Sim Selection', 'Marriage Trait Limits'], [
  ['Marriage_RequiredTraitsList', 'Required Traits'],
  ['Marriage_ConflictTraitsList', 'Conflicting Traits'],
])

addSettings('tuner', ['Change Interaction Behavior'], [
  ['Tuner_Child_Baby_Care', 'Allow Child Baby Care'],
  ['Tuner_AllowMoodDeath', 'Allow Emotional Deaths'],
  ['Tuner_InstantUpgrade', 'Allow Instant Upgrades'],
  ['Tuner_AllowMonsterUnderBed', 'Allow Monster Under Bed'],
  ['Tuner_AllowMultipleBFFs', 'Allow Multiple BFFs'],
  ['Tuner_AllowTeenAskMoveIn', 'Allow Teen Move-in'],
  ['Tuner_DisableWitnessDeath', 'Disable Witness Death'],
  ['Tuner_FriendlyAskSingle', 'Friendly Ask If Single'],
  ['Tuner_FriendlyStayNight', 'Friendly Stay The Night'],
  ['Tuner_KissesAlwaysAvailable', 'Kisses Always Available'],
  ['Put_Away_Books_Fix', 'Put Away Books Fix'],
  ['Tuner_StopRandomFlirting', 'Stop Random Flirting'],
])
addSettings('tuner', ['Change Interaction Autonomy'], [
  ['Tuner_AutoMischief', 'Autonomous Mischief'],
  ['Tuner_AutoMean', 'Autonomous Mean'],
  ['Tuner_AutoProposal', 'Autonomous Proposals'],
  ['Tuner_AutoMarriage', 'Autonomous Marriage'],
  ['Tuner_AutoFlirty', 'Autonomous Flirty'],
  ['Tuner_AutoRepair', 'Autonomous Repairs'],
  ['Tuner_AutoClean', 'Autonomous Cleaning'],
  ['Tuner_AutoGarden', 'Autonomous Gardening'],
])
addSettings('tuner', ['Autonomy Scan'], [
  ['Tuner_ArchiveInteractions', 'Archive Autonomous Actions'],
  ['Tuner_MaximumArchive', 'Maximum Autonomy Archive'],
])

// The supplied outline and reference describe this optional module; registering
// its existing keys does not insert settings when the module is absent.
addSettings('woohoo', ['WooHoo Actions'], [
  ['Woohoo_AllowFamily', 'Allow Family'],
  ['Woohoo_FriendlierWoohooPartner', 'Allow Friendlier WooHoo Partners'],
  ['Woohoo_AllowGhostTFB', 'Allow Ghost Try for Baby'],
  ['Woohoo_AllowTeens', 'Allow Teens'],
  ['Woohoo_AllowTFB', 'Allow Try for Baby'],
  ['Woohoo_ElderTryForBaby', 'Elder Try for Baby'],
  ['Woohoo_SameSexTryForBaby', 'Same Sex Try for Baby'],
])
addSettings('woohoo', ['WooHoo Pregnancy'], [
  ['Woohoo_RiskyWoohooPercents', 'Risky WooHoo Percent'],
  ['Woohoo_UseFertileInRisky', 'Use Fertility in Risky'],
  ['Woohoo_TryForBabyPercent', 'Try for Baby Percent'],
  ['Woohoo_SameSexPregnantSim', 'Same Sex Pregnancy Sim'],
  ['Woohoo_OppositeSexPregnantSim', 'Opposite Sex Pregnancy Sim'],
])
addSettings('woohoo', ['WooHoo Reactions'], [
  ['Woohoo_BedSharing', 'Bed Sharing'],
  ['Woohoo_DisableJealousy', 'No Jealousy'],
  ['Woohoo_UsePrivacy', 'Use Privacy for WooHoo'],
  ['Woohoo_SleepyWoohoo', 'Sleepy WooHoo'],
])
addSettings('woohoo', ['Sim Nudity'], [
  ['Woohoo_NudeWoohooGender', 'Nudity Genders'],
  ['Woohoo_NudityAges', 'Nudity Ages'],
  ['Woohoo_RemainNude', 'Stay Nude after WooHoo'],
])
addSettings('woohoo', ['Sim Nudity', 'Nudity Interactions'], [
  ['Woohoo_NudeWoohoo', 'Nude WooHoo'],
  ['Woohoo_NudeInHotTub', 'Nude Hot Tub WooHoo'],
  ['Woohoo_NudeInHotSprings', 'Nude Hot Springs WooHoo'],
  ['Woohoo_NudeInSauna', 'Nude Sauna WooHoo'],
  ['Woohoo_NudeSpa', 'Nude Spa'],
  ['Woohoo_NudeYoga', 'Nude Yoga'],
  ['Woohoo_NudeWorkout', 'Nude Workout'],
  ['Woohoo_NudeInShower', 'Nude Shower WooHoo'],
])
addSettings('woohoo', ['Other Settings'], [
  ['Woohoo_AutonomousWoohoo', 'Autonomous WooHoo'],
  ['Woohoo_AutonomousTryForBaby', 'Autonomous Try for Baby'],
  ['Woohoo_AutonomousMinRestTime', 'Autonomous Rest Time'],
  ['Woohoo_ExtremeWoohoo', 'Extreme WooHoo'],
  ['Woohoo_UseWoohooSkill', 'Use WooHoo Skill'],
  ['Woohoo_UseBirthControl', 'Allow Birth Control'],
  ['Woohoo_BirthControlDuration', 'Birth Control Duration'],
  ['Woohoo_BirthControlAllMoods', 'All Moods Birth Control'],
])

const moduleCategories: Record<string, string> = {
  'mccc settings': 'core',
  'mc command center': 'core',
  'mc cas': 'appearance',
  'mc create-a-sim': 'appearance',
  'mc career': 'careers',
  'mc careers': 'careers',
  'mc cleaner': 'cleaner',
  'mc clubs': 'clubs',
  'mc dresser': 'dresser',
  'mc occult': 'occult',
  'mc population': 'population',
  'mc pregnancy': 'pregnancy',
  'mc marriage': 'pregnancy',
  'mc tuner': 'tuner',
  'mc woohoo': 'woohoo',
}

// Exact in-game observations supplement entries absent from the website. A
// name prefix alone is not sufficient evidence to place future unknown keys.
const observedCategories: Record<string, string> = {
  AgeSpanHorseShort: 'core',
  AgeSpanHorseNormal: 'core',
  AgeSpanHorseLong: 'core',
  Pause_on_Zone: 'core',
  Teleport_Sims_Overlap: 'core',
  Relationship_MoveinHomeless: 'core',
  Show_DeathNotificationType: 'core',
  Career_LimitNS: 'careers',
  Marriage_BypassDorms: 'pregnancy',
  Pregnancy_BypassDorms: 'pregnancy',
  Population_MovingBypassDorms: 'population',
}

function normalizePart(value: string): string {
  return value.trim().replace(/^[([]+/, '').replace(/[)\]]+$/, '')
    .replace(/(?:\.{3}|…)$/, '').trim().toLowerCase()
}

export function getNavigation(key: string, reference?: NavigationReference): Assignment {
  const path = reference?.MenuPath.split(/\s*(?:>|->)\s*/).filter(Boolean).map(normalizePart) ?? []
  // An earlier real module wins. For example, MC Pregnancy Notifications is
  // below MCCC Settings and does not move those settings into MC Pregnancy.
  const pathCategory = path.map(part => moduleCategories[part]).find(Boolean)
  const knownSetting = registeredSettings.get(key)
  const category = pathCategory ?? observedCategories[key]
    ?? knownSetting?.category
    ?? (reference ? moduleCategories[normalizePart(reference.Module)] : undefined)
    ?? 'other'

  if (knownSetting?.category === category) {
    return {
      category, menuPath: [...knownSetting.menuPath],
      ...(knownSetting.label ? { label: knownSetting.label } : {}),
    }
  }
  if (category !== 'core') return { category, menuPath: [] }

  // Keep legacy or additional reference entries navigable without fabricating
  // deeper menus for modules the user has not yet described.
  if (path.includes('age settings')) {
    return { category, menuPath: path.includes('set age span duration') ? ['Age', 'Age Span Durations'] : ['Age'] }
  }
  if (path.includes('auto-save')) return { category, menuPath: ['Auto-Save'] }
  if (path.includes('gameplay settings')) {
    const child = ['Death Settings', 'Motive Decay', 'Skill Settings'].find(label => path.includes(label.toLowerCase()))
    return { category, menuPath: child ? ['Gameplay', child] : ['Gameplay'] }
  }
  return { category, menuPath: ['More MCCC Settings'] }
}

type NavigableSetting = { key: string; label: string; category: string; menuPath: string[] }

function menuOrder(category: string, path: string[]): number[] {
  let nodes = categories.find(item => item.id === category)?.menus ?? []
  return path.map(label => {
    const index = nodes.findIndex(node => node.label === label)
    nodes = index < 0 ? [] : nodes[index]!.children ?? []
    return index < 0 ? Number.MAX_SAFE_INTEGER : index
  })
}

export function compareSettingsForNavigation(a: NavigableSetting, b: NavigableSetting): number {
  const categoryIndex = (id: string) => {
    const index = categories.findIndex(category => category.id === id)
    return index < 0 ? categories.length : index
  }
  const categoryDifference = categoryIndex(a.category) - categoryIndex(b.category)
  if (categoryDifference) return categoryDifference
  const aMenu = menuOrder(a.category, a.menuPath)
  const bMenu = menuOrder(b.category, b.menuPath)
  for (let index = 0; index < Math.max(aMenu.length, bMenu.length); index += 1) {
    const difference = (aMenu[index] ?? -1) - (bMenu[index] ?? -1)
    if (difference) return difference
  }
  const pathDifference = a.menuPath.join(' > ').localeCompare(b.menuPath.join(' > '))
  if (pathDifference) return pathDifference
  const aOrder = registeredSettings.get(a.key)?.order ?? Number.MAX_SAFE_INTEGER
  const bOrder = registeredSettings.get(b.key)?.order ?? Number.MAX_SAFE_INTEGER
  return aOrder - bOrder || a.label.localeCompare(b.label) || a.key.localeCompare(b.key)
}
