import { chromium, type Page } from "@playwright/test";

const BASE = "http://localhost:3000";
const SHOTS = "/tmp/claude-1000/-home-hugoidle-projects/590687f1-ea41-4f45-a1f6-ab362cbf9c77/scratchpad";

async function guestIntoGame(page: Page) {
  await page.goto(`${BASE}/games/block-ops`, { waitUntil: "domcontentloaded" });
  const guestBtn = page.getByRole("button", { name: /play as guest/i });
  const createBtn = page.getByRole("button", { name: /create room/i });
  await Promise.race([
    guestBtn.waitFor({ timeout: 20000 }).catch(() => {}),
    createBtn.waitFor({ timeout: 20000 }).catch(() => {}),
  ]);
  if (await guestBtn.isVisible().catch(() => false)) {
    await guestBtn.click();
    await createBtn.waitFor({ timeout: 20000 });
  }
}

async function main() {
  const browser = await chromium.launch();

  // 1) Hydration-warning attribution: does an untouched route emit it too?
  const cctx = await browser.newContext();
  const control = await cctx.newPage();
  let controlErr = 0;
  control.on("console", (m) => {
    if (m.type() === "error" && /hydrat/i.test(m.text())) controlErr++;
  });
  await control.goto(`${BASE}/brain-training`, { waitUntil: "networkidle" });
  await control.waitForTimeout(1500);
  console.log("hydration errors on untouched /brain-training:", controlErr);
  await cctx.close();

  // 2) Mobile layout after fix
  const mctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const mp = await mctx.newPage();
  await guestIntoGame(mp);
  await mp.getByRole("button", { name: /practice vs bots/i }).click();
  await mp.waitForSelector("canvas", { timeout: 15000 });
  await mp.waitForTimeout(4800);
  await mp.screenshot({ path: `${SHOTS}/bo-mobile-layout2.png` });
  await mctx.close();

  // 3) Desktop: pointer lock + aim + fire
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await guestIntoGame(page);
  await page.getByRole("button", { name: /practice vs bots/i }).click();
  await page.waitForSelector("canvas", { timeout: 15000 });
  await page.waitForTimeout(4800);
  await page.getByRole("button", { name: /click to aim/i }).click();
  await page.waitForTimeout(600);
  const locked = await page.evaluate(() => document.pointerLockElement?.tagName ?? null);
  console.log("pointer locked to:", locked);
  if (locked === "CANVAS") {
    for (let i = 0; i < 10; i++) await page.mouse.move(640 + i * 8, 400, { steps: 2 });
    await page.mouse.down();
    await page.waitForTimeout(900);
    await page.mouse.up();
    const probe = await page.evaluate(() => {
      const e = (window as unknown as Record<string, unknown>).__blockOps as Record<string, unknown>;
      return { mag: (e.mags as Record<string, number>)[e.weapon as string], yaw: e.yaw };
    });
    console.log("after locked fire:", JSON.stringify(probe));
  }
  await page.screenshot({ path: `${SHOTS}/bo-desktop-locked.png` });
  await ctx.close();

  await browser.close();
  console.log("done");
}

main().catch((e) => {
  console.error("VERIFY FAILED:", e);
  process.exit(1);
});
