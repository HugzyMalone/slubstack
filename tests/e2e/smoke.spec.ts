import { test, expect } from '@playwright/test'

test('home page loads', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Slubstack/i)
})

test('Spanish skill tree loads', async ({ page }) => {
  await page.goto('/spanish')
  await expect(page.locator('h1, h2').first()).toBeVisible()
})

test('Mandarin skill tree loads', async ({ page }) => {
  await page.goto('/mandarin')
  await expect(page.locator('h1, h2').first()).toBeVisible()
})
