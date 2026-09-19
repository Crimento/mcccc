export function isPercentage(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 100
}

function decimalPlaces(value: number): number {
  const [coefficient, exponent = '0'] = String(value).toLowerCase().split('e')
  return Math.max(0, (coefficient!.split('.')[1]?.length ?? 0) - Number(exponent))
}

function toUnits(value: number, precision: number): bigint {
  const [coefficient, exponent = '0'] = String(value).toLowerCase().split('e')
  const fractionLength = coefficient!.split('.')[1]?.length ?? 0
  return BigInt(coefficient!.replace('.', '')) * 10n ** BigInt(precision + Number(exponent) - fractionLength)
}

function fromUnits(value: bigint, precision: number): number {
  if (!precision) return Number(value)
  const digits = value.toString().padStart(precision + 1, '0')
  return Number(`${digits.slice(0, -precision)}.${digits.slice(-precision)}`)
}

/** Sum decimal representations without accumulating binary addition noise. */
export function percentageTotal(values: readonly number[]): number | null {
  if (!values.length || !values.every(isPercentage)) return null
  const precision = Math.max(...values.map(decimalPlaces))
  const total = fromUnits(values.reduce((sum, value) => sum + toUnits(value, precision), 0n), precision)
  // JSON numbers cannot represent every decimal complement exactly. This only
  // affects total comparison/display; it never changes an imported value.
  return Math.abs(total - 100) <= Number.EPSILON * 100 * values.length ? 100 : total
}

/**
 * Keep one edited percentage, then divide the remainder among the others in
 * proportion to their previous weights. Decimal allocation uses exact integer
 * arithmetic; largest-remainder ties go to the lower original array index.
 * Invalid data is returned as null so the caller can stage explicit repairs.
 */
export function rebalancePercentages(values: readonly number[], index: number, value: number): number[] | null {
  if (!values.length || !Number.isInteger(index) || index < 0 || index >= values.length
    || !values.every(isPercentage) || !isPercentage(value)) return null
  if (values.length === 1) return [100]

  const precision = Math.max(2, decimalPlaces(value), ...values.map(decimalPlaces))
  const scale = 10n ** BigInt(precision)
  const fixed = toUnits(value, precision)
  const remaining = 100n * scale - fixed
  const peers = values.flatMap((weight, peerIndex) => peerIndex === index ? [] : [{
    index: peerIndex, weight: toUnits(weight, precision), units: 0n, remainder: 0n,
  }])
  let totalWeight = peers.reduce((sum, peer) => sum + peer.weight, 0n)
  if (totalWeight === 0n) {
    for (const peer of peers) peer.weight = 1n
    totalWeight = BigInt(peers.length)
  }

  let allocated = 0n
  for (const peer of peers) {
    const weighted = remaining * peer.weight
    peer.units = weighted / totalWeight
    peer.remainder = weighted % totalWeight
    allocated += peer.units
  }
  const remainderOrder = [...peers].sort((a, b) =>
    a.remainder === b.remainder ? a.index - b.index : a.remainder > b.remainder ? -1 : 1,
  )
  const extraUnits = Number(remaining - allocated)
  for (let offset = 0; offset < extraUnits; offset++) remainderOrder[offset]!.units++

  const next = [...values]
  next[index] = value
  for (const peer of peers) next[peer.index] = fromUnits(peer.units, precision)
  return next
}
