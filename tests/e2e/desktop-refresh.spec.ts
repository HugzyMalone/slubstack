import { test, expect } from '@playwright/test'

const ROUTES = [
  { name: 'home',           path: '/' },
  { name: 'languages',      path: '/languages' },
  { name: 'mandarin',       path: '/mandarin' },
  { name: 'german',         path: '/german' },
  { name: 'spanish',        path: '/spanish' },
  { name: 'mandarin-vocab', path: '/mandarin/vocab' },
  { name: 'review',         path: '/review' },
  { name: 'stats',          path: '/stats' },
  { name: 'brain-training', path: '/brain-training' },
]

const VIEWPORTS = [
  { label: 'desktop', width: 1440, height: 900 },
  { label: 'mobile',  width: 375,  height: 812 },
] as const

for (const vp of VIEWPORTS) {
  for (const { name, path } of ROUTES) {
    test(`${vp.label} ${name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto(path)
      await expect(page.locator('body')).toBeVisible()
      await page.screenshot({
        path: `test-results/screenshots/${vp.label}-${name}.png`,
        fullPage: true,
      })
    })
  }
}
