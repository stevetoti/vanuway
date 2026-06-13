const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const brandDir = path.join(root, "assets", "brand");
const publicDir = path.join(root, "captures", "public");
const authDir = path.join(root, "captures", "authenticated");
const journeyVideoDir = path.join(root, "captures", "journeys", "videos");
const rawDir = path.join(root, "higgsfield", "raw-clips");
const finalDir = path.join(root, "higgsfield", "final-edit");
const overlayDir = path.join(finalDir, "documentary-overlays");
const segmentDir = path.join(finalDir, "documentary-segments");
const journeyFrameDir = path.join(finalDir, "documentary-journey-frames");
const voiceDir = path.join(root, "higgsfield", "voiceover");

const FPS = 24;
const SCENE_SECONDS = 8.25;
const W = 1920;
const H = 1080;
const phone = { x: 1264, y: 92, w: 416, h: 848, screenX: 1288, screenY: 126, screenW: 368, screenH: 770 };
const palette = { navy: "#233C6F", orange: "#EF5E33", white: "#FFFFFF", black: "#000000" };

const scenes = [
  scene("A Digital Home for Vanuatu", "One app built for movement, trade, tourism, and opportunity.", ["VanuWay", "Vanuatu"], "doc-01-island-life-opener.mp4", "app-home-mobile", [0, 0.08]),
  scene("For Ni-Vanuatu Families", "Everyday services for families, workers, vendors, and communities.", ["Local Life", "Community"], "doc-02-ni-vanuatu-family-daily-life.mp4", "app-daily-mobile", [0, 0.18], "daily-tools-flow", 0),
  scene("Ride-Hailing", "Book rides now, pre-book transfers, and move around with confidence.", ["Rides", "Transfers"], "doc-03-rides-package-delivery.mp4", "app-services-mobile", [0.02, 0.12], "ride-booking-flow", 75),
  scene("Package Delivery", "Send parcels with local drivers and keep daily business moving.", ["Delivery", "Couriers"], "doc-03-rides-package-delivery.mp4", "app-services-mobile", [0.08, 0.18]),
  scene("Food Delivery", "Order meals from local restaurants and support Vanuatu food businesses.", ["Food", "Restaurants"], "doc-04-food-shopping-marketplace.mp4", "app-services-mobile", [0.20, 0.29]),
  scene("Shop Delivery", "Groceries, essentials, and local products from nearby shops.", ["Shops", "Essentials"], "doc-04-food-shopping-marketplace.mp4", "app-services-mobile", [0.27, 0.35]),
  scene("Marketplace", "Buy and sell locally with in-app chat, cart, orders, and delivery or pickup.", ["Marketplace", "Orders"], "doc-04-food-shopping-marketplace.mp4", "app-marketplace-mobile", [0, 0.22], "marketplace-cart-payment-flow", 0),
  scene("Cruise Visitors", "From the port, visitors can find safe transport, tours, shops, and events.", ["Cruise", "Visitors"], "doc-05-cruise-visitors-arrive.mp4", "app-tours-mobile", [0, 0.18]),
  scene("Tours & Attractions", "Book experiences, discover Vanuatu, and connect with local operators.", ["Tours", "Attractions"], "doc-06-tours-attractions.mp4", "app-tours-mobile", [0.06, 0.34], "tour-booking-flow", 0),
  scene("Learn Bislama", "Useful lessons, vocabulary, quizzes, and progress for deeper connection.", ["Bislama", "Learning"], "doc-06-tours-attractions.mp4", "app-services-mobile", [0.50, 0.60], "bislama-learning-flow", 0),
  scene("Flight Arrivals", "Travellers can check arrivals and connect the airport to the journey.", ["Flights", "Airport"], "doc-07-airport-travellers.mp4", "app-ferry-mobile", [0.48, 0.72], "travel-routes-flow", 5),
  scene("Hotels & Accommodation", "Find stays, guesthouses, and hotel options across Vanuatu.", ["Hotels", "Stays"], "doc-08-hotels-stays.mp4", "app-hotels-mobile", [0, 0.28], "hotel-booking-flow", 0),
  scene("Ferry & Inter-Island Travel", "Plan ferry routes and domestic flight options between islands.", ["Ferry", "Islands"], "doc-09-ferry-inter-island-travel.mp4", "app-ferry-mobile", [0.08, 0.44], "travel-routes-flow", 0),
  scene("Real Estate", "For expats and locals, browse homes, land, rentals, and commercial spaces.", ["Property", "Real Estate"], "doc-10-expats-settling-in.mp4", "app-services-mobile", [0.76, 0.86]),
  scene("Service Providers", "Connect with plumbers, electricians, mechanics, cleaners, builders, and more.", ["Providers", "Requests"], "doc-10-expats-settling-in.mp4", "app-services-mobile", [0.62, 0.74], "community-services-flow", 14),
  scene("VanuHealth", "Find pharmacies, hospitals, labs, medical services, and delivery options.", ["VanuHealth", "Care"], "doc-11-health-jobs-services.mp4", "app-services-mobile", [0.88, 0.95], "community-services-flow", 0),
  scene("VanuJobs", "Discover jobs, freelancing, hiring, and career opportunities.", ["VanuJobs", "Work"], "doc-11-health-jobs-services.mp4", "app-services-mobile", [0.92, 1], "community-services-flow", 5),
  scene("Business Partners", "Restaurants, shops, hotels, tours, ferry operators, sellers, and providers can grow online.", ["Partners", "Listings"], "doc-12-business-community-closing.mp4", "app-promote-business", [0, 0.25], "business-partner-flow", 0),
  scene("Messages & Orders", "Customers and businesses keep conversations close to each transaction.", ["Messages", "Orders"], "doc-12-business-community-closing.mp4", "app-admin-dashboard", [0, 0.28]),
  scene("Admin & Trust", "Approvals, activity, customer messages, and promotions help keep the platform trusted.", ["Approvals", "Activity"], "doc-12-business-community-closing.mp4", "app-admin-dashboard", [0, 0.28]),
  scene("VanuWay Daily", "Weather, currency, kava, water taxi routes, power updates, and emergency numbers.", ["Daily", "Updates"], "doc-02-ni-vanuatu-family-daily-life.mp4", "app-daily-mobile", [0.12, 0.68], "daily-tools-flow", 0),
  scene("Emergency Alerts & Events", "Stay informed when safety matters and discover what is happening nearby.", ["Alerts", "Events"], "doc-05-cruise-visitors-arrive.mp4", "app-daily-mobile", [0.56, 1], "daily-tools-flow", 5),
  scene("One Vanuatu, More Connected", "A digital bridge between people, businesses, islands, and opportunity.", ["Connected", "Opportunity"], "doc-01-island-life-opener.mp4", "app-home-mobile", [0, 0.08]),
  scene("Visit VanuWay.com", "Download or open the VanuWay app from www.vanuway.com.", ["www.vanuway.com", "Download"], "doc-01-island-life-opener.mp4", "website-home-desktop", [0, 0])
];

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

