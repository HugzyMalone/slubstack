import { test, expect, type Page } from '@playwright/test'
import vocab from '../../content/german/vocab.json'

type GermanCard = {
  id: string
  hanzi: string
  english: string
}

const cardByGerman = new Map<string, GermanCard>(
  (vocab as GermanCard[]).map((c) => [c.hanzi, c]),
)

function oneEditTypo(s: string): string {
  const idx = Math.floor(s.length / 2)
  return s.slice(0, idx) + s.slice(idx + 1)
}

function expectedFromCard(c: GermanCard): string {
  const meaning = c.english.split('/')[0].split(',')[0].trim()
  return meaning.toLowerCase()
}

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

async function reachTypeAnswerCard(page: Page): Promise<GermanCard> {
  for (let attempt = 0; attempt < 15; attempt++) {
    const header = page.getByText(/^Type the meaning$/i).first()
    if (await header.isVisible().catch(() => false)) {
      const prompt = await page.locator('.hanzi').first().innerText()
      const trimmed = prompt.trim()
      const card = cardByGerman.get(trimmed)
      if (card) return card
      throw new Error(`Card lookup failed for prompt: ${trimmed}`)
    }
    await advanceOneCard(page)
  }
  throw new Error('Did not reach a TypeAnswer card within 15 attempts')
}

test.describe('Typo tolerance', () => {
  test('1-edit-distance typo is accepted as a near miss', async ({ page }) => {
    await page.goto('/german/learn/de-family')
    await expect(page.locator('main').first()).toBeVisible()

    const card = await reachTypeAnswerCard(page)
    const expected = expectedFromCard(card)
    test.skip(expected.length < 4, 'Expected answer too short for a 1-edit typo')

    const typo = oneEditTypo(expected)
    await page.locator('input[placeholder*="English" i], input[placeholder*="tippen" i]').fill(typo)
    await page.locator('button').filter({ hasText: /^check$/i }).first().click()

    await expect(page.getByTestId('near-miss-pill')).toBeVisible({ timeout: 5_000 })
    await expect(page.getByTestId('near-miss-pill')).toContainText(/almost/i)
  })

  test('totally wrong answer is marked wrong with no near-miss pill', async ({ page }) => {
    await page.goto('/german/learn/de-family')
    await expect(page.locator('main').first()).toBeVisible()

    await reachTypeAnswerCard(page)

    await page.locator('input[placeholder*="English" i], input[placeholder*="tippen" i]').fill('zxqvbn')
    await page.locator('button').filter({ hasText: /^check$/i }).first().click()

    const tryAgain = page.getByText(/not quite/i)
    await expect(tryAgain).toBeVisible({ timeout: 5_000 })
    await expect(page.getByTestId('near-miss-pill')).toHaveCount(0)
  })
})
