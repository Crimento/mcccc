/** Numeric values with an explicit sentinel for the game's default. */
export type DefaultNumberFieldMeta = {
  min: number
  max: number
  defaultValue: number
  defaultSentinel: number
  unit: string
  label?: string
  /** Slider convenience only; precise numeric inputs may use other decimals. */
  sliderStep?: number
}

type InGameSettingReference = {
  label: string
  description: string
  category: string
  section: string
  sourceNote: string
  defaultValue?: boolean | string | number
  defaultLabel?: string
  numericFields?: Record<string, DefaultNumberFieldMeta>
}

// These observations supplement, rather than modify, the downloaded official
// reference. Source notes distinguish supplied screenshots from reported values;
// the game and MCCC versions were not recorded.
const sourceNote = 'Based on a supplied in-game screenshot and reported defaults. The MCCC version was not recorded.'
const screenshotSourceNote = 'Based on a supplied in-game screenshot. The MCCC version was not recorded.'

function ageDuration(defaultValue: number): DefaultNumberFieldMeta {
  return { min: 1, max: 1000, defaultValue, defaultSentinel: 0, unit: 'days', sliderStep: 1 }
}

const humanAgeLabels = {
  Baby: 'Newborn',
  Infant: 'Infant',
  Toddler: 'Toddler',
  Child: 'Child',
  Teen: 'Teen',
  YoungAdult: 'Young Adult',
  Adult: 'Adult',
  Elder: 'Elder',
}

function humanLifespan(
  mode: 'Short' | 'Normal' | 'Long',
  defaults: readonly [number, number, number, number, number, number, number, number],
): InGameSettingReference {
  return {
    label: `Human lifespan — ${mode}`,
    description: `Sets human age durations when the game uses the ${mode} lifespan. Enter 0 to use the EA default for an age, or a custom duration greater than 0 and up to 4000 days. Decimal durations are supported.`,
    category: 'core',
    section: 'Human lifespans',
    sourceNote: 'Based on the user’s reported human lifespan defaults, allowed range, and decimal support. The game and MCCC versions were not recorded.',
    numericFields: Object.fromEntries(Object.entries(humanAgeLabels).map(([key, label], index) => [
      key,
      { min: 0, max: 4000, defaultValue: defaults[index]!, defaultSentinel: 0, unit: 'days', label, sliderStep: 0.5 },
    ])),
  }
}

function petLifespan(
  species: 'Cat' | 'Dog' | 'Horse',
  mode: 'Short' | 'Normal' | 'Long',
  child: number,
  adult: number,
  elder: number,
): InGameSettingReference {
  return {
    label: `${species} lifespan — ${mode}`,
    description: `Sets ${species.toLowerCase()} age durations when the game uses the ${mode} lifespan. Enter 0 to use the EA default for an age, or a custom duration from 1 to 1000 days. Decimal durations are supported.`,
    category: 'core',
    section: `${species} lifespans`,
    sourceNote: species === 'Horse'
      ? `${sourceNote} The user confirmed in the saved config that 0 uses the EA default.`
      : 'Based on the user’s reported pet lifespan defaults, allowed range, and decimal support, with 0 confirmed as the EA-default marker in the saved config. The game and MCCC versions were not recorded.',
    numericFields: {
      Child: ageDuration(child),
      Adult: ageDuration(adult),
      Elder: ageDuration(elder),
    },
  }
}

