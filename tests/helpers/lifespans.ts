import { expect, type Page } from '@playwright/test'

/** Expand only the lifespan groups visible in the current menu or search. */
export async function expandVisibleLifespanGroups(page: Page) {
  for (const species of ['Humans', 'Cats', 'Dogs', 'Horses']) {
    const toggle = page.getByRole('button', { name: `Edit details for ${species} lifespans`, exact: true })
    if (await toggle.isVisible()) {
      await toggle.click()
      await expect(page.getByRole('button', { name: `Hide details for ${species} lifespans`, exact: true }))
        .toHaveAttribute('aria-expanded', 'true')
    }
  }
}
