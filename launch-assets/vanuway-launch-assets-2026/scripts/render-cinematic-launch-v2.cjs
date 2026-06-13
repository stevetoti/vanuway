const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const brandDir = path.join(root, "assets", "brand");
const publicDir = path.join(root, "captures", "public");
const authDir = path.join(root, "captures", "authenticated");
const rawDir = path.join(root, "higgsfield", "raw-clips");
const finalDir = path.join(root, "higgsfield", "final-edit");
const overlayDir = path.join(finalDir, "v2-overlays");
const segmentDir = path.join(finalDir, "v2-segments");
const voiceDir = path.join(root, "higgsfield", "voiceover");

const FPS = 24;
const SCENE_SECONDS = 6;
const W = 1920;
const H = 1080;
const phone = { x: 1240, y: 100, w: 430, h: 860, screenX: 1264, screenY: 132, screenW: 382, screenH: 784 };
const palette = { navy: "#233C6F", orange: "#EF5E33", white: "#FFFFFF", black: "#000000" };

const scenes = [
  {
    title: "Vanuatu, Meet VanuWay",
    body: "One app for everyday Vanuatu.",
    tags: ["One App", "Everyday Vanuatu"],
    broll: "01-hero-opener-landscape.mp4",
    screen: "app-home-mobile",
    scroll: [0, 0.08]
  },
  {
    title: "Rides & Package Delivery",
    body: "Book rides and send packages with local drivers.",
    tags: ["Ride-Hailing", "Package Delivery"],
    broll: "02-rides-delivery-phone-free-landscape.mp4",
    screen: "app-services-mobile",
    scroll: [0.04, 0.20]
  },
  {
    title: "Food, Shops & Marketplace",
    body: "Order food, shop locally, and buy or sell in the marketplace.",
    tags: ["Food Delivery", "Shop Delivery", "Marketplace"],
    broll: "03-food-shop-marketplace-phone-free-landscape.mp4",
    screen: "app-services-mobile",
    scroll: [0.22, 0.36]
  },
  {
    title: "Hotels, Tours, Ferry & Flights",
    body: "Find stays, tours, ferry options, and flights between islands.",
    tags: ["Hotels", "Tours", "Ferry", "Flights"],
    broll: "04-hotels-tours-ferry-flights-landscape.mp4",
    screen: "app-services-mobile",
    scroll: [0.36, 0.51]
  },
  {
    title: "Bislama, Alerts & Events",
    body: "Learn, stay informed, and discover what is happening around you.",
    tags: ["Learn Bislama", "Emergency Alerts", "Events"],
    broll: "05-community-learning-providers-phone-free-landscape.mp4",
    screen: "app-services-mobile",
    scroll: [0.54, 0.76]
  },
  {
    title: "Providers, Property, Health & Jobs",
    body: "Connect with service providers, homes, care, jobs, and local talent.",
    tags: ["Providers", "Real Estate", "VanuHealth", "VanuJobs"],
    broll: "05-community-learning-providers-phone-free-landscape.mp4",
    screen: "app-services-mobile",
    scroll: [0.68, 1]
  },
  {
    title: "Dashboard Tools for Businesses",
    body: "Businesses can manage listings, customers, activity, and approvals.",
    tags: ["Dashboards", "Approvals", "Activity"],
    broll: "07-business-dashboard-phone-free-landscape.mp4",
    screen: "app-promote-business",
    scroll: [0, 0.34]
  },
  {
    title: "Messages & Promotion",
    body: "Reach customers, receive messages, and promote your business online.",
    tags: ["Messages", "Seller Tools", "Promotion"],
    broll: "07-business-dashboard-phone-free-landscape.mp4",
    screen: "app-promote-business",
    scroll: [0.32, 0.72]
  },
  {
    title: "Download From VanuWay.com",
    body: "Visit www.vanuway.com and download the app from there.",
    tags: ["www.vanuway.com", "Download the App"],
    broll: "01-hero-opener-landscape.mp4",
    screen: "app-home-mobile",
    scroll: [0, 0.08]
  }
];

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

