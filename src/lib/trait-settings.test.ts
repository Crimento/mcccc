import { describe, expect, it } from 'vitest'
import { personalityTraitOptions, petTraitOptions, toggleKnownPetTrait, toggleKnownTrait } from './trait-settings'

describe('personality trait selection', () => {
  const active = '27419'
  const wise = '341151'
  const hugeId = '900719925474099312345678901234567890'

  it('keeps all 97 supplied IDs and labels unique with the supplied endpoint and middle mappings', () => {
    expect(personalityTraitOptions).toHaveLength(97)
    expect(new Set(personalityTraitOptions.map(option => option.value)).size).toBe(97)
    expect(new Set(personalityTraitOptions.map(option => option.label)).size).toBe(97)
    expect(personalityTraitOptions[0]).toEqual({ value: active, label: 'Active' })
    expect(personalityTraitOptions.at(-1)).toEqual({ value: wise, label: 'Wise' })
    expect(personalityTraitOptions).toContainEqual({ value: '501609', label: 'Heart on Your Sleeve' })
    expect(personalityTraitOptions).toContainEqual({ value: '16833', label: 'Noncommital' })
  })

  it('appends and removes a known trait without changing unrelated raw tokens or large IDs', () => {
    const original = `  MODDED_TRAIT ,${hugeId},00027419,MODDED_TRAIT,,\t${hugeId}\t,`
    const selected = toggleKnownTrait(original, active, true)
    expect(selected).toBe(`${original},${active}`)
    expect(toggleKnownTrait(selected, active, false)).toBe(original)
    expect(toggleKnownTrait('', active, true)).toBe(active)
    expect(toggleKnownTrait(active, active, false)).toBe('')
  })

  it('recognizes padded known tokens while removing only that trait and preserving other duplicates', () => {
    const original = ` ${active}\t, ${hugeId} ,${active}, ${wise} ,00027419,00027419`
    expect(toggleKnownTrait(original, active, true)).toBe(original)
    const removed = toggleKnownTrait(original, active, false)
    expect(removed).toBe(` ${hugeId} , ${wise} ,00027419,00027419`)
    expect(toggleKnownTrait(removed, active, true)).toBe(`${removed},${active}`)
    expect(toggleKnownTrait(removed, wise, true)).toBe(removed)
  })

  it('never learns modded IDs from another input or permits inexact whitelist arguments', () => {
    const first = toggleKnownTrait(`CUSTOM_A, ${hugeId} `, active, true)
    const second = toggleKnownTrait('CUSTOM_B', wise, true)
    expect(first).toBe(`CUSTOM_A, ${hugeId} ,${active}`)
    expect(second).toBe(`CUSTOM_B,${wise}`)
    for (const code of ['CUSTOM_A', hugeId, '00027419', ` ${active} `, '27419,341151', '']) {
      expect(toggleKnownTrait(second, code, true)).toBe(second)
      expect(toggleKnownTrait(second, code, false)).toBe(second)
      expect(toggleKnownTrait('', code, true)).toBe('')
    }
    expect(toggleKnownTrait(first, 'CUSTOM_B', true)).toBe(first)
  })
})

describe('pet trait selection', () => {
  it('keeps species with the same trait name distinct, including the verified Friendly and Glutton mappings', () => {
    expect(petTraitOptions).toHaveLength(45)
    expect(new Set(petTraitOptions.map(option => option.value)).size).toBe(45)
    expect(new Set(petTraitOptions.map(option => option.label)).size).toBe(45)
    expect(['Cats', 'Dogs', 'Horses'].map(species =>
      petTraitOptions.filter(option => option.label.endsWith(`(${species})`)).length,
    )).toEqual([17, 17, 11])
    expect(petTraitOptions.filter(option => /^(Friendly|Glutton) /.test(option.label))).toEqual([
      { value: '171610', label: 'Friendly (Dogs)' },
      { value: '158765', label: 'Friendly (Cats)' },
      { value: '322836', label: 'Friendly (Horses)' },
      { value: '171609', label: 'Glutton (Dogs)' },
      { value: '159977', label: 'Glutton (Cats)' },
    ])
  })

  it('removes only the chosen species while keeping unrelated raw tokens byte for byte', () => {
    const unrelated = ' 158765 ,322836,00171610,MODDED_PET,,90071992547409931234567890,MODDED_PET,'
    const original = `\t171610 ,${unrelated},171610`
    expect(toggleKnownPetTrait(original, '171610', true)).toBe(original)
    expect(toggleKnownPetTrait(original, '171610', false)).toBe(unrelated)
    expect(toggleKnownPetTrait(unrelated, '171610', true)).toBe(`${unrelated},171610`)
    expect(toggleKnownPetTrait('', '171610', true)).toBe('171610')
    expect(toggleKnownPetTrait('171610', '171610', false)).toBe('')
  })

  it('keeps personality and pet whitelists separate without learning imported IDs or mutating either catalogue', () => {
    const catalogues = structuredClone([personalityTraitOptions, petTraitOptions])
    const pets = '27419, 171613 ,MODDED_PET'
    const people = '171613, 27419 ,MODDED_PERSON'
    expect(toggleKnownPetTrait(pets, '171613', false)).toBe('27419,MODDED_PET')
    expect(toggleKnownTrait(people, '27419', false)).toBe('171613,MODDED_PERSON')
    for (const selected of [false, true]) {
      expect(toggleKnownPetTrait(pets, '27419', selected)).toBe(pets)
      expect(toggleKnownTrait(people, '171613', selected)).toBe(people)
      for (const code of ['MODDED_PET', 'MODDED_PERSON', '00171613', ' 171613 ', '171613,27419', '']) {
        expect(toggleKnownPetTrait(pets, code, selected)).toBe(pets)
        expect(toggleKnownPetTrait('', code, selected)).toBe('')
      }
    }
    expect([personalityTraitOptions, petTraitOptions]).toEqual(catalogues)
  })
})
