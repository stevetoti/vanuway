# VanuWay Launch Assets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a complete VanuWay launch marketing kit with real website/app captures, flagship and cutdown videos, static flyers/social graphics, phone mockups, and ad scripts.

**Architecture:** Create a self-contained `marketing/launch-vanuway-2026/` workspace with source content, scripts, captured media, and exported deliverables. Capture scripts gather real screenshots/recordings from `vanuway.com` and `app.vanuway.com`; render scripts compose branded graphics and videos using the approved Connected Islands visual system. Public captures can run immediately, while authenticated dashboard captures wait for a temporary test account.

**Tech Stack:** Node.js ESM scripts, Playwright for website/app capture, Sharp/SVG for static graphics, ffmpeg for video assembly, Markdown for scripts/copy/storyboards.

---

## File Structure

- Create `marketing/launch-vanuway-2026/README.md` to explain how to regenerate every asset.
- Create `marketing/launch-vanuway-2026/package.json` for scoped capture/render commands.
- Create `marketing/launch-vanuway-2026/content/services.json` as the canonical service list for scripts and graphics.
- Create `marketing/launch-vanuway-2026/content/storyboard.md` for the flagship and cutdown video structure.
- Create `marketing/launch-vanuway-2026/content/ad-copy.md` for Facebook, Instagram, YouTube, and vendor recruitment copy.
- Create `marketing/launch-vanuway-2026/scripts/capture-public.mjs` for public website/app screenshots.
- Create `marketing/launch-vanuway-2026/scripts/capture-authenticated.mjs` for login-protected dashboard screenshots.
- Create `marketing/launch-vanuway-2026/scripts/render-statics.mjs` for flyers, social graphics, and mockups.
- Create `marketing/launch-vanuway-2026/scripts/render-videos.mjs` for flagship and cutdown video exports.
- Create `marketing/launch-vanuway-2026/assets/brand/` for copied local logo files and palette metadata.
- Create `marketing/launch-vanuway-2026/captures/` for generated screenshots and clips.
- Create `marketing/launch-vanuway-2026/exports/` for final PNG, PDF, and MP4 outputs.
- Modify `memory/changelog.md` after assets are produced.
- Modify `memory/todo.md` only if production reveals capture or login/data gaps.

## Task 1: Scaffold Launch Workspace

**Files:**
- Create: `marketing/launch-vanuway-2026/README.md`
- Create: `marketing/launch-vanuway-2026/package.json`
- Create: `marketing/launch-vanuway-2026/assets/brand/palette.json`
- Create directories: `marketing/launch-vanuway-2026/content`, `marketing/launch-vanuway-2026/scripts`, `marketing/launch-vanuway-2026/captures/public`, `marketing/launch-vanuway-2026/captures/authenticated`, `marketing/launch-vanuway-2026/exports/statics`, `marketing/launch-vanuway-2026/exports/videos`

- [ ] **Step 1: Create directories**

Run:

```bash
mkdir -p marketing/launch-vanuway-2026/{content,scripts,assets/brand,captures/public,captures/authenticated,exports/statics,exports/videos}
```

Expected: directories exist.

- [ ] **Step 2: Add package scripts**

Create `marketing/launch-vanuway-2026/package.json`:

```json
{
  "name": "vanuway-launch-assets-2026",
  "private": true,
  "type": "module",
  "scripts": {
    "capture:public": "node scripts/capture-public.mjs",
    "capture:auth": "node scripts/capture-authenticated.mjs",
    "render:statics": "node scripts/render-statics.mjs",
    "render:videos": "node scripts/render-videos.mjs",
    "render:all": "npm run capture:public && npm run render:statics && npm run render:videos"
  },
  "devDependencies": {
    "playwright": "^1.56.0",
    "sharp": "^0.34.5"
  }
}
```

- [ ] **Step 3: Add palette metadata**

Create `marketing/launch-vanuway-2026/assets/brand/palette.json`:

```json
{
  "name": "VanuWay Connected Islands",
  "colors": {
    "navy": "#233C6F",
    "orange": "#EF5E33",
    "black": "#000000",
    "white": "#FFFFFF"
  },
  "usage": {
    "navy": "Primary trust background and headline color",
    "orange": "CTA, launch badges, transition accents",
    "black": "Premium contrast and closing frames",
    "white": "Readable space around screenshots and long service lists"
  }
}
```