async function main() {
  fs.mkdirSync(finalDir, { recursive: true });
  fs.mkdirSync(overlayDir, { recursive: true });
  fs.mkdirSync(segmentDir, { recursive: true });

  const logo = await imageBuffer(path.join(brandDir, "vanuway-logo-white.png"), 120, 120, "contain");
  const assets = await loadScreens();
  const segments = [];

  for (let sceneIndex = 0; sceneIndex < scenes.length; sceneIndex += 1) {
    const scene = scenes[sceneIndex];
    const sceneOverlayDir = path.join(overlayDir, `scene-${String(sceneIndex).padStart(2, "0")}`);
    fs.mkdirSync(sceneOverlayDir, { recursive: true });

    for (let frame = 0; frame < FPS * SCENE_SECONDS; frame += 1) {
      const progress = frame / (FPS * SCENE_SECONDS - 1);
      const overlay = await makeOverlay({ scene, progress, logo, assets });
      await overlay.toFile(path.join(sceneOverlayDir, `frame-${String(frame).padStart(4, "0")}.png`));
    }

    const segment = path.join(segmentDir, `scene-${String(sceneIndex).padStart(2, "0")}.mp4`);
    run("ffmpeg", [
      "-y",
      "-stream_loop",
      "-1",
      "-i",
      path.join(rawDir, scene.broll),
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

  const concat = path.join(finalDir, "vanuway-cinematic-launch-v2-concat.txt");
  fs.writeFileSync(concat, segments.map((file) => `file '${file.replaceAll("'", "'\\''")}'`).join("\n"));
  const silent = path.join(finalDir, "vanuway-cinematic-launch-v2-silent.mp4");
  run("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", concat, "-c", "copy", silent]);

  const voice = path.join(voiceDir, "vanuway-launch-v2-voiceover-female.mp3");
  const music = path.join(finalDir, "vanuway-cinematic-ad-bed.wav");
  const output = path.join(finalDir, "vanuway-cinematic-launch-v2-with-voiceover-and-music.mp4");
  createMusicBed(music, 60);

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
    "[1:a]volume=1.0[vo];[2:a]volume=0.12,afade=t=in:st=0:d=2,afade=t=out:st=43:d=2[music];[vo][music]amix=inputs=2:duration=first:dropout_transition=2[a]",
    "-map",
    "0:v",
    "-map",
    "[a]",
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-shortest",
    output
  ]);

  console.log(`Rendered ${output}`);
}

async function loadScreens() {
  const files = {
    "app-home-mobile": path.join(publicDir, "app-home-mobile.png"),
    "app-services-mobile": path.join(publicDir, "app-services-mobile.png"),
    "app-admin-dashboard": path.join(authDir, "app-admin-dashboard.png"),
    "app-admin-messages": path.join(authDir, "app-admin-messages.png"),
    "app-promote-business": path.join(authDir, "app-promote-business.png")
  };
  const result = {};
  for (const [key, file] of Object.entries(files)) {
    result[key] = {
      file,
      meta: await sharp(file).metadata()
    };
  }
  return result;
}

async function makeOverlay({ scene, progress, logo, assets }) {
  const screen = await screenCrop(assets[scene.screen], scene.scroll, progress);
  const heldPhoneLayers = await makeHeldPhoneLayers({ scene, progress, assets });
  const base = sharp({
    create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  });
  const svg = Buffer.from(overlaySvg(scene));
  return base.composite([
    ...heldPhoneLayers,
    { input: logo, left: 74, top: 64 },
    { input: screen, left: phone.screenX, top: phone.screenY },
    { input: svg, left: 0, top: 0 }
  ]);
}

