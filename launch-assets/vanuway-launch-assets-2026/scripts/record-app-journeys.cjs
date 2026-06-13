const fs = require("node:fs");
const path = require("node:path");
const { chromium, devices } = require("playwright");

const root = path.resolve(__dirname, "..");
const repoRoot = path.resolve(root, "../..");
const env = readEnv(path.join(repoRoot, ".env.local"));
const appUrl = env.VANUWAY_APP_URL || "https://app.vanuway.com";
const outDir = path.join(root, "captures", "journeys");
const videoDir = path.join(outDir, "videos");
const stateFile = path.join(outDir, "storage-state.json");
const manifestFile = path.join(outDir, "manifest.json");
const mobileDevice = {
  ...devices["iPhone 15"],
  viewport: { width: 390, height: 844 }
};

const journeys = [
  {
    name: "ride-booking-flow",
    title: "Ride booking flow",
    run: async (page) => {
      await goto(page, "/rides/request");
      await settle(page);
      await clickAny(page, [
        () => page.getByRole("button", { name: /use my current location/i }).first(),
        () => placeButton(page, 0)
      ]);
      await settle(page);
      await clickAny(page, [() => placeButton(page, 1), () => placeButton(page, 0)]);
      await settle(page);
      await clickAny(page, [
        () => page.getByRole("button", { name: /car|suv|van|wheelchair/i }).first(),
        () => page.locator("button").filter({ hasText: /vanu|standard|premium|car/i }).first()
      ]);
      await page.waitForTimeout(1800);
      await slowScroll(page, 560);
      await page.waitForTimeout(1800);
    }
  },
  {
    name: "food-order-checkout-flow",
    title: "Food ordering flow",
    run: async (page) => {
      await goto(page, "/food");
      await slowScroll(page, 320);
      await clickAny(page, [
        () => page.locator("div.cursor-pointer").filter({ hasText: /min|closed|open|rating|restaurant/i }).first(),
        () => page.locator("div.cursor-pointer").first(),
        () => page.getByRole("link", { name: /restaurant|food|order/i }).first()
      ]);
      await settle(page);
      await slowScroll(page, 360);
      await clickAny(page, [
        () => page.getByRole("button", { name: /^add\b|add to cart|\+/i }).first(),
        () => page.locator("button").filter({ hasText: /add|cart|\+/i }).first()
      ]);
      await settle(page);
      await clickAny(page, [
        () => page.getByRole("button", { name: /checkout/i }).first(),
        () => page.getByRole("link", { name: /checkout/i }).first()
      ]);
      await settle(page);
      await fillText(page, /delivery address|address/i, "Port Vila Market, Vanuatu");
      await fillText(page, /phone|whatsapp/i, "+678 555 0101");
      await slowScroll(page, 760);
      await clickAny(page, [
        () => page.getByText(/card payment/i).first(),
        () => page.getByText(/cash on delivery/i).first()
      ]);
      await page.waitForTimeout(1800);
    }
  },
  {
    name: "marketplace-cart-payment-flow",
    title: "Marketplace cart to payment",
    run: async (page) => {
      await goto(page, "/marketplace");
      await slowScroll(page, 320);
      await clickFirstNavigatingElement(page, /vuv|buy|view|details|marketplace/i);
      await settle(page);
      await slowScroll(page, 360);
      await clickAny(page, [
        () => page.getByRole("button", { name: /buy now/i }).first(),
        () => page.getByRole("button", { name: /add to cart/i }).first()
      ]);
      await settle(page);
      if (!page.url().includes("/marketplace/cart")) await goto(page, "/marketplace/cart");
      await fillText(page, /full name|name/i, "Stephen Test");
      await fillText(page, /phone/i, "+678 555 0101");
      await fillText(page, /delivery address|address/i, "Port Vila, Vanuatu");
      await clickAny(page, [() => page.getByText(/delivery/i).first()]);
      await slowScroll(page, 820);
      await page.waitForTimeout(1800);
    }
  },
  {
    name: "hotel-booking-flow",
    title: "Hotel booking flow",
    run: async (page) => {
      await goto(page, "/hotels");
      await slowScroll(page, 420);
      await clickFirstNavigatingElement(page, /view|details|book|hotel|vuv|night/i);
      await settle(page);
      await slowScroll(page, 720);
      await clickAny(page, [
        () => page.getByRole("button", { name: /book now|reserve|select room/i }).first(),
        () => page.locator("button").filter({ hasText: /book/i }).first()
      ]);
      await settle(page);
      await fillDateInputs(page, ["2026-06-10", "2026-06-12"]);
      await fillText(page, /guest name|full name|name/i, "Stephen Test");
      await fillText(page, /email/i, "guest@example.com");
      await fillText(page, /phone/i, "+678 555 0101");
      await slowScroll(page, 540);
      await page.waitForTimeout(1800);
    }
  },
  {
    name: "tour-booking-flow",
    title: "Tour booking flow",
    run: async (page) => {
      await goto(page, "/tours");
      await slowScroll(page, 420);
      await clickFirstNavigatingElement(page, /view|details|book|tour|vuv/i);
      await settle(page);
      await slowScroll(page, 760);
      await clickAny(page, [() => page.getByRole("button", { name: /book now/i }).first()]);
      await settle(page);
      await clickAny(page, [
        () => page.getByRole("gridcell").filter({ hasText: /^1[8-9]$/ }).first(),
        () => page.locator("[role='gridcell'] button:not([disabled])").nth(8)
      ]);
      await clickAny(page, [() => page.getByRole("button", { name: /\d{1,2}:\d{2}|am|pm/i }).first()]);
      await clickAny(page, [() => page.getByRole("button", { name: /^\+$/i }).first()]);
      await page.waitForTimeout(2000);
    }
  },
  {
    name: "daily-tools-flow",
    title: "VanuWay Daily tools",
    run: async (page) => {
      await goto(page, "/daily");
      await settle(page);
      await slowScroll(page, 520);
      await slowScroll(page, 820);
      await slowScroll(page, 1180);
      await page.waitForTimeout(1800);
    }
  },
  {
    name: "travel-routes-flow",
    title: "Ferry and flight travel flow",
    run: async (page) => {
      await goto(page, "/ferry");
      await settle(page);
      await slowScroll(page, 720);
      await goto(page, "/flights/arrivals");
      await settle(page);
      await slowScroll(page, 660);
      await page.waitForTimeout(1500);
    }
  },
  {
    name: "bislama-learning-flow",
    title: "Bislama learning flow",
    run: async (page) => {
      await goto(page, "/bislama");
      await settle(page);
      await slowScroll(page, 420);
      await clickFirstNavigatingElement(page, /lesson|start|topic|learn|vocabulary/i);
      await settle(page);
      await slowScroll(page, 680);
      await page.waitForTimeout(1600);
    }
  },
  {
    name: "community-services-flow",
    title: "Health, jobs, property, and providers flow",
    run: async (page) => {
      await goto(page, "/health");
      await settle(page);
      await slowScroll(page, 520);
      await goto(page, "/jobs");
      await settle(page);
      await slowScroll(page, 520);
      await goto(page, "/realestate");
      await settle(page);
      await slowScroll(page, 520);
      await goto(page, "/providers");
      await settle(page);
      await slowScroll(page, 520);
      await page.waitForTimeout(1300);
    }
  },
  {
    name: "business-partner-flow",
    title: "Business partner and promotion flow",
    run: async (page) => {
      await goto(page, "/partners");
      await settle(page);
      await slowScroll(page, 720);
      await goto(page, "/promote-your-business");
      await settle(page);
      await slowScroll(page, 880);
      await page.waitForTimeout(1600);
    }
  }
];

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});

