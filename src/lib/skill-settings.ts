// User-supplied skill labels and saved IDs, including the separately confirmed
// Entrepreneur/Fabrication and Media Production/Medium mappings.
export const skillOptions: { value: string; label: string }[] = [
  { value: '194727', label: 'Acting' },
  { value: '439222', label: 'Apothecary' },
  { value: '174237', label: 'Archaeology' },
  { value: '452067', label: 'Archery' },
  { value: '104198', label: 'Baking' },
  { value: '158659', label: 'Bowling' },
  { value: '16699', label: 'Charisma' },
  { value: '16698', label: 'Comedy' },
  { value: '16705', label: 'Cooking' },
  { value: '259758', label: 'Cross-stitch' },
  { value: '128145', label: 'Dancing' },
  { value: '454328', label: 'Diving' },
  { value: '121612', label: 'DJ Mixing' },
  { value: '469915', label: 'Entomology' },
  { value: '274197', label: 'Entrepreneur' },
  { value: '231908', label: 'Fabrication' },
  { value: '39397', label: 'Fishing' },
  { value: '16659', label: 'Fitness' },
  { value: '186703', label: 'Flower Arranging' },
  { value: '16700', label: 'Gardening' },
  { value: '350972', label: 'Gemology' },
  { value: '16701', label: 'Gourmet Cooking' },
  { value: '16702', label: 'Guitar' },
  { value: '16704', label: 'Handiness' },
  { value: '101920', label: 'Herbalism' },
  { value: '322708', label: 'Horse Riding' },
  { value: '234806', label: 'Juice Fizzing' },
  { value: '239521', label: 'Knitting' },
  { value: '16706', label: 'Logic' },
  { value: '192655', label: 'Media Production' },
  { value: '255249', label: 'Medium' },
  { value: '16707', label: 'Mischief' },
  { value: '16695', label: 'Mixology' },
  { value: '434909', label: 'Natural Living' },
  { value: '315761', label: 'Nectar Making' },
  { value: '16708', label: 'Painting' },
  { value: '450214', label: 'Papercraft' },
  { value: '160504', label: 'Parenting' },
  { value: '161220', label: 'Pet Training' },
  { value: '105774', label: 'Photography' },
  { value: '16709', label: 'Piano' },
  { value: '149665', label: 'Pipe Organ' },
  { value: '371129', label: 'Pottery' },
  { value: '16703', label: 'Programming' },
  { value: '221014', label: 'Research & Debate' },
  { value: '217413', label: 'Robotics' },
  { value: '245639', label: 'Rock Climbing' },
  { value: '16710', label: 'Rocket Science' },
  { value: '368684', label: 'Romance' },
  { value: '174687', label: 'Selvadoradian Culture' },
  { value: '137811', label: 'Singing' },
  { value: '245613', label: 'Skiing' },
  { value: '246054', label: 'Snowboarding' },
  { value: '458742', label: 'Swordsmanship' },
  { value: '371481', label: 'Tattooing' },
  { value: '380495', label: 'Thanatology' },
  { value: '149556', label: 'Vampire Lore' },
  { value: '161190', label: 'Veterinarian' },
  { value: '16712', label: 'Video Gaming' },
  { value: '16713', label: 'Violin' },
  { value: '117858', label: 'Wellness' },
  { value: '16714', label: 'Writing' },
]

export const skillListKeys = new Set([
  'Skill_Difficulty_Blacklist',
  'Skill_Difficulty_Whitelist',
  'Skill_Freeze_List',
  'Skill_Cheats_Bypass',
])

export type SkillBlock = {
  id: 'difficulty' | 'other'
  label: string
  description: string
  keys: string[]
}

export const skillBlocks: SkillBlock[] = [
  {
    id: 'difficulty',
    label: 'Skill difficulty',
    description: 'Adjust skill progression speed and choose which skills the adjustment applies to.',
    keys: ['Skill_Difficulty_Adjustment', 'Skill_Difficulty_Blacklist', 'Skill_Difficulty_Whitelist'],
  },
  {
    id: 'other',
    label: 'Skill progression and cheats',
    description: 'Freeze selected skills or exclude them from commands that change all skills.',
    keys: ['Skill_Freeze_List', 'Skill_Cheats_Bypass'],
  },
]

export const skillSettingKeys = new Set(skillBlocks.flatMap(block => block.keys))

const knownSkillCodes = new Set(skillOptions.map(option => option.value))

// Keep unknown/modded IDs local to the imported file. Never parse numeric IDs,
// trim stored tokens, deduplicate unrelated entries, or reorder the CSV string.
export function toggleKnownSkill(current: string, code: string, selected: boolean): string {
  if (!knownSkillCodes.has(code)) return current
  const tokens = current.split(',')
  if (selected) {
    if (tokens.some(token => token.trim() === code)) return current
    return current === '' ? code : `${current},${code}`
  }
  return tokens.filter(token => token.trim() !== code).join(',')
}
