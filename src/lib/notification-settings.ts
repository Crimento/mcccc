export type NotificationBlock = {
  id: 'general' | 'aging-death' | 'population' | 'pregnancy' | 'neighborhood-stories'
  label: string
  description: string
  keys: string[]
}

export const notificationMasterKey = 'Show_Notifications'

// Presentation only. Keep individual choices editable when the master is off,
// and include a legacy or optional key only when it exists in the imported file.
export const notificationBlocks: NotificationBlock[] = [
  {
    id: 'general',
    label: 'General notifications',
    description: 'Choose version checks, autosave messages, and club-monitor notices.',
    keys: ['Show_VersionCheckNotification', 'Show_AutosaveNotifications', 'Show_ClubMonitorNotifications'],
  },
  {
    id: 'aging-death',
    label: 'Aging/Death notifications',
    description: 'Choose notifications for birthdays, aging, and deaths.',
    keys: [
      'Show_AgeUpNotificationType', 'Show_NPCBirthdayNotifications', 'Show_DeathNotificationType',
      'Show_DeathNotifications', 'Show_PetDeathNotificationType',
    ],
  },
  {
    id: 'population',
    label: 'MC Population',
    description: 'Choose notifications about empty houses and moving Sims.',
    keys: ['Show_HouseEmptyNotification', 'Show_MovingNotificationType'],
  },
  {
    id: 'pregnancy',
    label: 'MC Pregnancy',
    description: 'Choose notifications for marriages, births, pregnancies, and relationship changes.',
    keys: [
      'Show_MarriageNotificationType', 'Show_BirthNotificationType', 'Show_BirthNotificationDetails',
      'Show_PregnancyNotificationType', 'Show_PregnancyAffairNotificationType', 'Show_RelChangeNotificationType',
    ],
  },
  {
    id: 'neighborhood-stories',
    label: 'Neighborhood Stories',
    description: 'Choose notifications for Neighborhood Stories changes.',
    keys: [
      'Show_NSPopulationType', 'Show_NSPregnancyType', 'Show_NSDeathType', 'Show_NSPetAdoption',
      'Show_NSAdoptionType', 'Show_NSCareerType',
    ],
  },
]

export const notificationSettingKeys = new Set([
  notificationMasterKey,
  ...notificationBlocks.flatMap(block => block.keys),
])
