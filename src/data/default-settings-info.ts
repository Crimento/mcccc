// The user recreated mc_settings.cfg on a fresh save and confirmed this version.
// Keep the comparison snapshot separate from the editable example fixture.
export const defaultBaselineInfo = {
  mcccVersion: '2026.5.0',
  capturedAt: '2026-09-20',
  includesWoohoo: true,
  source: 'User-provided fresh default configuration, including the MC WooHoo module.',
  // Autosave_CurrentSaveNumber, DP_OneTimeUpdate and DP_UseOnly are internal
  // state, so they are intentionally excluded from default-settings.json.
} as const