- [ ] **Step 4: Add workspace README**

Create `marketing/launch-vanuway-2026/README.md`:

```markdown
# VanuWay Launch Assets 2026

Approved direction: Connected Islands, refined.

This workspace produces launch materials for VanuWay:

- Flagship 90-120s landscape launch video
- 60s landscape cutdown
- 60s vertical Reel/Shorts cutdown
- 15s paid social cutdown
- 6s bumper
- A4 flyer, square feed ad, story cover, vendor flyer, service overview, and phone mockups
- Facebook, Instagram, YouTube, and vendor recruitment copy

## Commands

```bash
npm install
npm run capture:public
npm run capture:auth
npm run render:statics
npm run render:videos
```

`capture:auth` requires:

```bash
VANUWAY_TEST_EMAIL="temporary@example.com" VANUWAY_TEST_PASSWORD="temporary-password" npm run capture:auth
```

Generated files are written to `captures/` and `exports/`.
```

- [ ] **Step 5: Install launch dependencies**

Run:

```bash
cd marketing/launch-vanuway-2026 && npm install
```

Expected: `node_modules`, `package-lock.json`, Playwright, and Sharp are installed.

- [ ] **Step 6: Commit scaffold**

Run:

```bash
git add marketing/launch-vanuway-2026
git commit -m "feat: scaffold VanuWay launch asset workspace"
```

Expected: commit succeeds with only launch workspace files.

## Task 2: Create Canonical Content

**Files:**
- Create: `marketing/launch-vanuway-2026/content/services.json`
- Create: `marketing/launch-vanuway-2026/content/storyboard.md`
- Create: `marketing/launch-vanuway-2026/content/ad-copy.md`

- [ ] **Step 1: Add service list**

Create `marketing/launch-vanuway-2026/content/services.json`:

```json
{
  "campaignLine": "One app for everyday Vanuatu.",
  "supportingLine": "Book rides, order food, find hotels and tours, shop local, list property, get alerts, learn Bislama, find jobs and more.",
  "groups": [
    {
      "title": "Move and deliver",
      "services": ["Ride-hailing", "Package delivery"]
    },
    {
      "title": "Eat and shop",
      "services": ["Food delivery", "Shop delivery", "Marketplace"]
    },
    {
      "title": "Travel and stay",
      "services": ["Hotels and accommodation", "Tours and attractions", "Ferry and flights"]
    },
    {
      "title": "Community and safety",
      "services": ["Learn Bislama", "Emergency alerts", "Community events", "Service providers"]
    },
    {
      "title": "Property, health, and work",
      "services": ["Real estate", "VanuHealth", "VanuJobs"]
    },
    {
      "title": "Grow your business",
      "services": ["Partner and vendor dashboards", "Marketplace seller tools", "Business promotion"]
    }
  ]
}
```

- [ ] **Step 2: Add flagship storyboard**

Create `marketing/launch-vanuway-2026/content/storyboard.md`:

```markdown
# VanuWay Launch Storyboard

## Flagship Video: 90-120 seconds

### 0-8s: Brand Opener
Visual: VanuWay logo on navy/black premium background with orange launch motion.
VO: "Vanuatu, meet VanuWay. One app for everyday Vanuatu."
Text: One app for everyday Vanuatu.

### 8-28s: Move, Deliver, Eat, Shop
Visual: app home, ride hub, package delivery, food, shop delivery, marketplace.
VO: "Book a ride, send a package, order food, shop from local stores, and buy or sell in the marketplace."
Text: Rides. Delivery. Food. Shopping. Marketplace.

### 28-48s: Travel And Stay
Visual: hotels, tours, ferry/flights, public website services.
VO: "Find hotels, discover tours and attractions, and plan ferry or flight travel between islands."
Text: Hotels. Tours. Ferry. Flights.

### 48-68s: Community And Safety
Visual: Bislama learning, emergency alerts, events, service providers.
VO: "Learn Bislama, stay informed with emergency alerts, discover community events, and connect with local service providers."
Text: Bislama. Alerts. Events. Providers.

### 68-88s: Property, Health, Work
Visual: real estate, VanuHealth, VanuJobs.
VO: "Browse real estate, access health services, find jobs, or hire local talent."
Text: Property. Health. Jobs.

### 88-108s: Business Growth
Visual: partner/vendor dashboard, listings, orders, messages, promotion page.
VO: "For businesses, VanuWay helps you reach customers, manage listings, receive messages, and grow online."
Text: Built for customers and businesses.

### 108-120s: Close
Visual: logo, phone mockups, website and app URLs.
VO: "VanuWay is launching now. Visit vanuway.com or open app.vanuway.com."
Text: Visit vanuway.com | Open app.vanuway.com

## Cutdowns

### 60s Landscape
Use sections 0-8, 8-23, 28-43, 48-63, 68-78, 88-100, and 108-120.

### 60s Vertical
Use the same narrative as the 60s landscape version, with phone-first framing and larger captions.

### 15s Paid Social
VO: "VanuWay is launching. Book rides, order food, shop local, find hotels, tours, jobs, health services, emergency alerts and more, all in one app for Vanuatu."

### 6s Bumper
VO: "VanuWay. One app for everyday Vanuatu."
```