async function makeHeldPhoneLayers({ scene, progress, assets }) {
  if (!scene.heldPhones) return [];
  const layers = [];
  for (const spec of scene.heldPhones) {
    const phoneScreen = await screenCropSized(
      assets[spec.screen || scene.screen],
      spec.scroll || scene.scroll,
      progress,
      spec.w,
      spec.h,
      spec.radius || 24
    );
    const rotated = await sharp(phoneScreen)
      .rotate(spec.rotate || 0, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    layers.push({ input: rotated, left: spec.x, top: spec.y });
  }
  return layers;
}

async function screenCrop(screen, scrollRange, progress) {
  return screenCropSized(screen, scrollRange, progress, phone.screenW, phone.screenH, 38);
}

async function screenCropSized(screen, scrollRange, progress, cropW, cropH, radius) {
  const resizedW = cropW;
  const resizedH = Math.max(cropH, Math.round((screen.meta.height / screen.meta.width) * resizedW));
  const start = scrollRange[0];
  const end = scrollRange[1];
  const eased = easeInOut(progress);
  const ratio = start + (end - start) * eased;
  const maxTop = Math.max(0, resizedH - cropH);
  const top = Math.min(maxTop, Math.max(0, Math.round(maxTop * ratio)));
  return sharp(screen.file)
    .resize(resizedW, resizedH, { fit: "fill" })
    .extract({ left: 0, top, width: cropW, height: cropH })
    .composite([
      {
        input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${cropW}" height="${cropH}"><rect width="${cropW}" height="${cropH}" rx="${radius}" fill="#fff"/></svg>`),
        blend: "dest-in"
      }
    ])
    .png()
    .toBuffer();
}

function overlaySvg(scene) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#000000" flood-opacity=".45"/>
      </filter>
    </defs>
    <text x="210" y="138" fill="${palette.white}" stroke="#000000" stroke-opacity=".35" stroke-width="4" paint-order="stroke" font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="900">VanuWay</text>
    <g filter="url(#shadow)">
      <rect x="${phone.x}" y="${phone.y}" width="${phone.w}" height="${phone.h}" rx="68" fill="none" stroke="#030712" stroke-width="48"/>
      <rect x="${phone.x + 8}" y="${phone.y + 8}" width="${phone.w - 16}" height="${phone.h - 16}" rx="60" fill="none" stroke="#FFFFFF" stroke-opacity=".18" stroke-width="2"/>
      <rect x="${phone.screenX + 118}" y="${phone.screenY + 5}" width="146" height="24" rx="12" fill="#040712"/>
    </g>
    <g>
      <rect x="72" y="784" width="1058" height="168" rx="24" fill="#050B18" opacity=".54"/>
      ${textBlock(scene.title, 108, 842, 44, 36, palette.white, 900, 1.05)}
      ${textBlock(scene.body, 110, 894, 26, 66, "#EAF1FF", 720, 1.18)}
      ${tagBlock(scene.tags)}
    </g>
  </svg>`;
}

function tagBlock(tags) {
  return tags.slice(0, 4).map((tag, index) => {
    const x = 108 + index * 248;
    const y = 928;
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
  run("ffmpeg", [
    "-y",
    "-f",
    "lavfi",
    "-i",
    `sine=frequency=82:sample_rate=44100:duration=${seconds}`,
    "-f",
    "lavfi",
    "-i",
    `sine=frequency=164:sample_rate=44100:duration=${seconds}`,
    "-f",
    "lavfi",
    "-i",
    `anoisesrc=color=pink:amplitude=0.12:sample_rate=44100:duration=${seconds}`,
    "-filter_complex",
    "[0:a]volume=0.20,lowpass=f=240[a0];[1:a]volume=0.08,lowpass=f=420[a1];[2:a]volume=0.035,lowpass=f=2500,highpass=f=300[a2];[a0][a1][a2]amix=inputs=3:duration=longest,afade=t=in:st=0:d=2,afade=t=out:st=56:d=4",
    "-c:a",
    "pcm_s16le",
    file
  ]);
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function esc(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${command} failed:\n${result.stderr || result.stdout}`);
}
