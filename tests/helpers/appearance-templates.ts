import { expect, type Page } from '@playwright/test'

export async function expandVisibleAppearanceGroups(page: Page) {
  for (const gender of ['Female', 'Male']) {
    const expand = page.getByRole('button', { name: `Edit details for ${gender} appearance templates`, exact: true })
    if (await expand.isVisible()) {
      await expand.click()
      await expect(page.getByRole('button', { name: `Hide details for ${gender} appearance templates`, exact: true }))
        .toHaveAttribute('aria-expanded', 'true')
    }
  }
}
