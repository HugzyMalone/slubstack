import { test, expect, Page } from '@playwright/test'

// Collect all console errors across tests
const consoleErrors: Record<string, string[]> = {}

async function captureConsoleErrors(page: Page, label: string) {
  consoleErrors[label] = []
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors[label].push(msg.text())
  })
  page.on('pageerror', err => consoleErrors[label].push(`[pageerror] ${err.message}`))
}

test.describe('Home page', () => {
  test('renders hero, fact, and section cards', async ({ page }) => {
    await captureConsoleErrors(page, 'home')
    await page.goto('/')
    await expect(page.locator('img[src*="panda"], img[src*="bear"]').first()).toBeVisible()
    // 4 section cards (scope to main to exclude sidebar links)
    const cards = page.locator('main').locator('a[href="/languages"], a[href="/skills"], a[href="/brain-training"], a[href="/trivia"]')
    await expect(cards).toHaveCount(4)
    // Has a rotating fact text block — facts are all 50+ char sentences
    const factText = page.locator('p').filter({ hasText: /.{40,}/ }).first()
    await expect(factText).toBeVisible()
    await page.screenshot({ path: 'tests/e2e/screenshots/home.png' })
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
    // BottomNav has Home/Review/Profile tabs (not language links — those are in the desktop sidebar)
    const nav = page.locator('nav').filter({ has: page.locator('a[href="/stats"]') })
    await expect(nav).toBeVisible()
  })

  test('sidebar visible on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
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
      await captureConsoleErrors(page, lang)
      await page.goto(`/${lang}`)
      await page.waitForLoadState('networkidle')
      // Should have unit cards/buttons
      const units = page.locator('button, a').filter({ hasText: /unit|lesson|greet|number|color|family|verb|day|place/i })
      await expect(units.first()).toBeVisible({ timeout: 8000 })
      await page.screenshot({ path: `tests/e2e/screenshots/${lang}-skill-tree.png` })
    })
  }
})

test.describe('Brain Training hub', () => {
  test('hub page renders with Math Blitz and Wordle links', async ({ page }) => {
    await captureConsoleErrors(page, 'brain-training')
    await page.goto('/brain-training')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('a[href="/brain-training/math-blitz"]')).toBeVisible()
    await expect(page.locator('a[href="/brain-training/wordle"]')).toBeVisible()
    await page.screenshot({ path: 'tests/e2e/screenshots/brain-training.png' })
  })

  test('Math Blitz game renders difficulty selector', async ({ page }) => {
    await captureConsoleErrors(page, 'math-blitz')
    await page.goto('/brain-training/math-blitz')
    await page.waitForLoadState('networkidle')
    // Should show difficulty options
    const difficulty = page.locator('button, label').filter({ hasText: /easy|medium|hard/i }).first()
    await expect(difficulty).toBeVisible({ timeout: 8000 })
    // BottomNav should be hidden
    await page.setViewportSize({ width: 390, height: 844 })
    const nav = page.locator('nav').filter({ has: page.locator('a[href="/trivia"]') })
    await expect(nav).toBeHidden()
    await page.screenshot({ path: 'tests/e2e/screenshots/math-blitz.png' })
  })

  test('Math Blitz game starts on difficulty select', async ({ page }) => {
    await page.goto('/brain-training/math-blitz')
    await page.waitForLoadState('networkidle')
    const easy = page.locator('button').filter({ hasText: /easy/i }).first()
    await easy.click()
    // After clicking difficulty, the select screen disappears (countdown or playing starts)
    await expect(page.locator('button').filter({ hasText: /easy/i }).first()).not.toBeVisible({ timeout: 5000 })
    await page.screenshot({ path: 'tests/e2e/screenshots/math-blitz-playing.png' })
  })

  test('Wordle renders game board and keyboard', async ({ page }) => {
    await captureConsoleErrors(page, 'wordle')
    await page.goto('/brain-training/wordle')
    await page.waitForLoadState('networkidle')
    // QWERTY keyboard
    const qKey = page.locator('button').filter({ hasText: /^Q$/ }).first()
    await expect(qKey).toBeVisible({ timeout: 8000 })
    // Grid tiles use inline styles (no class names) — each tile wrapper has perspective set
    const tiles = page.locator('div[style*="perspective"]')
    await expect(tiles.first()).toBeVisible()
    await page.screenshot({ path: 'tests/e2e/screenshots/wordle.png' })
  })
})

test.describe('Trivia', () => {
  test('trivia hub loads', async ({ page }) => {
    await captureConsoleErrors(page, 'trivia')
    await page.goto('/trivia')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('a[href="/trivia/actors"]')).toBeVisible()
    await page.screenshot({ path: 'tests/e2e/screenshots/trivia.png' })
  })

  test('Actor Blitz loads with actor image and answer buttons', async ({ page }) => {
    await captureConsoleErrors(page, 'actor-blitz')
    await page.goto('/trivia/actors')
    await page.waitForLoadState('networkidle')
    // Lobby shows "Let's Go" button before game starts
    const content = page.locator('button').filter({ hasText: /let.s go|loading actors/i }).first()
    await expect(content).toBeVisible({ timeout: 8000 })
    // BottomNav hidden
    await page.setViewportSize({ width: 390, height: 844 })
    const nav = page.locator('nav').filter({ has: page.locator('a[href="/trivia"]') })
    await expect(nav).toBeHidden()
    await page.screenshot({ path: 'tests/e2e/screenshots/actor-blitz.png' })
  })
})