async function main() {
  fs.mkdirSync(finalDir, { recursive: true });
  fs.mkdirSync(overlayDir, { recursive: true });
  fs.mkdirSync(segmentDir, { recursive: true });
  fs.mkdirSync(journeyFrameDir, { recursive: true });

  const logo = await imageBuffer(path.join(brandDir, "vanuway-logo-white.png"), 112, 112, "contain");
  const assets = await loadScreens();
  const segments = [];

  for (let sceneIndex = 0; sceneIndex < scenes.length; sceneIndex += 1) {
    const current = scenes[sceneIndex];
    const sceneOverlayDir = path.join(overlayDir, `scene-${String(sceneIndex).padStart(2, "0")}`);
    fs.mkdirSync(sceneOverlayDir, { recursive: true });
    if (current.journey) prepareJourneyFrames(current, sceneIndex);

    for (let frame = 0; frame < FPS * SCENE_SECONDS; frame += 1) {
      const progress = frame / (FPS * SCENE_SECONDS - 1);
      const overlay = await makeOverlay({ current, progress, logo, assets, sceneIndex, frame });
      await overlay.toFile(path.join(sceneOverlayDir, `frame-${String(frame).padStart(4, "0")}.png`));
    }

    const segment = path.join(segmentDir, `scene-${String(sceneIndex).padStart(2, "0")}.mp4`);
    run("ffmpeg", [
      "-y",
      "-stream_loop",
      "-1",
      "-i",
      resolveBroll(current.broll),
      "-framerate",
      String(FPS),
      "-i",
      path.join(sceneOverlayDir, "frame-%04d.png"),
      "-filter_complex",
      `[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1[bg];[1:v]format=rgba[ov];[bg][ov]overlay=0:0:format=auto,format=yuv420p[v]`,
      "-map",
      "[v]",
      "-t",
      String(SCENE_SECONDS),
      "-r",
      String(FPS),
      "-an",
      segment
    ]);
    segments.push(segment);
  }

  const concat = path.join(finalDir, "vanuway-documentary-launch-concat.txt");
  fs.writeFileSync(concat, segments.map((file) => `file '${file.replaceAll("'", "'\\''")}'`).join("\n"));
  const silent = path.join(finalDir, "vanuway-documentary-launch-silent.mp4");
  run("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", concat, "-c", "copy", silent]);

  const voice = path.join(voiceDir, "vanuway-documentary-launch-voiceover-male.mp3");
  const music = path.join(finalDir, "vanuway-documentary-cinematic-bed.wav");
  const output = path.join(finalDir, "vanuway-documentary-launch-final.mp4");
  const visualDuration = scenes.length * SCENE_SECONDS;
  const audioFadeStart = Math.max(0, visualDuration - 8).toFixed(2);
  createMusicBed(music, visualDuration);

  run("ffmpeg", [
    "-y",
    "-i",
    silent,
    "-i",
    voice,
    "-stream_loop",
    "-1",
    "-i",
    music,
    "-filter_complex",
    `[1:a]volume=1.55,aformat=channel_layouts=stereo[vo];[2:a]volume=0.085,afade=t=in:st=0:d=2,afade=t=out:st=${audioFadeStart}:d=6,aformat=channel_layouts=stereo[bed];[vo][bed]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.92[a]`,
    "-map",
    "0:v",
    "-map",
    "[a]",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "20",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-shortest",
    output
  ]);

  run("ffmpeg", ["-y", "-ss", "00:00:08", "-i", output, "-frames:v", "1", path.join(finalDir, "vanuway-documentary-launch-preview.png")]);
  console.log(`Rendered ${output}`);
}

