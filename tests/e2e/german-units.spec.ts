import { test, expect, type Page } from '@playwright/test'
import vocab from '../../content/german/vocab.json'

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

test.describe('German units coverage', () => {
  test('languages page shows 18 units · 287 cards for German', async ({ page }) => {
    await page.goto('/languages')
    const desktopGrid = page.locator('.lg\\:grid')
    await expect(desktopGrid.getByText(/18 units · 287 cards/)).toBeVisible()
  })

  test('Modal Verbs unit page renders with cards', async ({ page }) => {
    await page.goto('/german/learn/de-modals')
    await expect(page.locator('main').first()).toBeVisible()

    const prompt = page.locator('.hanzi').first()
    await expect(prompt).toBeVisible({ timeout: 5_000 })
    await expect(prompt).not.toHaveText('')
  })

  test('Family unit prompts contain article-required nouns with "the" expected', async ({ page }) => {
    await page.goto('/german/learn/de-family')
    await expect(page.locator('main').first()).toBeVisible()

    for (let attempt = 0; attempt < 15; attempt++) {
      const header = page.getByText(/^Type the meaning$/i).first()
      if (await header.isVisible().catch(() => false)) {
        const prompt = (await page.locator('.hanzi').first().innerText()).trim()
        if (/^(der|die|das) /i.test(prompt)) {
          const input = page.locator('input[placeholder*="English" i], input[placeholder*="tippen" i]').first()
          await input.fill('the test')
          await page.locator('button').filter({ hasText: /^check$/i }).first().click({ force: true })
          await page.waitForTimeout(300)
          await page.locator('button').filter({ hasText: /^check$/i }).first().click({ force: true }).catch(() => {})
          await expect(page.getByText(/Answer:\s*the\s/i).first()).toBeVisible({ timeout: 5_000 })
          return
        }
      }
      await advanceOneCard(page)
    }
    test.skip(true, 'Did not encounter an article-required TypeAnswer card within 15 attempts')
  })

  test('smalltalk unit contains the "You are missed." card', async ({ page }) => {
    const card = (vocab as Array<{ id: string; english: string }>).find((c) => c.id === 'de-talk-19')
    expect(card).toBeDefined()
    expect(card?.english).toBe('You are missed.')

    await page.goto('/german/learn/de-smalltalk')
    await expect(page.locator('main').first()).toBeVisible()
    await expect(page.locator('.hanzi').first()).toBeVisible({ timeout: 5_000 })
  })
})