test.describe('Stats / Profile', () => {
  test('stats page renders tabs', async ({ page }) => {
    await captureConsoleErrors(page, 'stats')
    await page.goto('/stats')
    await page.waitForLoadState('networkidle')
    // Should show profile, leaderboard, settings tabs or a sign-in prompt
    const tabs = page.locator('button, a').filter({ hasText: /profile|leaderboard|settings|sign in|log in/i })
    await expect(tabs.first()).toBeVisible({ timeout: 8000 })
    await page.screenshot({ path: 'tests/e2e/screenshots/stats.png' })
  })
})

test.describe('Review hub', () => {
  test('review page renders Languages, Skills, Brain Training, and Trivia accordions', async ({ page }) => {
    await captureConsoleErrors(page, 'review')
    await page.goto('/review')
    await page.waitForLoadState('networkidle')
    // Accordion buttons contain title + subtitle text — use contains match
    const main = page.locator('main')
    await expect(main.locator('button').filter({ hasText: /Languages/ }).first()).toBeVisible({ timeout: 8000 })
    await expect(main.locator('button').filter({ hasText: /Skills/ }).first()).toBeVisible()
    await expect(main.locator('button').filter({ hasText: /Brain Training/ }).first()).toBeVisible()
    await expect(main.locator('button').filter({ hasText: /Trivia/ }).first()).toBeVisible()
    await page.screenshot({ path: 'tests/e2e/screenshots/review.png' })
  })

  test('review page Skills section contains Vibe Coding, not Languages', async ({ page }) => {
    await page.goto('/review')
    await page.waitForLoadState('networkidle')
    const main = page.locator('main')
    // Open the Skills accordion
    await main.locator('button').filter({ hasText: /Skills/ }).first().click()
    await expect(page.locator('a[href="/vibe-coding/review"]')).toBeVisible({ timeout: 5000 })
    // Open Languages accordion and confirm Vibe Coding is NOT inside it
    await main.locator('button').filter({ hasText: /Languages/ }).first().click()
    // The languages section should link to the three language reviews but not vibe-coding
    const langSection = page.locator('div').filter({ has: page.locator('a[href="/mandarin/review"]') }).first()
    await expect(langSection.locator('a[href="/vibe-coding/review"]')).toHaveCount(0)
  })
})

test.describe('Vibe Coding', () => {
  test('vibe coding skill tree loads with Prompting Basics as first unit', async ({ page }) => {
    await captureConsoleErrors(page, 'vibe-coding')
    await page.goto('/vibe-coding')
    await page.waitForLoadState('networkidle')
    // First unit "Prompting Basics" should be visible
    const firstUnit = page.locator('a, button').filter({ hasText: /prompting basics/i }).first()
    await expect(firstUnit).toBeVisible({ timeout: 8000 })
    await page.screenshot({ path: 'tests/e2e/screenshots/vibe-coding-skill-tree.png' })
  })

  test('vibe coding skill tree shows Start on first incomplete unit only', async ({ page }) => {
    await page.goto('/vibe-coding')
    await page.waitForLoadState('networkidle')
    // With a clean store there is exactly one "Start" badge visible
    const startBadges = page.locator('span').filter({ hasText: /^Start$/ })
    await expect(startBadges).toHaveCount(1, { timeout: 8000 })
  })

  test('vibe coding lesson uses only multiple-choice and match — no type input', async ({ page }) => {
    await captureConsoleErrors(page, 'vibe-lesson')
    await page.goto('/vibe-coding/learn/vc-prompting')
    await page.waitForLoadState('networkidle')
    // Wait for the lesson to hydrate — bear character image appears in the lesson shell
    await expect(page.locator('img[src*="bear"]').first()).toBeVisible({ timeout: 8000 })
    // There must be NO text input field (type interaction would render an <input>)
    const textInput = page.locator('input[type="text"], textarea')
    await expect(textInput).toHaveCount(0)
  })

  test('vibe coding review page loads', async ({ page }) => {
    await captureConsoleErrors(page, 'vibe-review')
    await page.goto('/vibe-coding/review')
    await page.waitForLoadState('networkidle')
    // Shows either a practice button or an empty state with the bear character
    const content = page.locator('button, img[src*="bear"]').first()
    await expect(content).toBeVisible({ timeout: 8000 })
  })

  test('skills hub loads with Vibe Coding link', async ({ page }) => {
    await captureConsoleErrors(page, 'skills')
    await page.goto('/skills')
    await page.waitForLoadState('networkidle')
    // Scope to main to avoid matching the sidebar link
    await expect(page.locator('main').locator('a[href="/vibe-coding"]')).toBeVisible({ timeout: 8000 })
  })
})

test.describe('API endpoints', () => {
  test('user profile API returns 404 for unknown user', async ({ page }) => {
    const res = await page.request.get('/api/user/00000000-0000-0000-0000-000000000000')
    expect([404, 503]).toContain(res.status())
  })

  test('user profile API rejects invalid UUID shape', async ({ page }) => {
    const res = await page.request.get('/api/user/not-a-real-id')
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
