import { occultPregnancyPairs } from './navigation'

type OccultSettingBlock = { id: string; label: string; keys: readonly string[]; species?: string }

const speciesBlocks: Record<string, OccultSettingBlock[]> = {
  Aliens: [
    { id: 'aliens', label: 'Aliens', keys: ['Occult_ForceAlienDisguiseType', 'Occult_MaximumAliens'] },
    {
      id: 'abductions', label: 'Abduction settings',
      keys: ['Occult_AlienFrequency', 'Occult_AbductionAges', 'Occult_AbductionAllowNPC', 'Occult_AbductionStartHour', 'Occult_AbductionDuration', 'Occult_TimeBetweenAbductions'],
    },
    {
      id: 'abduction-pregnancy', label: 'Abduction pregnancy',
      keys: ['Occult_AgePercentage', 'Occult_AbductionPregnancyAges', 'Occult_AbductionPregnancyGenders', 'Occult_AlienPollinatorGenders', 'Occult_IgnoreCasOnAbduction'],
    },
  ],
  Fairies: [{ id: 'fairies', label: 'Fairies', keys: ['Occult_MaximumFairies'] }],
  Mermaids: [{ id: 'mermaids', label: 'Mermaids', keys: ['Occult_ForceMermaidForm', 'Occult_MaximumMermaids'] }],
  Spellcasters: [{ id: 'spellcasters', label: 'Spellcasters', keys: ['Occult_MaximumSpellcasters'] }],
  Vampires: [
    {
      id: 'vampires', label: 'Vampires',
      keys: ['Occult_VampireExpAdjustment', 'Occult_ForceDarkform', 'Occult_VampireSkillOnAgeUp', 'Occult_MaximumVampires'],
    },
    {
      id: 'risky-vampirism', label: 'Risky vampirism',
      keys: ['Occult_RiskyVampNeedCreation', 'Occult_RiskyVampPercentages', 'Occult_RiskyVampNotification'],
    },
  ],
  Werewolves: [{ id: 'werewolves', label: 'Werewolves', keys: ['Occult_MaximumWerewolves'] }],
}

export const occultSettingBlocks: OccultSettingBlock[] = [
  { id: 'shared-aging', label: 'Occult aging', keys: ['Occult_OccultTypeAgeMultiplier', 'Occult_OccultTypeMaximumAge'] },
  { id: 'custom-pregnancy-global', label: 'Custom pregnancy', keys: ['Occult_UseCustomPregnancy'] },
  ...Object.entries(occultPregnancyPairs).flatMap(([species, pairs]) => [
    ...speciesBlocks[species]!.map(block => ({ ...block, species })),
    { id: `${species.toLowerCase()}-pregnancy`, label: `${species} — pregnancy outcomes`, species, keys: pairs.map(([key]) => key) },
  ]),
]

export const occultSettingKeys = new Set(occultSettingBlocks.flatMap(block => block.keys))