- [ ] **Step 3: Add ad copy**

Create `marketing/launch-vanuway-2026/content/ad-copy.md`:

```markdown
# VanuWay Launch Ad Copy

## Facebook Launch Post

Vanuatu, meet VanuWay.

One app for everyday life across Vanuatu: ride-hailing, package delivery, food delivery, shop delivery, marketplace, hotels, tours, ferry and flights, Learn Bislama, emergency alerts, community events, service providers, real estate, VanuHealth, VanuJobs, and tools for local businesses.

Visit https://vanuway.com or open https://app.vanuway.com.

## Instagram Caption

VanuWay is launching.

Rides, food, shopping, marketplace, hotels, tours, ferry and flights, Bislama learning, emergency alerts, events, service providers, real estate, health, jobs, and business tools in one app for Vanuatu.

One app for everyday Vanuatu.

## YouTube Description

VanuWay is Vanuatu's all-in-one digital super app, built to connect people, businesses, and services across the islands.

Use VanuWay for ride-hailing, package delivery, food delivery, shop delivery, marketplace, hotels, tours, ferry and flights, Learn Bislama, emergency alerts, community events, service providers, real estate, VanuHealth, VanuJobs, and partner dashboards for local businesses.

Visit https://vanuway.com or open https://app.vanuway.com.

## Vendor Recruitment Copy

Grow your business with VanuWay.

List your products, services, hotels, tours, events, ferry routes, properties, jobs, health services, and more. Reach customers across Vanuatu from one platform, manage messages, and promote your business online.

Join VanuWay as a partner today.
```

- [ ] **Step 4: Commit content**

Run:

```bash
git add marketing/launch-vanuway-2026/content
git commit -m "docs: add VanuWay launch storyboard and copy"
```

Expected: commit succeeds with content files.

## Task 3: Build Public Capture Script

**Files:**
- Create: `marketing/launch-vanuway-2026/scripts/capture-public.mjs`

- [ ] **Step 1: Write public capture script**

Create `marketing/launch-vanuway-2026/scripts/capture-public.mjs`:

```js
import { chromium, devices } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const outDir = path.resolve("captures/public");

const shots = [
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

await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const manifest = [];

for (const shot of shots) {
  const contextOptions = shot.device ? devices[shot.device] : { viewport: shot.viewport };
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  await page.goto(shot.url, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1500);
  const file = path.join(outDir, `${shot.name}.png`);
  await page.screenshot({ path: file, fullPage: shot.fullPage });
  manifest.push({ ...shot, file, capturedAt: new Date().toISOString() });
  await context.close();
}

await browser.close();
await fs.writeFile(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`Captured ${manifest.length} public screenshots to ${outDir}`);
```

- [ ] **Step 2: Run public capture**

Run:

```bash
cd marketing/launch-vanuway-2026 && npm run capture:public
```

Expected: screenshots are written to `marketing/launch-vanuway-2026/captures/public/`.

- [ ] **Step 3: Verify public captures**

Run:

```bash
find marketing/launch-vanuway-2026/captures/public -maxdepth 1 -name '*.png' -print
```

Expected: at least 8 PNG files.

- [ ] **Step 4: Commit capture script**