function scene(title, body, tags, broll, screen, scroll, journey = null, journeyStart = 0) {
  return { title, body, tags, broll, screen, scroll, journey, journeyStart };
}

async function loadScreens() {
  const files = {
    "app-home-mobile": path.join(publicDir, "app-home-mobile.png"),
    "app-services-mobile": path.join(publicDir, "app-services-mobile.png"),
    "app-daily-mobile": path.join(publicDir, "app-daily-mobile.png"),
    "app-ferry-mobile": path.join(publicDir, "app-ferry-mobile.png"),
    "app-hotels-mobile": path.join(publicDir, "app-hotels-mobile.png"),
    "app-marketplace-mobile": path.join(publicDir, "app-marketplace-mobile.png"),
    "app-tours-mobile": path.join(publicDir, "app-tours-mobile.png"),
    "website-home-desktop": path.join(publicDir, "website-home-desktop.png"),
    "app-admin-dashboard": path.join(authDir, "app-admin-dashboard.png"),
    "app-messages": path.join(authDir, "app-messages.png"),
    "app-promote-business": path.join(authDir, "app-promote-business.png")
  };
  const result = {};
  for (const [key, file] of Object.entries(files)) {
    result[key] = { file, meta: await sharp(file).metadata() };
  }
  return result;
}

async function makeOverlay({ current, progress, logo, assets, sceneIndex, frame }) {
  const screen = await screenCrop(assets[current.screen], current.scroll, progress, current, frame);
  const base = sharp({
    create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  });
  const svg = Buffer.from(overlaySvg(current, sceneIndex));
  return base.composite([
    { input: logo, left: 74, top: 64 },
    { input: screen, left: phone.screenX, top: phone.screenY },
    { input: svg, left: 0, top: 0 }
  ]);
}