export const inGameSettings: Record<string, InGameSettingReference> = {
  Dresser_RunOnAgeUp: {
    label: 'Ages to Run on Age-up',
    description: 'Run MC Dresser’s outfit cleaning when Sims age into the selected stages.',
    category: 'dresser',
    section: 'MC Dresser',
    sourceNote: 'The user selected every age in-game and confirmed the saved I,TD,C,T,YA,A,E value for this setting. Behavior follows the bundled official reference. The game and MCCC versions were not recorded.',
  },
  Dresser_MakeupAges: {
    label: 'Makeup Ages',
    description: 'During makeup cleaning, Sims of these ages can receive makeup from MC Dresser’s Include Lists. Makeup is removed from Sims of unselected ages.',
    category: 'dresser',
    section: 'Makeup Settings',
    sourceNote: 'The user selected every age in-game and confirmed the saved I,TD,C,T,YA,A,E value for this setting. Behavior follows the bundled official reference. The game and MCCC versions were not recorded.',
  },
  Dresser_MultipleOutfitAges: {
    label: 'Multiple Outfit Ages',
    description: 'Choose which ages can have multiple outfits generated.',
    category: 'dresser',
    section: 'Multiple Outfit Settings',
    sourceNote: 'The user confirmed I,TD,C,T,YA,A,E with every age enabled, and Child through Elder as the default selection. The game and MCCC versions were not recorded.',
    defaultValue: 'C,T,YA,A,E',
    defaultLabel: 'Child, Teen, Young Adult, Adult, Elder',
  },
  Dresser_MakeupOutfits: {
    label: 'Makeup Outfits',
    description: 'Choose which outfit categories Run Makeup Check can change.',
    category: 'dresser',
    section: 'Makeup Settings',
    sourceNote: 'The user confirmed all 13 outfit codes in-game, including B (Bathing), BT (Batuu), C (Career), SI (Situation), and SP (Special). The game and MCCC versions were not recorded.',
  },
  Population_NumAdjustLot: {
    label: 'Adjust Sims on Lot',
    description: 'Apply Maximum Sims in Zone as the Sim limit for the selected lots and situations.',
    category: 'population',
    section: 'Other Settings',
    sourceNote: 'The user supplied and confirmed all 31 lot and situation codes from the in-game menu and an all-selected config string. The game and MCCC versions were not recorded.',
  },
  Population_DisableImmortalSims: {
    label: 'Disable Immortal Sims',
    description: 'Let selected groups of normally immortal Sims age and die.',
    category: 'population',
    section: 'Other Settings',
    sourceNote: 'The user confirmed all 12 in-game group codes and a saved string disabling immortality for every group. Code order does not affect the selection. The game and MCCC versions were not recorded.',
  },
  Woohoo_SameSexPregnantSim: {
    label: 'Same Sex Pregnancy Sim',
    description: 'Choose who can become pregnant from a same-sex Try for Baby interaction: the Target (receiving the interaction), the Initiator (starting it), or both.',
    category: 'woohoo',
    section: 'WooHoo Pregnancy',
    sourceNote: 'The user confirmed the T/I multiselect codes and Target default. Interaction behavior follows the bundled official reference. The game and MCCC versions were not recorded.',
    defaultValue: 'T',
    defaultLabel: 'Target',
  },
  Woohoo_OppositeSexPregnantSim: {
    label: 'Opposite Sex Pregnancy Sim',
    description: 'Choose who can become pregnant from a male/female Try for Baby or Risky WooHoo interaction. Female, Male, Target (receiving the interaction), and Initiator (starting it) can be selected in any combination.',
    category: 'woohoo',
    section: 'WooHoo Pregnancy',
    sourceNote: 'The user confirmed the F/M/T/I multiselect codes and Female default. Interaction behavior follows the bundled official reference. The game and MCCC versions were not recorded.',
    defaultValue: 'F',
    defaultLabel: 'Female',
  },
  Decay_Ratio_Friendship: {
    label: 'Friendship Decay Percentage',
    description: 'Control how quickly friendships fade. 0% stops decay, 100% is normal, values below 100% slow it down, and values above 100% speed it up.',
    category: 'core',
    section: 'Relationship Settings',
    sourceNote: 'The user confirmed the 0–500 range and 100 default for friendship and romantic decay. Decay behavior is described in the bundled official reference. The game and MCCC versions were not recorded.',
    defaultValue: 100,
    defaultLabel: '100% (normal decay)',
  },
  Decay_Ratio_Romantic: {
    label: 'Romantic Decay Percentage',
    description: 'Control how quickly romantic relationships fade. 0% stops decay, 100% is normal, values below 100% slow it down, and values above 100% speed it up.',
    category: 'core',
    section: 'Relationship Settings',
    sourceNote: 'The user confirmed the 0–500 range and 100 default for friendship and romantic decay. Decay behavior is described in the bundled official reference. The game and MCCC versions were not recorded.',
    defaultValue: 100,
    defaultLabel: '100% (normal decay)',
  },
  Bypass_Sim_Menus: {
    label: 'Bypass Specific Menus',
    description: 'Select menus to hide when clicking a Sim and opening MC Command Center. All menus remain available through the mccc console command.',
    category: 'core',
    section: 'Show Menu Settings',
    sourceNote: 'The user confirmed the 11 menu labels and their case-sensitive comma-separated codes. These tokens are separate from the hexadecimal identifiers in Menu_Order. Menu behavior and the empty default are described in the bundled official reference. The game and MCCC versions were not recorded.',
    defaultValue: '',
    defaultLabel: 'No menus bypassed',
  },
  Show_RelChangeNotificationType: {
    label: 'Show Relationship Changes',
    description: 'Show notifications about relationship changes made by MCCC’s scheduled process, for the selected audience. When logging is enabled, process details still go to mc_cmd_center.log regardless of this choice.',
    category: 'core',
    section: 'MC Pregnancy Notifications',
    sourceNote: 'The user confirmed that this setting uses the same seven audience codes as death notifications: 0, N, P, R, AF, AR, and AL. Scheduled-process behavior and the None default are described in the bundled official reference. The game and MCCC versions were not recorded.',
    defaultValue: '0',
    defaultLabel: 'None',
  },
  Show_VersionCheckNotification: {
    label: 'Show Version Update Notifications',
    description: 'Choose when MCCC checks Deaderpool’s website for a newer version. None disables automatic checks, Always Check checks each time the game starts, and When Game Updates checks after the Sims 4 version changes.',
    category: 'core',
    section: 'Notification Settings',
    sourceNote: 'The user confirmed the N, A, and G choices and None default. Check behavior is described in the bundled official reference. The game and MCCC versions were not recorded.',
    defaultValue: 'N',
    defaultLabel: 'None',
  },
  Menu_Order: {
    label: 'Change Sim Menu Order',
    description: 'Arrange the entries in the main MCCC Sim menu. Some entries may be hidden in-game depending on the selected Sim. Move entries up, down, to the top, or to the bottom, then export your config to save the order.',
    category: 'core',
    section: 'Notifications/Console/Menu Settings',
    sourceNote: 'The user supplied the 14 names in default menu order, matched to positions 0–13 in the supplied config, and then confirmed the mapping and reordering behavior by exporting the config and testing it in-game. Menu behavior is also described in the bundled official reference. The game and MCCC versions were not recorded.',
  },
  Inherit_Sim_Type: {
    label: 'Inheritance Sim Type',
    description: 'Choose which Sims leave money when they die. Their share of household funds goes to an eligible spouse or is divided equally among their children, while other adults retain their shares. MCCC default: None.',
    category: 'core',
    section: 'Money Settings',
    sourceNote: 'The user confirmed the four inheritance choices and their saved codes, including 0 for None. Inheritance behavior and the None default are described in the bundled official reference. The game and MCCC versions were not recorded.',
    defaultValue: '0',
    defaultLabel: 'None',
  },
  Neighborhood_Action_Plan_Bypass: {
    label: 'Neighborhood Action Plans Bypass',
    description: 'Choose neighborhood action plans to exclude. Each checked plan is bypassed. The plans offered in-game can depend on the active Sim’s neighborhood.',
    category: 'core',
    section: 'Gameplay',
    sourceNote: 'Plan labels and numeric string codes were reported by the user after checking the config. Bypass behavior is described in the bundled official reference. The game and MCCC versions were not recorded.',
  },
  Game_Time_Speed: {
    label: 'Game Time Speed',
    description: 'Sets how long a Sim day takes. Lower values make time pass faster; higher values make it pass more slowly. The default is 25.',
    category: 'core',
    section: 'Gameplay',
    sourceNote: 'The user reported the 1–1000 range and default of 25. Timing behavior is described in the bundled official reference. The game and MCCC versions were not recorded.',
    defaultValue: 25,
  },
  Maximum_Household_Size: {
    label: 'Maximum Household Size',
    description: 'Sets the maximum number of Sims allowed in a household. Choose from 8 to 104 Sims.',
    category: 'core',
    section: 'Gameplay',
    sourceNote: 'The user confirmed the 8–104 range, matching the bundled reference’s maximum of 104. The game and MCCC versions were not recorded.',
  },
  Maximum_Rename_Length: {
    label: 'Maximum Rename Length',
    description: 'Sets the character limit for each first and last name when renaming Sims through MCCC. Choose from 14 to 255 characters. The bundled reference notes that CAS can report an error when editing or saving names longer than 14 characters.',
    category: 'core',
    section: 'Gameplay',
    sourceNote: 'The user reported the 14–255 range. Name behavior and the CAS limitation are described in the bundled official reference. The game and MCCC versions were not recorded.',
  },
  AgeSpanShort: humanLifespan('Short', [0.5, 2.5, 3.5, 7, 10.5, 14, 21, 7]),
  AgeSpanNormal: humanLifespan('Normal', [1, 5, 7, 14, 21, 28, 42, 14]),
  AgeSpanLong: humanLifespan('Long', [4, 20, 28, 56, 84, 112, 168, 56]),
  AgeSpanCatShort: petLifespan('Cat', 'Short', 1, 15, 5.5),
  AgeSpanCatNormal: petLifespan('Cat', 'Normal', 2, 30, 11),
  AgeSpanCatLong: petLifespan('Cat', 'Long', 8, 120, 44),
  AgeSpanDogShort: petLifespan('Dog', 'Short', 1, 12.5, 4.5),
  AgeSpanDogNormal: petLifespan('Dog', 'Normal', 2, 25, 9),
  AgeSpanDogLong: petLifespan('Dog', 'Long', 8, 100, 36),
  AgeSpanHorseShort: petLifespan('Horse', 'Short', 3.5, 25, 6.5),
  AgeSpanHorseNormal: petLifespan('Horse', 'Normal', 7, 50, 13),
  AgeSpanHorseLong: petLifespan('Horse', 'Long', 28, 200, 52),
  Marriage_BypassDorms: {
    label: 'Bypass dorm residents — Marriage',
    description: 'When enabled, scheduled random marriages exclude dorm residents as either the target Sim or a potential spouse. MCCC default: Enabled.',
    category: 'relationships',
    section: 'Random marriages',
    sourceNote: screenshotSourceNote,
    defaultValue: true,
  },
  Population_MovingBypassDorms: {
    label: 'Bypass dorm residents — Move-outs',
    description: 'When enabled, retirement-home moves and single-Sim move-outs skip Sims who live in dorms. MCCC default: Enabled.',
    category: 'population',
    section: 'Retirement and single-Sim move-outs',
    sourceNote: screenshotSourceNote,
    defaultValue: true,
  },
  Pregnancy_BypassDorms: {
    label: 'Bypass dorm residents — Pregnancy',
    description: 'When enabled, scheduled random pregnancies exclude dorm residents as either the target Sim or a potential pregnancy partner. MCCC default: Enabled.',
    category: 'pregnancy',
    section: 'Random pregnancies',
    sourceNote: screenshotSourceNote,
    defaultValue: true,
  },
  Career_LimitNS: {
    label: 'Alter Neighborhood Stories — Careers',
    description: 'When enabled, Neighborhood Stories career changes are limited by MC Career settings. If Bypass Played Households is enabled, played Sims are skipped. Sims flagged Freeze Careers are also skipped. MCCC default: Disabled.',
    category: 'careers',
    section: 'Neighborhood Stories',
    sourceNote: 'The supplied in-game screenshot verifies the menu behavior and default. The user confirmed that toggling this option changes Career_LimitNS. The MCCC version was not recorded.',
    defaultValue: false,
  },
  Pause_on_Zone: {
    label: 'Pause on zone load',
    description: 'When enabled, the game pauses each time a new zone is loaded. MCCC default: Disabled.',
    category: 'core',
    section: 'Gameplay',
    sourceNote: 'The supplied in-game screenshot verifies the menu behavior and default. The user confirmed that toggling this option changes Pause_on_Zone. The MCCC version was not recorded.',
    defaultValue: false,
  },
  Relationship_MoveinHomeless: {
    label: 'Allow homeless romance move-ins',
    description: 'When enabled, homeless Sims can move in with housed Sims or other homeless Sims based on their current romance levels. MCCC default: Enabled.',
    category: 'relationships',
    section: 'General → Auto-relationship settings',
    sourceNote: 'The supplied in-game screenshot verifies the menu behavior and default. The user confirmed that toggling this option changes Relationship_MoveinHomeless. The MCCC version was not recorded.',
    defaultValue: true,
  },
  Show_DeathNotificationType: {
    label: 'Death notification audience',
    description: 'Displays a notification post when a Sim dies if they match the selected audience. None suppresses death notification posts. MCCC default: None.',
    category: 'notifications',
    section: 'Death notifications',
    sourceNote: 'Based on a supplied in-game screenshot and reported notification audience codes. The MCCC version was not recorded.',
    defaultValue: '0',
    defaultLabel: 'None',
  },
  Teleport_Sims_Overlap: {
    label: 'Teleport Sim overlap',
    description: 'When enabled, teleporting a Sim to another Sim’s location places them directly on top of that Sim. When disabled, they teleport to the side of that Sim. MCCC default: Enabled.',
    category: 'core',
    section: 'Teleportation',
    sourceNote: screenshotSourceNote,
    defaultValue: true,
  },
}