Run:

```bash
git add marketing/launch-vanuway-2026/scripts/capture-public.mjs marketing/launch-vanuway-2026/captures/public
git commit -m "feat: capture VanuWay public launch screenshots"
```

Expected: commit succeeds with script and reviewed captures.

## Task 4: Build Authenticated Capture Script

**Files:**
- Create: `marketing/launch-vanuway-2026/scripts/capture-authenticated.mjs`

- [ ] **Step 1: Write authenticated capture script**

Create `marketing/launch-vanuway-2026/scripts/capture-authenticated.mjs`:

```js
import { chromium, devices } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const email = process.env.VANUWAY_TEST_EMAIL;
const password = process.env.VANUWAY_TEST_PASSWORD;

if (!email || !password) {
  throw new Error("Set VANUWAY_TEST_EMAIL and VANUWAY_TEST_PASSWORD before running capture:auth.");
}

const outDir = path.resolve("captures/authenticated");
const device = devices["iPhone 15"];

const shots = [
  { name: "app-profile", url: "https://app.vanuway.com/profile" },
  { name: "app-messages", url: "https://app.vanuway.com/messages" },
  { name: "app-notifications", url: "https://app.vanuway.com/notifications" },
  { name: "app-partners", url: "https://app.vanuway.com/partners" },
  { name: "app-promote-business", url: "https://app.vanuway.com/promote-your-business" },
  { name: "app-admin-dashboard", url: "https://app.vanuway.com/admin" },
  { name: "app-admin-approvals", url: "https://app.vanuway.com/admin/approvals" },
  { name: "app-admin-messages", url: "https://app.vanuway.com/admin/messages" }
];

await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext(device);
const page = await context.newPage();

await page.goto("https://app.vanuway.com/login", { waitUntil: "networkidle", timeout: 60000 });
await page.getByLabel(/email/i).fill(email);
await page.getByLabel(/password/i).fill(password);
await page.getByRole("button", { name: /sign in|log in|login/i }).click();
await page.waitForLoadState("networkidle");
await page.waitForTimeout(2000);

const manifest = [];

for (const shot of shots) {
  await page.goto(shot.url, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1500);
  const file = path.join(outDir, `${shot.name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  manifest.push({ ...shot, file, capturedAt: new Date().toISOString() });
}

await browser.close();
await fs.writeFile(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`Captured ${manifest.length} authenticated screenshots to ${outDir}`);
```

- [ ] **Step 2: Run authenticated capture after receiving test login**

Run:

```bash
cd marketing/launch-vanuway-2026 && VANUWAY_TEST_EMAIL="provided-email" VANUWAY_TEST_PASSWORD="provided-password" npm run capture:auth
```

Expected: authenticated screenshots are written to `marketing/launch-vanuway-2026/captures/authenticated/`.

- [ ] **Step 3: Record gaps**

If routes are unavailable because the account lacks a role, write `marketing/launch-vanuway-2026/captures/authenticated/gaps.md`:

```markdown
# Authenticated Capture Gaps

