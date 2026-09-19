import type { CsvNumberFieldsMeta } from './catalog'
import { validateNumericInput } from './config'

const outcomeLabels = ['Alien', 'Hybrid', 'Vampire', 'Mermaid', 'Spellcaster', 'Werewolf', 'Fairy']

// Positions describe the stored CSV, while their order describes the controls.
// Only these reference-backed parent combinations have verified encodings.
const outcomeIndices: Record<string, readonly number[]> = {
  Occult_CustomPregnancyAlienHuman: [0, 1],
  Occult_CustomPregnancyAlienHybrid: [0, 1],
  Occult_CustomPregnancyHybridHuman: [0, 1],
  Occult_CustomPregnancyHybridHybrid: [0, 1],
  Occult_CustomPregnancyVampireAlien: [2, 1, 0],
  Occult_CustomPregnancyVampireHuman: [2],
  Occult_CustomPregnancyMermaidAlien: [3, 1, 0],
  Occult_CustomPregnancyMermaidHuman: [3],
  Occult_CustomPregnancyMermaidVampire: [3, 2],
  Occult_CustomPregnancyWitchAlien: [4, 1, 0],
  Occult_CustomPregnancyWitchHuman: [4],
  Occult_CustomPregnancyWitchMermaid: [4, 3],
  Occult_CustomPregnancyWitchVampire: [4, 2],
  Occult_CustomPregnancyWerewolfAlien: [5, 1, 0],
  Occult_CustomPregnancyWerewolfHuman: [5],
  Occult_CustomPregnancyWerewolfMermaid: [5, 3],
  Occult_CustomPregnancyWerewolfVampire: [5, 2],
  Occult_CustomPregnancyWerewolfWitch: [5, 4],
  Occult_CustomPregnancyFairyAlien: [6, 1, 0],
  Occult_CustomPregnancyFairyHuman: [6],
  Occult_CustomPregnancyFairyMermaid: [6, 3],
  Occult_CustomPregnancyFairyVampire: [6, 2],
  Occult_CustomPregnancyFairyWerewolf: [6, 5],
  Occult_CustomPregnancyFairyWitch: [6, 4],
}

/** User-reviewed outcome budget; inactive positions remain preserved in the CSV. */
export function getOccultPregnancyFields(key: string, value: unknown): CsvNumberFieldsMeta | undefined {
  if (typeof value !== 'string' || !Object.hasOwn(outcomeIndices, key)) return undefined
  const indices = outcomeIndices[key]!
  const tokens = value.split(',')
  if ((tokens.length !== 6 && tokens.length !== 7)
    || indices.some(index => index >= tokens.length)
    || !tokens.every(token => validateNumericInput(token).valid)) return undefined

  return {
    labels: indices.map(index => outcomeLabels[index]!),
    indices: [...indices],
    tokenCount: tokens.length,
    min: 0,
    max: 100,
    step: 1,
    unit: '%',
    totalMax: 100,
    remainderLabel: 'Human',
  }
}
