// Exact settings in MCCC Settings > Gameplay > Motive Decay. Missing keys are
// not added to imported files, and similarly named settings are not inferred.
export const motiveDecaySettings = [
  { key: 'MotiveDecay_Sims', label: 'Sims' },
  { key: 'Pregnancy_BabyMotiveDecay', label: 'Babies' },
  { key: 'MotiveDecay_Vampires', label: 'Vampires' },
  { key: 'MotiveDecay_Cats', label: 'Cats' },
  { key: 'MotiveDecay_Dogs', label: 'Dogs' },
  { key: 'MotiveDecay_Horses', label: 'Horses' },
  { key: 'Decay_Ratio_Fame', label: 'Fame' },
  { key: 'Decay_Ratio_Prestige', label: 'Dynasty prestige' },
]

export const motiveDecayKeys = new Set(motiveDecaySettings.map(setting => setting.key))

// Shared behavior comes from the bundled reference; the user confirmed the
// common 0–500 range for all eight settings during the menu review.
export const motiveDecayDescription = 'Control how quickly motives, fame, and dynasty prestige decay. 100% is the normal rate, 50% halves it, and 0% stops decay. Values above 100% increase decay, up to 500%. Traits and buffs still affect the rate unless it is set to 0%.'
