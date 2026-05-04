import { test, expect } from '@playwright/test'

test.describe('Languages page order', () => {
  test('languages render in order: German, Mandarin, Spanish', async ({ page }) => {
    await page.goto('/languages')

    const desktopGrid = page.locator('.lg\\:grid')
    await expect(desktopGrid).toBeVisible()

    const titles = desktopGrid.locator('h2')
    const ordered = (await titles.allInnerTexts()).map((t) => t.trim())

    const firstOf = (name: string) => ordered.indexOf(name)
    expect(firstOf('German')).toBe(0)
    expect(firstOf('Mandarin')).toBe(1)
    expect(firstOf('Spanish')).toBe(2)
  })

  test('each language card shows a non-zero unit/card count', async ({ page }) => {
    await page.goto('/languages')

    const desktopGrid = page.locator('.lg\\:grid')
    await expect(desktopGrid.getByText(/18 units · 287 cards/)).toBeVisible()
    await expect(desktopGrid.getByText(/12 units · 249 cards/)).toBeVisible()
    await expect(desktopGrid.getByText(/8 units · 116 cards/)).toBeVisible()

    await expect(page.getByText(/0 units · 0 cards/)).toHaveCount(0)
  })
})
