import { test } from '@playwright/test'

test('wordle screenshot', async ({ page }) => {
  await page.goto('/brain-training/wordle')
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: 'tests/e2e/screenshots/wordle.png', fullPage: true })
})

test('actor blitz screenshot', async ({ page }) => {
  await page.goto('/trivia/actors')
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: 'tests/e2e/screenshots/actor-blitz.png', fullPage: true })
})

test('home screenshot', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: 'tests/e2e/screenshots/home-mobile.png', fullPage: true })
})
