export const notificationAudienceLabels = {
  '0': 'No notifications',
  N: 'NPCs only',
  P: 'Played / active Sims',
  R: 'Related to active household',
  AF: 'Friends of active household',
  AR: 'Romantic interests of active household',
  AL: 'All',
} as const

export type NotificationAudienceCode = keyof typeof notificationAudienceLabels

const notificationAudienceOrder: readonly NotificationAudienceCode[] = ['0', 'N', 'P', 'R', 'AF', 'AR', 'AL']

// Each setting opts into its documented codes and may refine their audience
// labels. Do not infer a setting's available choices from its key name.
export function notificationAudienceOptions(
  codes: readonly NotificationAudienceCode[] = notificationAudienceOrder,
  labelOverrides: Partial<Record<NotificationAudienceCode, string>> = {},
): { value: NotificationAudienceCode; label: string }[] {
  return codes.map((value) => ({ value, label: labelOverrides[value] ?? notificationAudienceLabels[value] }))
}