async function screenCrop(screen, scrollRange, progress, current, frame) {
  if (current.journeyFramesDir) {
    const videoFrame = path.join(current.journeyFramesDir, `frame-${String(frame + 1).padStart(4, "0")}.png`);
    if (fs.existsSync(videoFrame)) {
      return sharp(videoFrame)
        .composite([
          { input: Buffer.from(phoneLabelSvg(current)), left: 20, top: 22 },
          {
            input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${phone.screenW}" height="${phone.screenH}"><rect width="${phone.screenW}" height="${phone.screenH}" rx="38" fill="#fff"/></svg>`),
            blend: "dest-in"
          }
        ])
        .png()
        .toBuffer();
    }
  }
  const resizedW = phone.screenW;
  const resizedH = Math.max(phone.screenH, Math.round((screen.meta.height / screen.meta.width) * resizedW));
  const start = scrollRange[0];
  const end = scrollRange[1];
  const eased = easeInOut(progress);
  const ratio = start + (end - start) * eased;
  const maxTop = Math.max(0, resizedH - phone.screenH);
  const top = Math.min(maxTop, Math.max(0, Math.round(maxTop * ratio)));
  const feature = Buffer.from(phoneLabelSvg(current));
  return sharp(screen.file)
    .resize(resizedW, resizedH, { fit: "fill" })
    .extract({ left: 0, top, width: phone.screenW, height: phone.screenH })
    .composite([
      { input: feature, left: 20, top: 22 },
      {
        input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${phone.screenW}" height="${phone.screenH}"><rect width="${phone.screenW}" height="${phone.screenH}" rx="38" fill="#fff"/></svg>`),
        blend: "dest-in"
      }
    ])
    .png()
    .toBuffer();
}

function prepareJourneyFrames(current, sceneIndex) {
  const source = path.join(journeyVideoDir, `${current.journey}.webm`);
  if (!fs.existsSync(source)) return;
  const dir = path.join(journeyFrameDir, `scene-${String(sceneIndex).padStart(2, "0")}-${current.journey}`);
  fs.mkdirSync(dir, { recursive: true });
  const firstFrame = path.join(dir, "frame-0001.png");
  if (fs.existsSync(firstFrame)) {
    current.journeyFramesDir = dir;
    return;
  }
  run("ffmpeg", [
    "-y",
    "-stream_loop",
    "-1",
    "-ss",
    String(current.journeyStart || 0),
    "-i",
    source,
    "-t",
    String(SCENE_SECONDS),
    "-vf",
    `fps=${FPS},scale=${phone.screenW}:${phone.screenH}:force_original_aspect_ratio=increase,crop=${phone.screenW}:${phone.screenH}`,
    path.join(dir, "frame-%04d.png")
  ]);
  current.journeyFramesDir = dir;
}

function overlaySvg(current, sceneIndex) {
  const safeTitle = textBlock(current.title, 106, 816, 44, 34, palette.white, 900, 1.04);
  const safeBody = textBlock(current.body, 108, 874, 25, 62, "#EAF1FF", 700, 1.18);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <linearGradient id="leftShade" x1="0" x2="1">
        <stop offset="0" stop-color="#000000" stop-opacity=".42"/>
        <stop offset=".62" stop-color="#000000" stop-opacity=".08"/>
        <stop offset="1" stop-color="#000000" stop-opacity="0"/>
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#000000" flood-opacity=".42"/>
      </filter>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#leftShade)"/>
    <text x="198" y="132" fill="${palette.white}" stroke="#000000" stroke-opacity=".32" stroke-width="4" paint-order="stroke" font-family="Arial, Helvetica, sans-serif" font-size="46" font-weight="900">VanuWay</text>
    <g filter="url(#shadow)">
      <rect x="${phone.x}" y="${phone.y}" width="${phone.w}" height="${phone.h}" rx="68" fill="none" stroke="#030712" stroke-width="48"/>
      <rect x="${phone.x + 8}" y="${phone.y + 8}" width="${phone.w - 16}" height="${phone.h - 16}" rx="60" fill="none" stroke="#FFFFFF" stroke-opacity=".18" stroke-width="2"/>
      <rect x="${phone.screenX + 110}" y="${phone.screenY + 5}" width="148" height="24" rx="12" fill="#040712"/>
    </g>
    <g>
      <rect x="72" y="716" width="1068" height="292" rx="24" fill="#050B18" opacity=".56"/>
      <text x="108" y="762" fill="${palette.orange}" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="900" letter-spacing="0">DOCUMENTARY LAUNCH FILM</text>
      ${safeTitle}
      ${safeBody}
      ${tagBlock(current.tags)}
      <text x="108" y="1002" fill="#FFFFFF" fill-opacity=".82" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700">Scene ${String(sceneIndex + 1).padStart(2, "0")} / ${scenes.length}</text>
    </g>
  </svg>`;
}

function phoneLabelSvg(current) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="328" height="104" viewBox="0 0 328 104">
    <rect x="0" y="0" width="328" height="104" rx="24" fill="#050B18" fill-opacity=".88"/>
    <rect x="16" y="18" width="7" height="68" rx="3.5" fill="${palette.orange}"/>
    <text x="36" y="42" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="900">${esc(current.title)}</text>
    <text x="36" y="72" fill="#DDE8FF" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="700">${esc(current.tags.join(" • "))}</text>
  </svg>`;
}