async function main() {
  if (!env.VANUWAY_TEST_EMAIL || !env.VANUWAY_TEST_PASSWORD) {
    throw new Error("Missing VANUWAY_TEST_EMAIL or VANUWAY_TEST_PASSWORD in .env.local");
  }

  fs.mkdirSync(videoDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  console.log("Logging into the VanuWay test account...");
  await saveStorageState(browser);
  console.log("Login ready. Recording mobile app journeys...");

  const manifest = [];
  for (const journey of journeys) {
    const started = Date.now();
    const finalVideo = path.join(videoDir, `${journey.name}.webm`);
    if (fs.existsSync(finalVideo) && !process.argv.includes("--overwrite")) {
      manifest.push({
        name: journey.name,
        title: journey.title,
        status: "existing",
        error: null,
        file: finalVideo,
        durationMs: 0,
        capturedAt: new Date().toISOString()
      });
      console.log(`SKIP ${journey.name} -> ${finalVideo}`);
      continue;
    }
    console.log(`START ${journey.name}`);
    const context = await browser.newContext({
      ...mobileDevice,
      storageState: stateFile,
      recordVideo: { dir: videoDir, size: { width: 390, height: 844 } }
    });
    const page = await context.newPage();
    await preparePage(page);
    let status = "ok";
    let error = null;
    try {
      await journey.run(page);
      await cleanPage(page);
    } catch (caught) {
      status = "partial";
      error = caught.message;
      console.warn(`${journey.name}: ${caught.message}`);
      await page.waitForTimeout(1200).catch(() => {});
    }
    const video = page.video();
    await context.close();
    const source = await video.path();
    fs.renameSync(source, finalVideo);
    manifest.push({
      name: journey.name,
      title: journey.title,
      status,
      error,
      file: finalVideo,
      durationMs: Date.now() - started,
      capturedAt: new Date().toISOString()
    });
    console.log(`${status.toUpperCase()} ${journey.name} -> ${finalVideo}`);
  }

  await browser.close();
  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
  console.log(`Recorded ${manifest.length} app journeys to ${videoDir}`);
}

async function saveStorageState(browser) {
  fs.mkdirSync(outDir, { recursive: true });
  const context = await browser.newContext(mobileDevice);
  const page = await context.newPage();
  await preparePage(page);
  await page.goto(`${appUrl}/login`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await cleanPage(page);
  await page.getByLabel(/email/i).fill(env.VANUWAY_TEST_EMAIL);
  await page.getByLabel(/password/i).fill(env.VANUWAY_TEST_PASSWORD);
  await page.getByRole("button", { name: /sign in|log in|login/i }).click();
  await page.waitForLoadState("networkidle", { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(1800);
  if (page.url().includes("/login")) throw new Error("Test account login did not leave the login page");
  await context.storageState({ path: stateFile });
  await context.close();
}

async function goto(page, route) {
  const url = route.startsWith("http") ? route : `${appUrl}${route}`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForLoadState("networkidle", { timeout: 60000 }).catch(() => {});
  await cleanPage(page);
}

async function preparePage(page) {
  await page.addInitScript(() => {
    localStorage.setItem("vanuway_pwa_install_dismissed", "true");
    localStorage.setItem("vanuway-install-prompt-dismissed", "true");
    sessionStorage.setItem("vanuway_pwa_install_dismissed", "true");
  });
}

async function cleanPage(page) {
  await page.waitForTimeout(800);
  await page.addStyleTag({
    content: `
      [data-testid*="install" i],
      [aria-label*="install" i],
      [class*="install" i],
      [class*="pwa" i],
      [class*="support" i],
      iframe[src*="chat" i] {
        display: none !important;
      }
    `
  }).catch(() => {});
  await page.evaluate(() => {
    for (const node of document.querySelectorAll("body *")) {
      const text = node.textContent || "";
      if (text.includes("VanuWay Help")) {
        let target = node;
        for (let i = 0; i < 3 && target.parentElement && target.parentElement !== document.body; i += 1) {
          target = target.parentElement;
        }
        if (target !== document.body && target.id !== "root") target.remove();
      }
    }
  }).catch(() => {});
  for (const name of [/got it/i, /not now/i, /dismiss/i, /close/i, /maybe later/i]) {
    const button = page.getByRole("button", { name }).first();
    try {
      if (await button.isVisible({ timeout: 400 })) await button.click();
    } catch {
      // Absent prompt controls are fine.
    }
  }
}

async function settle(page) {
  await cleanPage(page);
  await page.waitForTimeout(1200);
}

async function clickAny(page, factories) {
  let lastError = null;
  for (const factory of factories) {
    const locator = factory();
    try {
      if (await locator.isVisible({ timeout: 1200 })) {
        await locator.scrollIntoViewIfNeeded().catch(() => {});
        await locator.click({ timeout: 5000 });
        await page.waitForTimeout(900);
        return true;
      }
    } catch (error) {
      lastError = error;
    }
  }
  if (lastError) throw lastError;
  throw new Error("No clickable candidate was visible");
}

function placeButton(page, index) {
  return page.locator("button").filter({ hasText: /airport|market|port|cruise|vila|beach|resort|hotel|terminal/i }).nth(index);
}

async function clickFirstNavigatingElement(page, textPattern) {
  const before = page.url();
  const candidates = [
    page.getByRole("button", { name: textPattern }).first(),
    page.getByRole("link", { name: textPattern }).first(),
    page.locator("[role='button'], a, button, [class*='cursor-pointer']").filter({ hasText: textPattern }).first(),
    page.locator("[class*='cursor-pointer']").first(),
    page.locator("a[href]").first()
  ];

  for (const locator of candidates) {
    try {
      if (await locator.isVisible({ timeout: 1300 })) {
        await locator.scrollIntoViewIfNeeded().catch(() => {});
        await locator.click({ timeout: 6000 });
        await page.waitForTimeout(1200);
        await page.waitForLoadState("networkidle", { timeout: 12000 }).catch(() => {});
        if (page.url() !== before || true) return;
      }
    } catch {
      // Try the next selector.
    }
  }
}

async function slowScroll(page, amount) {
  const steps = 4;
  for (let index = 0; index < steps; index += 1) {
    await page.mouse.wheel(0, Math.round(amount / steps));
    await page.waitForTimeout(360);
  }
}

async function fillText(page, labelPattern, value) {
  const candidates = [
    page.getByLabel(labelPattern).first(),
    page.getByPlaceholder(labelPattern).first(),
    page.locator("input, textarea").filter({ hasText: labelPattern }).first()
  ];
  for (const locator of candidates) {
    try {
      if (await locator.isVisible({ timeout: 800 })) {
        await locator.scrollIntoViewIfNeeded().catch(() => {});
        await locator.fill(value);
        await page.waitForTimeout(350);
        return true;
      }
    } catch {
      // Try the next field.
    }
  }
  return false;
}

async function fillDateInputs(page, values) {
  const inputs = page.locator("input[type='date']");
  const count = await inputs.count().catch(() => 0);
  for (let index = 0; index < Math.min(count, values.length); index += 1) {
    await inputs.nth(index).fill(values[index]).catch(() => {});
    await page.waitForTimeout(250);
  }
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
