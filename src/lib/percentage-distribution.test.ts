import { describe, expect, it } from 'vitest'
import { percentageTotal, rebalancePercentages } from './percentage-distribution'

describe('linked percentage distributions', () => {
  it('keeps a precise edited value and complements a second outcome', () => {
    expect(rebalancePercentages([13.25, 86.75], 0, 36.125)).toEqual([36.125, 63.875])
    expect(rebalancePercentages([50, 50], 1, 100)).toEqual([0, 100])
    expect(rebalancePercentages([50, 50], 0, 0)).toEqual([0, 100])
  })

  it('proportionally reallocates peers and repairs an off-total distribution only when invoked', () => {
    const original = Object.freeze([50, 30, 20])
    expect(rebalancePercentages(original, 0, 20)).toEqual([20, 48, 32])
    expect(original).toEqual([50, 30, 20])
    expect(rebalancePercentages([10, 10, 20], 0, 40)).toEqual([40, 20, 40])
  })

  it('splits among zero-weight peers and resolves remainder ties deterministically', () => {
    expect(rebalancePercentages([100, 0, 0], 0, 25)).toEqual([25, 37.5, 37.5])
    expect(rebalancePercentages([0, 1, 1, 1], 0, 0)).toEqual([0, 33.34, 33.33, 33.33])
    expect(rebalancePercentages([0, 0, 0], 0, 0.001)).toEqual([0.001, 50, 49.999])
  })

  it('retains decimal precision, including scientific-notation inputs, without NaN', () => {
    expect(rebalancePercentages([0, 1, 2], 0, 0.1234)).toEqual([0.1234, 33.2922, 66.5844])
    for (const edited of [0.12345678901234566, 1e-20, Number.MIN_VALUE]) {
      const result = rebalancePercentages([50, 25, 25], 0, edited)!
      expect(result[0]).toBe(edited)
      expect(result.every(value => Number.isFinite(value) && value >= 0 && value <= 100)).toBe(true)
      expect(percentageTotal(result)).toBe(100)
    }
  })

  it('does not silently normalize malformed data or invalid edits', () => {
    for (const values of [[], [-1, 101], [50, Number.NaN], [Infinity, 0]]) {
      expect(rebalancePercentages(values, 0, 50)).toBeNull()
      expect(percentageTotal(values)).toBeNull()
    }
    for (const value of [-1, 101, NaN, Infinity]) expect(rebalancePercentages([50, 50], 0, value)).toBeNull()
    for (const index of [-1, 2, 0.5]) expect(rebalancePercentages([50, 50], index, 20)).toBeNull()
    expect(percentageTotal([10, 20])).toBe(30)
    expect(percentageTotal([33.33, 33.33, 33.34])).toBe(100)
  })

  it('keeps a single supported outcome fixed at 100 on an explicit repair', () => {
    expect(rebalancePercentages([25], 0, 100)).toEqual([100])
    expect(rebalancePercentages([100], 0, 20)).toEqual([100])
  })
})
