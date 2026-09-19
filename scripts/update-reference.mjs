import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

// Optional local input makes reference updates reproducible without a network request.
const source = 'https://deaderpool-mccc.com/otherassets/menu_data.json'
const input = process.argv[2]
const raw = input
  ? JSON.parse(await readFile(input, 'utf8'))
  : await fetch(source).then((response) => {
      if (!response.ok) throw new Error(`Reference download failed: ${response.status}`)
      return response.json()
    })

const fields = ['SettingName', 'Description', 'MenuPath', 'DefaultValue', 'Module']
const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }
function plainText(value) {
  return value
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (match, entity) => {
      if (entity[0] !== '#') return entities[entity.toLowerCase()] ?? match
      const number = entity[1].toLowerCase() === 'x'
        ? Number.parseInt(entity.slice(2), 16)
        : Number.parseInt(entity.slice(1), 10)
      return number >= 0 && number <= 0x10ffff ? String.fromCodePoint(number) : match
    })
    .replace(/\s+/g, ' ')
    .trim()
}

if (!Array.isArray(raw)) throw new Error('Expected an array of setting records')
const seen = new Set()
const records = raw.map((record) => {
  for (const field of fields) {
    if (typeof record[field] !== 'string') throw new Error(`Invalid ${field} in reference`)
  }
  if (seen.has(record.SettingName)) throw new Error(`Duplicate setting: ${record.SettingName}`)
  seen.add(record.SettingName)
  return Object.fromEntries(fields.map((field) => [field, plainText(record[field])]))
})
const output = new URL('../src/data/settings-reference.json', import.meta.url)
await mkdir(new URL('../src/data/', import.meta.url), { recursive: true })
await writeFile(output, `${JSON.stringify(records, null, 2)}\n`)
console.log(`Updated ${records.length} setting references in ${fileURLToPath(output)}`)
