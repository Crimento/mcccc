import { describe, expect, it } from 'vitest'
import { menuHref, parseMenuHash } from './menu-location'
import { categories, type MenuNode } from './navigation'

describe('menu URL locations', () => {
  it('encodes each menu label separately, including slashes inside labels', () => {
    const path = ['Notifications/Console/Menu Settings', 'Notification Settings', 'Aging/Death Notifications']
    const href = '#/settings/core/Notifications%2FConsole%2FMenu%20Settings/Notification%20Settings/Aging%2FDeath%20Notifications'
    expect(menuHref('core', path)).toBe(href)
    expect(parseMenuHash(href)).toEqual({ category: 'core', path })
    expect(menuHref('appearance', ['Fit/Fat limits', 'Female']))
      .toBe('#/settings/appearance/Fit%2FFat%20limits/Female')
    expect(menuHref('all')).toBe('#/settings')
    for (const hash of ['', '#/settings', '#/settings/']) {
      expect(parseMenuHash(hash)).toEqual({ category: 'all', path: [] })
    }
  })

  it('round-trips every registered category and nested menu without changing the caller path', () => {
    function checkMenus(category: string, menus: MenuNode[], parent: string[] = []) {
      for (const menu of menus) {
        const path = [...parent, menu.label]
        const before = [...path]
        const result = parseMenuHash(menuHref(category, path))
        expect(result).toEqual({ category, path })
        expect(path).toEqual(before)
        expect(result?.path).not.toBe(path)
        checkMenus(category, menu.children ?? [], path)
      }
    }
    for (const category of categories) {
      expect(parseMenuHash(menuHref(category.id))).toEqual({ category: category.id, path: [] })
      checkMenus(category.id, category.menus ?? [])
    }
  })

  it('rejects malformed URLs and labels outside their real ancestry without treating document anchors as menus', () => {
    for (const hash of [
      '#settings-list', '#/other/core', '#/settings/unknown', '#/settings/all/Gameplay',
      '#/settings/core/Death%20Settings', '#/settings/core/Gameplay/Money%20Settings',
      '#/settings/clubs/Gameplay', '#/settings/core/Gameplay/Death%20Settings/Extra',
      '#/settings/core/Notifications/Console/Menu%20Settings',
      '#/settings/core/Gameplay/', '#/settings/core//Gameplay', '#/settings/core/%',
      '#/settings/core/%E0%A4%A', '#/settings/core/%252F', '#/settings/__proto__',
    ]) expect(parseMenuHash(hash), hash).toBeUndefined()
  })
})