function tagBlock(tags) {
  return tags.slice(0, 3).map((tag, index) => {
    const x = 108 + index * 248;
    const y = 930;
    const fill = index % 2 === 0 ? palette.orange : palette.white;
    const color = index % 2 === 0 ? palette.white : palette.navy;
    return `<rect x="${x}" y="${y}" width="220" height="46" rx="23" fill="${fill}"/>
      <text x="${x + 110}" y="${y + 31}" text-anchor="middle" fill="${color}" font-family="Arial, Helvetica, sans-serif" font-size="19" font-weight="900">${esc(tag)}</text>`;
  }).join("");
}

async function imageBuffer(file, w, h, fit) {
  return sharp(file).resize(w, h, { fit, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
}

function textBlock(text, x, y, size, maxChars, color, weight, lineHeight) {
  return `<text x="${x}" y="${y}" fill="${color}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="${weight}" letter-spacing="0">${wrap(text, maxChars)
    .map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : size * lineHeight}">${esc(line)}</tspan>`)
    .join("")}</text>`;
}

function wrap(text, maxChars) {
  const words = text.split(" ");
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function createMusicBed(file, seconds) {
  const fadeStart = Math.max(0, seconds - 8).toFixed(2);
  run("ffmpeg", [
    "-y",
    "-f",
    "lavfi",
    "-i",
    `sine=frequency=64:sample_rate=44100:duration=${seconds}`,
    "-f",
    "lavfi",
    "-i",
    `sine=frequency=128:sample_rate=44100:duration=${seconds}`,
    "-f",
    "lavfi",
    "-i",
    `anoisesrc=color=pink:amplitude=0.10:sample_rate=44100:duration=${seconds}`,
    "-filter_complex",
    `[0:a]volume=0.22,lowpass=f=220[a0];[1:a]volume=0.065,lowpass=f=420[a1];[2:a]volume=0.026,lowpass=f=1900,highpass=f=260[a2];[a0][a1][a2]amix=inputs=3:duration=longest,afade=t=in:st=0:d=2,afade=t=out:st=${fadeStart}:d=6`,
    "-c:a",
    "pcm_s16le",
    file
  ]);
}

function resolveBroll(fileName) {
  const file = path.join(rawDir, fileName);
  if (fs.existsSync(file)) return file;
  const fallbacks = [
    "01-hero-opener-landscape.mp4",
    "02-rides-delivery-phone-free-landscape.mp4",
    "03-food-shop-marketplace-phone-free-landscape.mp4",
    "04-hotels-tours-ferry-flights-landscape.mp4",
    "05-community-learning-providers-phone-free-landscape.mp4",
    "07-business-dashboard-phone-free-landscape.mp4"
  ];
  const fallback = fallbacks.find((candidate) => fs.existsSync(path.join(rawDir, candidate)));
  if (!fallback) throw new Error(`Missing b-roll: ${fileName}`);
  return path.join(rawDir, fallback);
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function esc(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 1024 * 1024 * 64 });
  if (result.status !== 0) throw new Error(`${command} failed:\n${result.stderr || result.stdout}`);
}
