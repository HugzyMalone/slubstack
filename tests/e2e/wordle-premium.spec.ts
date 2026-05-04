import { test, expect } from '@playwright/test'

test.describe('Wordle premium polish', () => {
  test('typing a valid 5-letter guess flips the row on submit', async ({ page }) => {
    await page.goto('/brain-training/wordle')
    await expect(page.locator('button').filter({ hasText: /^Q$/ }).first()).toBeVisible()

    for (const letter of ['C', 'R', 'A', 'N', 'E']) {
      await page.locator('button').filter({ hasText: new RegExp(`^${letter}$`) }).first().click()
    }
    await page.locator('button').filter({ hasText: /^ENTER$/ }).first().click()

    const firstRowTiles = page.locator('div[data-flipped]').first()
    await expect(firstRowTiles).toHaveAttribute('data-flipped', 'true', { timeout: 5_000 })
  })

  test('an invalid word triggers the shake toast', async ({ page }) => {
    await page.goto('/brain-training/wordle')
    await expect(page.locator('button').filter({ hasText: /^Q$/ }).first()).toBeVisible()

    for (const letter of ['Z', 'X', 'Q', 'V', 'B']) {
      await page.locator('button').filter({ hasText: new RegExp(`^${letter}$`) }).first().click()
    }
    await page.locator('button').filter({ hasText: /^ENTER$/ }).first().click()

    await expect(page.getByText(/not in word list/i)).toBeVisible({ timeout: 3_000 })
  })

  test('practice route renders board with no leaderboard chrome', async ({ page }) => {
    await page.goto('/brain-training/wordle/practice')
    await expect(page.locator('button').filter({ hasText: /^Q$/ }).first()).toBeVisible()
    const tiles = page.locator('div[style*="perspective"]')
    await expect(tiles.first()).toBeVisible()

    await expect(page.getByText(/today.s scores/i)).toHaveCount(0)
    await expect(page.getByText(/leaderboard/i)).toHaveCount(0)
  })

  test('Hard mode toggle persists across reloads', async ({ page }) => {
    await page.goto('/stats')
    const settingsTab = page.locator('button, a').filter({ hasText: /^settings$/i }).first()
    if (await settingsTab.count()) {
      await settingsTab.click().catch(() => {})
    }

    await page.evaluate(() => localStorage.setItem('slubstack_wordle_hard', '1'))
    await page.goto('/brain-training/wordle')

    const hardBadge = page.getByText(/^hard$/i).first()
    await expect(hardBadge).toBeVisible()

    await page.reload()
    await expect(page.getByText(/^hard$/i).first()).toBeVisible()
  })

  test('streak badge shows when a recent win is in localStorage', async ({ page }) => {
    await page.goto('/brain-training/wordle')
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    await page.evaluate((d) => {
      localStorage.setItem('slubstack_wordle_streak', '4')
      localStorage.setItem('slubstack_wordle_last_won', d)
    }, todayStr)

    await page.reload()
    const streak = page.getByTestId('wordle-streak')
    await expect(streak).toBeVisible()
    await expect(streak).toHaveText(/4/)
  })
})
