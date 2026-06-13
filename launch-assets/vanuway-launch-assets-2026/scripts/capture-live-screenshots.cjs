const fs = require("node:fs");
const path = require("node:path");
const { chromium, devices } = require("playwright");

const root = path.resolve(__dirname, "..");
const repoRoot = path.resolve(root, "../..");
const env = readEnv(path.join(repoRoot, ".env.local"));
const outRoot = path.join(root, "captures");

const publicShots = [
  { name: "website-home-desktop", url: "https://vanuway.com", viewport: { width: 1440, height: 1100 }, fullPage: true },
  { name: "website-services-desktop", url: "https://vanuway.com/services", viewport: { width: 1440, height: 1200 }, fullPage: true },
  { name: "website-business-desktop", url: "https://vanuway.com/business", viewport: { width: 1440, height: 1200 }, fullPage: true },
  { name: "app-home-mobile", url: "https://app.vanuway.com", device: "iPhone 15", fullPage: true },
  { name: "app-services-mobile", url: "https://app.vanuway.com/services", device: "iPhone 15", fullPage: true },
  { name: "app-marketplace-mobile", url: "https://app.vanuway.com/marketplace", device: "iPhone 15", fullPage: true },
  { name: "app-hotels-mobile", url: "https://app.vanuway.com/hotels", device: "iPhone 15", fullPage: true },
  { name: "app-tours-mobile", url: "https://app.vanuway.com/tours", device: "iPhone 15", fullPage: true },
  { name: "app-ferry-mobile", url: "https://app.vanuway.com/ferry", device: "iPhone 15", fullPage: true },
  { name: "app-daily-mobile", url: "https://app.vanuway.com/daily", device: "iPhone 15", fullPage: true }
];

const authShots = [
  { name: "app-profile", url: "https://app.vanuway.com/profile" },
  { name: "app-messages", url: "https://app.vanuway.com/messages" },
  { name: "app-notifications", url: "https://app.vanuway.com/notifications" },
  { name: "app-partners", url: "https://app.vanuway.com/partners" },
  { name: "app-promote-business", url: "https://app.vanuway.com/promote-your-business" },
  { name: "app-admin-dashboard", url: "https://app.vanuway.com/admin" },
  { name: "app-admin-approvals", url: "https://app.vanuway.com/admin/approvals" },
  { name: "app-admin-messages", url: "https://app.vanuway.com/admin/messages" }
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  await capturePublic(browser);
  if (env.VANUWAY_TEST_EMAIL && env.VANUWAY_TEST_PASSWORD) {
    await captureAuthenticated(browser);
  }
  await browser.close();
}

async function capturePublic(browser) {
  const outDir = path.join(outRoot, "public");
  fs.mkdirSync(outDir, { recursive: true });
  const manifest = [];

  for (const shot of publicShots) {
    const context = await browser.newContext(shot.device ? devices[shot.device] : { viewport: shot.viewport });
    const page = await context.newPage();
    await preparePage(page);
    await page.goto(shot.url, { waitUntil: "networkidle", timeout: 60000 });
    await cleanPage(page);
    await page.screenshot({ path: path.join(outDir, `${shot.name}.png`), fullPage: shot.fullPage });
    manifest.push({ ...shot, file: path.join(outDir, `${shot.name}.png`), capturedAt: new Date().toISOString() });
    await context.close();
  }

  fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`Captured ${manifest.length} public screenshots to ${outDir}`);
}

async function captureAuthenticated(browser) {
  const outDir = path.join(outRoot, "authenticated");
  fs.mkdirSync(outDir, { recursive: true });
  const context = await browser.newContext(devices["iPhone 15"]);
  const page = await context.newPage();
  await preparePage(page);
  await page.goto("https://app.vanuway.com/login", { waitUntil: "networkidle", timeout: 60000 });
  await cleanPage(page);
  await page.getByLabel(/email/i).fill(env.VANUWAY_TEST_EMAIL);
  await page.getByLabel(/password/i).fill(env.VANUWAY_TEST_PASSWORD);
  await page.getByRole("button", { name: /sign in|log in|login/i }).click();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1200);

  const manifest = [];
  for (const shot of authShots) {
    await page.goto(shot.url, { waitUntil: "networkidle", timeout: 60000 });
    await cleanPage(page);
    await page.screenshot({ path: path.join(outDir, `${shot.name}.png`), fullPage: true });
    manifest.push({ ...shot, file: path.join(outDir, `${shot.name}.png`), capturedAt: new Date().toISOString() });
  }

  await context.close();
  fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`Captured ${manifest.length} authenticated screenshots to ${outDir}`);
}

async function preparePage(page) {
  await page.addInitScript(() => {
    localStorage.setItem("vanuway_pwa_install_dismissed", "true");
    localStorage.setItem("vanuway-install-prompt-dismissed", "true");
    sessionStorage.setItem("vanuway_pwa_install_dismissed", "true");
  });
}

async function cleanPage(page) {
  await page.waitForTimeout(1200);
  for (const name of [/got it/i, /not now/i, /dismiss/i, /close/i]) {
    const button = page.getByRole("button", { name }).first();
    try {
      if (await button.isVisible({ timeout: 700 })) await button.click();
    } catch {
      // Ignore absent prompt controls.
    }
  }
  await page.addStyleTag({
    content: `
      [data-testid*="install" i],
      [aria-label*="install" i],
      [class*="install" i],
      [class*="pwa" i] {
        display: none !important;
      }
    `
  }).catch(() => {});
  await page.evaluate(() => {
    for (const node of document.querySelectorAll("body *")) {
      const text = node.textContent || "";
      if (text.includes("Install VanuWay") || text.includes("Add to your home screen")) {
        let target = node;
        for (let i = 0; i < 4 && target.parentElement; i += 1) target = target.parentElement;
        target.remove();
      }
    }
  }).catch(() => {});
  await page.waitForTimeout(500);
}

function readEnv(file) {
  const result = {};
  if (!fs.existsSync(file)) return result;
  for (const line of fs.readFileSync(file, "utf8").split(/\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (!match) continue;
    result[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, "");
  }
  return result;
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
