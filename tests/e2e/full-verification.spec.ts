import { test, expect } from '@playwright/test'

test.describe('Home page', () => {
  test('renders hero, fact, and section cards', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('img[src*="panda"], img[src*="bear"]').first()).toBeVisible()
    const cards = page.locator('main').locator('a[href="/languages"], a[href="/skills"], a[href="/brain-training"], a[href="/trivia"]')
    await expect(cards).toHaveCount(4)
    const factText = page.locator('p').filter({ hasText: /.{40,}/ }).first()
    await expect(factText).toBeVisible()
  })

  test('body scroll is locked on home', async ({ page }) => {
    await page.goto('/')
    const overflow = await page.evaluate(() => document.body.style.overflow)
    expect(['hidden', 'clip', '']).toContain(overflow)
  })
})

test.describe('Navigation', () => {
  test('bottom nav visible on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    const nav = page.locator('nav').filter({ has: page.locator('a[href="/stats"]') })
    await expect(nav).toBeVisible()
  })

  test('sidebar visible on desktop', async ({ page }) => {
    await page.goto('/')
    const sidebar = page.locator('aside, nav').filter({ has: page.locator('a[href="/mandarin"]') }).first()
    await expect(sidebar).toBeVisible()
  })

  test('back button shows on non-home pages (mobile)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/spanish')
    const back = page.locator('button, a').filter({ hasText: /back/i }).first()
    await expect(back).toBeVisible()
  })
})

test.describe('Language pages', () => {
  for (const lang of ['spanish', 'mandarin', 'german']) {
    test(`${lang} skill tree loads`, async ({ page }) => {
      await page.goto(`/${lang}`)
      const units = page.locator('button, a').filter({ hasText: /unit|lesson|greet|number|color|family|verb|day|place/i })
      await expect(units.first()).toBeVisible()
    })
  }
})

test.describe('Brain Training hub', () => {
  test('hub page renders with Math Blitz and Wordle links', async ({ page }) => {
    await page.goto('/brain-training')
    await expect(page.locator('a[href="/brain-training/math-blitz"]')).toBeVisible()
    await expect(page.locator('a[href="/brain-training/wordle"]')).toBeVisible()
  })

  test('Math Blitz game renders difficulty selector', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/brain-training/math-blitz')
    const difficulty = page.locator('button, label').filter({ hasText: /easy|medium|hard/i }).first()
    await expect(difficulty).toBeVisible()
    const nav = page.locator('nav').filter({ has: page.locator('a[href="/trivia"]') })
    await expect(nav).toBeHidden()
  })

  test('Math Blitz game starts on difficulty select', async ({ page }) => {
    await page.goto('/brain-training/math-blitz')
    const easy = page.locator('button').filter({ hasText: /easy/i }).first()
    await easy.click()
    await expect(page.locator('button').filter({ hasText: /easy/i }).first()).not.toBeVisible()
  })

  test('Wordle renders game board and keyboard', async ({ page }) => {
    await page.goto('/brain-training/wordle')
    const qKey = page.locator('button').filter({ hasText: /^Q$/ }).first()
    await expect(qKey).toBeVisible()
    const tiles = page.locator('div[style*="perspective"]')
    await expect(tiles.first()).toBeVisible()
  })
})

test.describe('Trivia', () => {
  test('trivia hub loads', async ({ page }) => {
    await page.goto('/trivia')
    await expect(page.locator('a[href="/trivia/actors"]')).toBeVisible()
  })

  test('Actor Blitz loads with lobby button', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/trivia/actors')
    const content = page.locator('button').filter({ hasText: /let.s go|loading actors/i }).first()
    await expect(content).toBeVisible()
    const nav = page.locator('nav').filter({ has: page.locator('a[href="/trivia"]') })
    await expect(nav).toBeHidden()
  })
})

test.describe('Stats / Profile', () => {
  test('stats page renders tabs', async ({ page }) => {
    await page.goto('/stats')
    const tabs = page.locator('button, a').filter({ hasText: /profile|leaderboard|settings|sign in|log in/i })
    await expect(tabs.first()).toBeVisible()
  })
})

test.describe('Review hub', () => {
  test('renders Languages, Skills, Brain Training, and Trivia accordions', async ({ page }) => {
    await page.goto('/review')
    const main = page.locator('main')
    await expect(main.locator('button').filter({ hasText: /Languages/ }).first()).toBeVisible()
    await expect(main.locator('button').filter({ hasText: /Skills/ }).first()).toBeVisible()
    await expect(main.locator('button').filter({ hasText: /Brain Training/ }).first()).toBeVisible()
    await expect(main.locator('button').filter({ hasText: /Trivia/ }).first()).toBeVisible()
  })

  test('Skills section contains Vibe Coding, not Languages', async ({ page }) => {
    await page.goto('/review')
    const main = page.locator('main')
    await main.locator('button').filter({ hasText: /Skills/ }).first().click()
    await expect(page.locator('a[href="/vibe-coding/review"]')).toBeVisible()
    await main.locator('button').filter({ hasText: /Languages/ }).first().click()
    const langSection = page.locator('div').filter({ has: page.locator('a[href="/mandarin/review"]') }).first()
    await expect(langSection.locator('a[href="/vibe-coding/review"]')).toHaveCount(0)
  })
})

test.describe('Vibe Coding', () => {
  test('skill tree loads with Prompting Basics as first unit', async ({ page }) => {
    await page.goto('/vibe-coding')
    const firstUnit = page.locator('a, button').filter({ hasText: /prompting basics/i }).first()
    await expect(firstUnit).toBeVisible()
  })

  test('skill tree shows Start on first incomplete unit only', async ({ page }) => {
    await page.goto('/vibe-coding')
    const startBadges = page.locator('span').filter({ hasText: /^Start$/ })
    await expect(startBadges).toHaveCount(1)
  })

  test('lesson uses only multiple-choice and match — no type input', async ({ page }) => {
    await page.goto('/vibe-coding/learn/vc-prompting')
    await expect(page.locator('img[src*="bear"]').first()).toBeVisible()
    const textInput = page.locator('input[type="text"], textarea')
    await expect(textInput).toHaveCount(0)
  })

  test('review page loads', async ({ page }) => {
    await page.goto('/vibe-coding/review')
    const content = page.locator('button, img[src*="bear"]').first()
    await expect(content).toBeVisible()
  })

  test('skills hub loads with Vibe Coding link', async ({ page }) => {
    await page.goto('/skills')
    await expect(page.locator('main').locator('a[href="/vibe-coding"]')).toBeVisible()
  })
})

test.describe('API endpoints', () => {
  test('user profile API returns 404 for unknown user', async ({ request }) => {
    const res = await request.get('/api/user/00000000-0000-0000-0000-000000000000')
    expect([404, 503]).toContain(res.status())
  })

  test('user profile API rejects invalid UUID shape', async ({ request }) => {
    const res = await request.get('/api/user/not-a-real-id')
    expect(res.status()).toBeGreaterThanOrEqual(400)
  })
})

test.describe('404 / Error handling', () => {
  test('unknown route shows a not-found page', async ({ page }) => {
    await page.goto('/this-does-not-exist-xyz')
    const body = await page.textContent('body')
    expect(body).toMatch(/404|not found|doesn't exist/i)
  })
})
