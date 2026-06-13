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
const frameDir = path.join(finalDir, "frames");
const segmentDir = path.join(finalDir, "segments");
const voiceDir = path.join(root, "higgsfield", "voiceover");

const width = 1920;
const height = 1080;
const palette = {
  navy: "#233C6F",
  navyDark: "#162545",
  orange: "#EF5E33",
  black: "#000000",
  white: "#FFFFFF",
  mist: "#EAF1FF"
};

const scenes = [
  {
    title: "Vanuatu, meet VanuWay.",
    body: "One app for everyday Vanuatu.",
    tags: ["vanuway.com", "app.vanuway.com"],
    broll: "01-hero-opener-landscape.mp4",
    visual: "app-home-mobile"
  },
  {
    title: "Move and deliver",
    body: "Book rides and send packages with local drivers and couriers.",
    tags: ["Ride-hailing", "Package delivery"],
    broll: "02-rides-delivery-landscape.mp4",
    visual: "app-home-mobile"
  },
  {
    title: "Eat, shop, and sell local",
    body: "Order food, shop from local stores, and buy or sell in the marketplace.",
    tags: ["Food delivery", "Shop delivery", "Marketplace"],
    broll: "03-food-shop-marketplace-landscape.mp4",
    visual: "app-services-mobile"
  },
  {
    title: "Travel and stay",
    body: "Find hotels, discover tours and attractions, and plan ferry or flight travel.",
    tags: ["Hotels", "Tours", "Ferry", "Flights"],
    broll: "04-hotels-tours-ferry-flights-landscape.mp4",
    visual: "app-ferry-mobile"
  },
  {
    title: "Community and safety",
    body: "Learn Bislama, stay informed, discover events, and connect with providers.",
    tags: ["Bislama", "Emergency alerts", "Events", "Providers"],
    broll: "05-community-learning-providers-landscape.mp4",
    visual: "app-daily-mobile"
  },
  {
    title: "Property, health, and work",
    body: "Browse real estate, access VanuHealth services, find jobs, and hire local talent.",
    tags: ["Real estate", "VanuHealth", "VanuJobs"],
    broll: "01-hero-opener-landscape.mp4",
    visual: "app-services-mobile"
  },
  {
    title: "Built for businesses",
    body: "Manage listings, messages, activity, and promotions from one platform.",
    tags: ["Partner dashboards", "Seller tools", "Business promotion"],
    broll: "07-business-dashboard-landscape.mp4",
    visual: "app-admin-dashboard"
  },
  {
    title: "Real app. Real dashboard.",
    body: "Screenshots from the live website and logged-in VanuWay dashboard.",
    tags: ["Messages", "Approvals", "Admin tools"],
    broll: "07-business-dashboard-landscape.mp4",
    visual: "app-admin-messages"
  },
  {
    title: "For customers and partners",
    body: "Customers, vendors, drivers, hotels, tour operators, service providers, and admins.",
    tags: ["Customers", "Partners", "Communities"],
    broll: "04-hotels-tours-ferry-flights-landscape.mp4",
    visual: "website-business-desktop"
  },
  {
    title: "One platform for Vanuatu",
    body: "Rides, delivery, food, shopping, marketplace, hotels, tours, ferry, flights, Bislama, alerts, events, providers, property, health, jobs, and business tools.",
    tags: ["All services", "One app"],
    broll: "03-food-shop-marketplace-landscape.mp4",
    visual: "website-services-desktop"
  },
  {
    title: "Launch with VanuWay",
    body: "Visit vanuway.com or open app.vanuway.com.",
    tags: ["Now launching"],
    broll: "01-hero-opener-landscape.mp4",
    visual: "app-home-mobile"
  }
];

