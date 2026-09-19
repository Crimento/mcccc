export const clubBlocks = [
  {
    id: 'limits', label: 'Club limits',
    keys: ['Club_ClubMemberCount', 'Club_MaximumClubCount'],
  },
  {
    id: 'membership', label: 'Membership management',
    keys: ['Club_MonitorMembers', 'Club_BypassPlayedHouseholds', 'Club_OpenMemberSlots'],
  },
] as const

export const clubSettingKeys = new Set<string>(clubBlocks.flatMap(block => block.keys))
