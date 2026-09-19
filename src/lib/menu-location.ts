import { categories } from './navigation'

export type MenuLocation = { category: string; path: string[] }

// Encode each menu label separately: several labels themselves contain slashes.
// Only navigation belongs in the URL; configuration data stays in the browser.
export function menuHref(category: string, path: readonly string[] = []): string {
  return category === 'all'
    ? '#/settings'
    : `#/settings/${[category, ...path].map(part => encodeURIComponent(part)).join('/')}`
}

export function parseMenuHash(hash: string): MenuLocation | undefined {
  if (!hash || hash === '#/settings' || hash === '#/settings/') return { category: 'all', path: [] }
  // Leave ordinary document anchors, such as the skip link, alone.
  if (!hash.startsWith('#/settings/')) return undefined
  let parts: string[]
  try {
    parts = hash.slice('#/settings/'.length).split('/').map(decodeURIComponent)
  } catch {
    return undefined
  }
  const [category, ...path] = parts
  const module = categories.find(item => item.id === category)
  if (!module) return undefined
  let menus = module.menus ?? []
  for (const label of path) {
    const menu = menus.find(item => item.label === label)
    if (!menu) return undefined
    menus = menu.children ?? []
  }
  return { category: module.id, path }
}
