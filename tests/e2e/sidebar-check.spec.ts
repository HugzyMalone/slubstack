import { test } from '@playwright/test'

test('sidebar active state on language pages', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/spanish')
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: 'tests/e2e/screenshots/sidebar-spanish.png' })

  await page.goto('/mandarin')
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: 'tests/e2e/screenshots/sidebar-mandarin.png' })
})
