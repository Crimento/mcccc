export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue }

export type SettingsRecord = Record<string, JsonValue>

const unsafeKeys = new Set(['__proto__', 'prototype', 'constructor'])

function assertJsonValue(value: unknown, path: string): asserts value is JsonValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return
  if (typeof value === 'number' && Number.isFinite(value)) return
  if (typeof value !== 'object') {
    throw new Error(`Invalid value at ${path}. Settings must contain valid JSON values.`)
  }

  for (const [key, child] of Object.entries(value)) {
    if (unsafeKeys.has(key)) {
      throw new Error(`Unsafe setting key "${key}" at ${path}.`)
    }
    assertJsonValue(child, `${path}.${key}`)
  }
}

function assertSettings(value: unknown): asserts value is SettingsRecord {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('The config must be a JSON object containing setting names and values.')
  }
  assertJsonValue(value, 'config')
}

/** Validate without dropping unknown settings or coercing their values. */
export function parseConfig(text: string): SettingsRecord {
  let value: unknown
  try {
    value = JSON.parse(text.replace(/^\uFEFF/, ''))
  } catch {
    throw new Error('This file is not valid JSON. Choose an unmodified mc_settings.cfg file.')
  }
  assertSettings(value)
  return value
}

export function serializeConfig(config: SettingsRecord): string {
  assertSettings(config)
  return `${JSON.stringify(config, null, 4)}\n`
}

export function cloneConfig(config: SettingsRecord): SettingsRecord {
  return parseConfig(serializeConfig(config))
}

/** Object key order is irrelevant; array order and value types are significant. */
export function isEqual(a: JsonValue | undefined, b: JsonValue | undefined): boolean {
  if (a === b) return true
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
    return false
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    return Array.isArray(a) && Array.isArray(b)
      && a.length === b.length && a.every((value, index) => isEqual(value, b[index]))
  }
  const keys = Object.keys(a)
  return keys.length === Object.keys(b).length
    && keys.every((key) => Object.hasOwn(b, key) && isEqual(a[key], b[key]))
}

export function changedKeys(original: SettingsRecord, current: SettingsRecord): string[] {
  return [...new Set([...Object.keys(original), ...Object.keys(current)])]
    .filter((key) => !isEqual(original[key], current[key]))
}

/** Presets replace only their declared top-level settings, never the entire config. */
export function applyPreset(config: SettingsRecord, patch: SettingsRecord): SettingsRecord {
  assertSettings(config)
  assertSettings(patch)
  return cloneConfig({ ...config, ...patch })
}

/** MCCC stores many multi-select settings as comma-separated strings. */
export function toggleCsvValue(current: string, token: string, selected: boolean): string {
  const option = token.trim()
  if (!option || option.includes(',')) {
    throw new Error('A selection must be a single non-empty option.')
  }
  const tokens = new Set(current.split(',').map((value) => value.trim()).filter(Boolean))
  if (selected) tokens.add(option)
  else tokens.delete(option)
  return [...tokens].join(',')
}

export function validateNumericInput(
  raw: string,
  { min, max, step }: { min?: number; max?: number; step?: number } = {},
): { valid: boolean; value?: number; error?: string } {
  const trimmed = raw.trim()
  if (!trimmed) return { valid: false, error: 'Enter a number.' }
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(trimmed)) {
    return { valid: false, error: 'Enter a valid number.' }
  }
  const value = Number(trimmed)
  if (!Number.isFinite(value)) return { valid: false, error: 'Enter a finite number.' }
  if (min !== undefined && value < min) {
    return { valid: false, error: `Enter ${min} or more.` }
  }
  if (max !== undefined && value > max) {
    return { valid: false, error: `Enter ${max} or less.` }
  }
  if (step !== undefined && Number.isFinite(step) && step > 0) {
    const steps = (value - (min ?? 0)) / step
    if (Math.abs(steps - Math.round(steps)) > 1e-8) {
      return { valid: false, error: `Use increments of ${step}${min === undefined ? '' : ` from ${min}`}.` }
    }
  }
  return { valid: true, value }
}