- Route:
- Expected role:
- Result:
- Needed access or demo data:
```

- [ ] **Step 4: Commit authenticated capture script**

Run:

```bash
git add marketing/launch-vanuway-2026/scripts/capture-authenticated.mjs marketing/launch-vanuway-2026/captures/authenticated
git commit -m "feat: capture authenticated VanuWay launch screenshots"
```

Expected: commit succeeds with script and reviewed captures.

## Task 5: Render Static Launch Graphics

**Files:**
- Create: `marketing/launch-vanuway-2026/scripts/render-statics.mjs`
- Generate: `marketing/launch-vanuway-2026/exports/statics/*.png`
- Generate: `marketing/launch-vanuway-2026/exports/statics/*.pdf`

- [ ] **Step 1: Write static renderer**

Create `marketing/launch-vanuway-2026/scripts/render-statics.mjs` with SVG templates rendered through Sharp. It must export:

```js
const outputs = [
  { name: "vanuway-launch-flyer-a4", width: 2480, height: 3508 },
  { name: "vanuway-feed-square", width: 1080, height: 1080 },
  { name: "vanuway-story-cover", width: 1080, height: 1920 },
  { name: "vanuway-vendor-flyer-a4", width: 2480, height: 3508 },
  { name: "vanuway-service-overview", width: 1600, height: 2000 }
];
```

Each template must include:

```js
const headline = "One app for everyday Vanuatu.";
const services = [
  "Rides", "Delivery", "Food", "Shopping", "Marketplace",
  "Hotels", "Tours", "Ferry", "Flights", "Bislama",
  "Emergency", "Events", "Providers", "Real Estate",
  "VanuHealth", "VanuJobs"
];
const cta = "Visit vanuway.com | Open app.vanuway.com";
```

- [ ] **Step 2: Run static renderer**

Run:

```bash
cd marketing/launch-vanuway-2026 && npm run render:statics
```

Expected: PNG and PDF exports appear in `exports/statics/`.

- [ ] **Step 3: Verify dimensions**

Run:

```bash
node -e "const fs=require('fs'); const path='marketing/launch-vanuway-2026/exports/statics'; console.log(fs.readdirSync(path).filter(f=>f.endsWith('.png')))"
```

Expected: five PNG files are listed.

- [ ] **Step 4: Commit static assets**

Run:

```bash
git add marketing/launch-vanuway-2026/scripts/render-statics.mjs marketing/launch-vanuway-2026/exports/statics
git commit -m "feat: render VanuWay launch static graphics"
```

Expected: commit succeeds with renderer and static exports.

## Task 6: Render Launch Videos

**Files:**
- Create: `marketing/launch-vanuway-2026/scripts/render-videos.mjs`
- Generate: `marketing/launch-vanuway-2026/exports/videos/*.mp4`

- [ ] **Step 1: Write video renderer**

Create `marketing/launch-vanuway-2026/scripts/render-videos.mjs`. It should:

- Build branded title cards as PNG frames with Sharp.
- Use captured screenshots from `captures/public` and `captures/authenticated`.
- Use `ffmpeg` to create MP4 videos.
- Export:
  - `vanuway-flagship-landscape.mp4`
  - `vanuway-60s-landscape.mp4`
  - `vanuway-60s-reel.mp4`
  - `vanuway-15s-social.mp4`
  - `vanuway-6s-bumper.mp4`

The script must warn but continue if authenticated captures are missing:

```js
console.warn("Authenticated captures missing. Rendering public-footage draft; rerun after test login for final dashboard footage.");
```

- [ ] **Step 2: Run video renderer**

Run:

```bash
cd marketing/launch-vanuway-2026 && npm run render:videos
```

Expected: MP4 exports appear in `exports/videos/`.

- [ ] **Step 3: Verify video metadata**

Run:

```bash
ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 marketing/launch-vanuway-2026/exports/videos/vanuway-flagship-landscape.mp4
```

Expected: duration is greater than 60 seconds.

- [ ] **Step 4: Commit videos**

Run:

```bash
git add marketing/launch-vanuway-2026/scripts/render-videos.mjs marketing/launch-vanuway-2026/exports/videos
git commit -m "feat: render VanuWay launch videos"
```

Expected: commit succeeds with renderer and videos.

## Task 7: Update Memory And Final QA

**Files:**
- Modify: `memory/changelog.md`
- Modify: `memory/todo.md`

- [ ] **Step 1: Update changelog**

Add a top entry to `memory/changelog.md`:

```markdown
## 2026-05-02 — VanuWay launch marketing assets

- Approved the Connected Islands launch direction.
- Created the launch asset production workspace.
- Captured public website/app screenshots.
- Produced launch flyers, social graphics, video cutdowns, and ad scripts.
- Noted any authenticated dashboard capture gaps in the launch workspace.
```

- [ ] **Step 2: Update todo only if needed**

If authenticated capture is incomplete, add to `memory/todo.md`:

```markdown
- [ ] Provide a temporary VanuWay demo account with admin/vendor dashboard access for final launch video dashboard footage.
```

- [ ] **Step 3: Final artifact inventory**

Run:

```bash
find marketing/launch-vanuway-2026/exports -type f | sort
```

Expected: flyer/social PNG/PDF files and MP4 files are listed.

- [ ] **Step 4: Commit memory updates**

Run:

```bash
git add memory/changelog.md memory/todo.md
git commit -m "docs: record launch asset production"
```

Expected: commit succeeds with memory updates.
