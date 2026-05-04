import { test, expect, type Page } from '@playwright/test'

async function advanceOneCard(page: Page) {
  const mcChoices = page.locator('main button').filter({ hasText: /^the\s/i })
  if (await mcChoices.first().isVisible().catch(() => false)) {
    await mcChoices.first().click().catch(() => {})
    await page.waitForTimeout(150)
  }
  const check = page.locator('button', { hasText: /^check$/i }).first()
  if (await check.isVisible().catch(() => false)) {
    await check.click({ force: true }).catch(() => {})
    await page.waitForTimeout(300)
  }
  const cont = page.locator('button', { hasText: /^continue$/i }).first()
  if (await cont.isVisible().catch(() => false)) {
    await cont.click({ force: true }).catch(() => {})
    await page.waitForTimeout(400)
  }
}

async function waitForCardWithTappable(page: Page) {
  for (let attempt = 0; attempt < 15; attempt++) {
    const header = page.getByText(/^Type the meaning$/i).first()
    if (await header.isVisible().catch(() => false)) {
      const tappable = page.locator('.hanzi button').first()
      if (await tappable.isVisible().catch(() => false)) return tappable
    }
    await advanceOneCard(page)
  }
  throw new Error('No Tappable hanzi token appeared within 15 attempts')
}

test.describe('Tap-a-word hints', () => {
  test('tapping a word in the prompt opens the hint popover', async ({ page }) => {
    await page.goto('/german/learn/de-family')
    await expect(page.locator('main').first()).toBeVisible()

    const tappable = await waitForCardWithTappable(page)
    await tappable.click()

    const popover = page.getByTestId('hint-popover')
    await expect(popover).toBeVisible({ timeout: 3_000 })
  })

  test('hint popover renders within the viewport', async ({ page }) => {
    await page.goto('/german/learn/de-family')
    await expect(page.locator('main').first()).toBeVisible()

    const tappable = await waitForCardWithTappable(page)
    await tappable.click()

    const popover = page.getByTestId('hint-popover')
    await expect(popover).toBeVisible({ timeout: 3_000 })

    const box = await popover.boundingBox()
    const viewport = page.viewportSize()
    expect(box).not.toBeNull()
    expect(viewport).not.toBeNull()
    if (!box || !viewport) return

    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.y).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height)
  })

  test('popover dismisses when clicking outside', async ({ page }) => {
    await page.goto('/german/learn/de-family')
    await expect(page.locator('main').first()).toBeVisible()

    const tappable = await waitForCardWithTappable(page)
    await tappable.click()
    await expect(page.getByTestId('hint-popover')).toBeVisible({ timeout: 3_000 })

    await page.mouse.click(10, 10)
    await expect(page.getByTestId('hint-popover')).toHaveCount(0, { timeout: 3_000 })
  })
})
