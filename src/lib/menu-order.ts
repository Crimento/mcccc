import type { JsonValue } from './config'

export type MenuMove = 'up' | 'down' | 'top' | 'bottom'
export type MenuOrderEntry = { key: string; label: string; position: number }

// Matched the supplied config's numeric positions to the user's default menu
// order, then confirmed by the user after exporting and testing in-game.
// Current saved positions always determine display order.
const menuLabels = new Map([
  ['0xC0B3CF8C', 'Modify Household in CAS'],
  ['0x3FA9FDC1', 'Modify in CAS'],
  ['0xDAD0806C', 'Sim Commands'],
  ['0x9F3AFD77', 'MC CAS'],
  ['0x3E440449', 'MC Cheats'],
  ['0x25224441', 'MC Cleaner'],
  ['0xE8517BB7', 'MC Control'],
  ['0x982C6AB9', 'Self Command'],
  ['0xAEE08715', 'MC Dresser'],
  ['0x923468DF', 'MC Pregnancy'],
  ['0xA5200215', 'MC Tuner'],
  ['0xE418BF6D', 'Sim Flags'],
  ['0x63C82106', 'Flag Active Sims'],
  ['0x68A8F19F', 'Relationships'],
])

function isRecord(value: JsonValue): value is Record<string, JsonValue> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function menuOrderEntries(value: JsonValue): MenuOrderEntry[] | null {
  if (!isRecord(value)) return null
  const fields = Object.entries(value)
  if (!fields.length) return null
  const entries: MenuOrderEntry[] = []
  const positions = new Set<number>()

  for (const [key, rawPosition] of fields) {
    if (typeof rawPosition !== 'number'
      && !(typeof rawPosition === 'string' && /^[0-9]+$/.test(rawPosition))) return null
    const position = Number(rawPosition)
    if (!Number.isSafeInteger(position) || position < 0 || positions.has(position)) return null
    positions.add(position)
    entries.push({ key, label: menuLabels.get(key) ?? `Unknown menu (${key})`, position })
  }

  return entries.sort((a, b) => a.position - b.position)
}

export function moveMenuEntry(value: JsonValue, key: string, move: MenuMove): JsonValue {
  const entries = menuOrderEntries(value)
  if (!entries || !isRecord(value)) return value
  const from = entries.findIndex(entry => entry.key === key)
  if (from < 0) return value
  let to: number
  switch (move) {
    case 'up': to = Math.max(0, from - 1); break
    case 'down': to = Math.min(entries.length - 1, from + 1); break
    case 'top': to = 0; break
    case 'bottom': to = entries.length - 1; break
    default: return value
  }
  if (from === to) return value

  // Move through existing slots rather than generating consecutive positions.
  const slots = entries.map(entry => entry.position)
  const reordered = [...entries]
  const [moved] = reordered.splice(from, 1)
  reordered.splice(to, 0, moved!)
  const changedPositions = new Map(reordered.flatMap((entry, index) =>
    entry.position === slots[index] ? [] : [[entry.key, slots[index]!] as const],
  ))

  return Object.fromEntries(Object.entries(value).map(([entryKey, original]) => {
    const position = changedPositions.get(entryKey)
    return [entryKey, position === undefined ? original
      : typeof original === 'string' ? String(position) : position]
  }))
}