async function main() {
  fs.mkdirSync(finalDir, { recursive: true });
  fs.mkdirSync(frameDir, { recursive: true });
  fs.mkdirSync(segmentDir, { recursive: true });

  const logo = await imageDataUri(path.join(brandDir, "vanuway-logo-white.png"), 300, 300, "contain");
  const images = await loadImages();
  const segments = [];

  for (let index = 0; index < scenes.length; index += 1) {
    const scene = scenes[index];
    const overlayPath = path.join(frameDir, `overlay-${String(index).padStart(2, "0")}.png`);
    const segmentPath = path.join(segmentDir, `scene-${String(index).padStart(2, "0")}.mp4`);
    await renderOverlay({ scene, images, logo, output: overlayPath });

    run("ffmpeg", [
      "-y",
      "-i",
      path.join(rawDir, scene.broll),
      "-loop",
      "1",
      "-i",
      overlayPath,
      "-filter_complex",
      `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},setsar=1[bg];[1:v]scale=${width}:${height},format=rgba[ov];[bg][ov]overlay=0:0:format=auto,format=yuv420p[v]`,
      "-map",
      "[v]",
      "-t",
      "5",
      "-r",
      "24",
      "-an",
      segmentPath
    ]);
    segments.push(segmentPath);
  }

  const concatPath = path.join(finalDir, "vanuway-cinematic-launch-landscape-concat.txt");
  fs.writeFileSync(concatPath, segments.map((file) => `file '${file.replaceAll("'", "'\\''")}'`).join("\n"));

  const silentVideo = path.join(finalDir, "vanuway-cinematic-launch-landscape-silent.mp4");
  run("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", concatPath, "-c", "copy", silentVideo]);

  const voiceover = path.join(voiceDir, "vanuway-launch-voiceover-female.mp3");
  const output = path.join(finalDir, "vanuway-cinematic-launch-landscape-with-voiceover.mp4");
  if (fs.existsSync(voiceover)) {
    run("ffmpeg", [
      "-y",
      "-i",
      silentVideo,
      "-i",
      voiceover,
      "-filter_complex",
      "[1:a]volume=1.0[a]",
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
  } else {
    fs.copyFileSync(silentVideo, output);
  }

  console.log(`Rendered ${output}`);
}

async function loadImages() {
  const files = {
    "website-home-desktop": path.join(publicDir, "website-home-desktop.png"),
    "website-services-desktop": path.join(publicDir, "website-services-desktop.png"),
    "website-business-desktop": path.join(publicDir, "website-business-desktop.png"),
    "app-home-mobile": path.join(publicDir, "app-home-mobile.png"),
    "app-services-mobile": path.join(publicDir, "app-services-mobile.png"),
    "app-marketplace-mobile": path.join(publicDir, "app-marketplace-mobile.png"),
    "app-hotels-mobile": path.join(publicDir, "app-hotels-mobile.png"),
    "app-tours-mobile": path.join(publicDir, "app-tours-mobile.png"),
    "app-ferry-mobile": path.join(publicDir, "app-ferry-mobile.png"),
    "app-daily-mobile": path.join(publicDir, "app-daily-mobile.png"),
    "app-profile": path.join(authDir, "app-profile.png"),
    "app-messages": path.join(authDir, "app-messages.png"),
    "app-notifications": path.join(authDir, "app-notifications.png"),
    "app-partners": path.join(authDir, "app-partners.png"),
    "app-promote-business": path.join(authDir, "app-promote-business.png"),
    "app-admin-dashboard": path.join(authDir, "app-admin-dashboard.png"),
    "app-admin-approvals": path.join(authDir, "app-admin-approvals.png"),
    "app-admin-messages": path.join(authDir, "app-admin-messages.png")
  };

  const result = {};
  for (const [key, file] of Object.entries(files)) {
    if (!fs.existsSync(file)) continue;
    const isMobile = key.startsWith("app-");
    result[key] = await imageDataUri(file, isMobile ? 420 : 760, isMobile ? 820 : 500, "cover");
  }
  return result;
}

async function imageDataUri(file, width, height, fit = "cover") {
  const buffer = await sharp(file)
    .resize(width, height, { fit, position: "top", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

async function renderOverlay({ scene, images, logo, output }) {
  const isMobile = scene.visual?.startsWith("app-");
  const image = images[scene.visual] || images["app-home-mobile"];
  const visual = isMobile ? phoneVisual(image) : desktopVisual(image);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="shade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#000000" stop-opacity=".76"/>
        <stop offset="48%" stop-color="#000000" stop-opacity=".44"/>
        <stop offset="100%" stop-color="#000000" stop-opacity=".16"/>
      </linearGradient>
      <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${palette.navy}" stop-opacity=".92"/>
        <stop offset="100%" stop-color="${palette.black}" stop-opacity=".88"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#shade)"/>
    <path d="M 0 ${height - 190} C 380 ${height - 280}, 560 ${height - 90}, 920 ${height - 170} S 1500 ${height - 330}, ${width} ${height - 210}" fill="none" stroke="${palette.orange}" stroke-width="12" opacity=".82"/>
    <rect x="84" y="70" width="430" height="88" rx="44" fill="${palette.black}" opacity=".42"/>
    <image href="${logo}" x="108" y="80" width="68" height="68" preserveAspectRatio="xMidYMid meet"/>
    <text x="194" y="132" fill="${palette.white}" font-family="Arial, Helvetica, sans-serif" font-size="45" font-weight="900">VanuWay</text>
    <rect x="108" y="238" width="820" height="560" rx="24" fill="url(#panel)" opacity=".78"/>
    ${textBlock(scene.title, 154, 344, 74, 16, palette.white, 900, 1.06)}
    ${textBlock(scene.body, 156, 514, 34, 40, palette.mist, 680, 1.24)}
    ${tagBlock(scene.tags)}
    <text x="154" y="930" fill="${palette.white}" opacity=".92" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="900">vanuway.com | app.vanuway.com</text>
    ${visual}
  </svg>`;

  await sharp(Buffer.from(svg)).png().toFile(output);
}

function phoneVisual(image) {
  return `<g>
    <rect x="1282" y="116" width="468" height="872" rx="76" fill="#020617" opacity=".54"/>
    <rect x="1308" y="96" width="430" height="860" rx="66" fill="#05070D"/>
    <clipPath id="phoneClip"><rect x="1331" y="122" width="384" height="808" rx="42"/></clipPath>
    <image href="${image}" x="1331" y="122" width="384" height="808" preserveAspectRatio="xMidYMin slice" clip-path="url(#phoneClip)"/>
    <rect x="1452" y="126" width="148" height="22" rx="11" fill="#05070D"/>
  </g>`;
}

function desktopVisual(image) {
  return `<g>
    <rect x="1018" y="196" width="800" height="602" rx="44" fill="#020617" opacity=".52"/>
    <rect x="1048" y="222" width="740" height="542" rx="32" fill="#05070D"/>
    <clipPath id="desktopClip"><rect x="1072" y="246" width="692" height="494" rx="24"/></clipPath>
    <image href="${image}" x="1072" y="246" width="692" height="494" preserveAspectRatio="xMidYMin slice" clip-path="url(#desktopClip)"/>
    <rect x="1130" y="792" width="582" height="36" rx="18" fill="#020617" opacity=".84"/>
  </g>`;
}

function tagBlock(tags) {
  return tags
    .slice(0, 4)
    .map((tag, index) => {
      const x = 154 + (index % 2) * 350;
      const y = 672 + Math.floor(index / 2) * 76;
      const fill = index % 2 === 0 ? palette.orange : palette.white;
      const color = index % 2 === 0 ? palette.white : palette.navy;
      return `<rect x="${x}" y="${y}" width="300" height="52" rx="26" fill="${fill}"/>
        <text x="${x + 150}" y="${y + 35}" text-anchor="middle" fill="${color}" font-family="Arial, Helvetica, sans-serif" font-size="21" font-weight="900">${esc(tag)}</text>`;
    })
    .join("");
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

function esc(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`${command} failed:\n${result.stderr || result.stdout}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
