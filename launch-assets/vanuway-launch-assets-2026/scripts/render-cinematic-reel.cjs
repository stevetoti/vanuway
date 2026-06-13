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
const frameDir = path.join(finalDir, "reel-frames");
const segmentDir = path.join(finalDir, "reel-segments");
const voiceDir = path.join(root, "higgsfield", "voiceover");

const width = 1080;
const height = 1920;
const palette = {
  navy: "#233C6F",
  navyDark: "#162545",
  orange: "#EF5E33",
  black: "#000000",
  white: "#FFFFFF",
  mist: "#EAF1FF"
};

const scenes = [
  ["VanuWay is launching.", "One app for everyday Vanuatu.", ["Rides", "Food", "Shopping"], "01-hero-opener-reel.mp4", "app-home-mobile"],
  ["Move, eat, shop", "Book rides, send packages, order food, shop local, and use the marketplace.", ["Rides", "Delivery", "Marketplace"], "02-rides-delivery-landscape.mp4", "app-services-mobile"],
  ["Travel and stay", "Hotels, tours, ferry routes, and flights between islands.", ["Hotels", "Tours", "Ferry"], "04-hotels-tours-ferry-flights-landscape.mp4", "app-ferry-mobile"],
  ["Community and safety", "Bislama learning, emergency updates, events, and local providers.", ["Bislama", "Alerts", "Events"], "05-community-learning-providers-landscape.mp4", "app-daily-mobile"],
  ["Life services", "Real estate, VanuHealth, jobs, freelancing, and local hiring.", ["Property", "Health", "Jobs"], "03-food-shop-marketplace-landscape.mp4", "app-services-mobile"],
  ["Business tools", "Partner dashboards, seller tools, messages, and business promotion.", ["Dashboards", "Messages", "Promotion"], "07-business-dashboard-landscape.mp4", "app-admin-dashboard"],
  ["Open VanuWay", "Visit vanuway.com or open app.vanuway.com.", ["Now launching"], "01-hero-opener-reel.mp4", "app-home-mobile"]
].map(([title, body, tags, broll, visual]) => ({ title, body, tags, broll, visual }));

async function main() {
  fs.mkdirSync(finalDir, { recursive: true });
  fs.mkdirSync(frameDir, { recursive: true });
  fs.mkdirSync(segmentDir, { recursive: true });

  const logo = await imageDataUri(path.join(brandDir, "vanuway-logo-white.png"), 210, 210, "contain");
  const images = await loadImages();
  const segments = [];

  for (let index = 0; index < scenes.length; index += 1) {
    const scene = scenes[index];
    const overlayPath = path.join(frameDir, `overlay-${String(index).padStart(2, "0")}.png`);
    const segmentPath = path.join(segmentDir, `scene-${String(index).padStart(2, "0")}.mp4`);
    await renderOverlay({ scene, images, logo, output: overlayPath });
    const brollPath = path.join(rawDir, scene.broll);

    run("ffmpeg", [
      "-y",
      "-i",
      brollPath,
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

  const concatPath = path.join(finalDir, "vanuway-cinematic-launch-reel-concat.txt");
  fs.writeFileSync(concatPath, segments.map((file) => `file '${file.replaceAll("'", "'\\''")}'`).join("\n"));
  const silentVideo = path.join(finalDir, "vanuway-cinematic-launch-reel-silent.mp4");
  run("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", concatPath, "-c", "copy", silentVideo]);

  const voiceover = path.join(voiceDir, "vanuway-launch-reel-voiceover-female.mp3");
  const output = path.join(finalDir, "vanuway-cinematic-launch-reel-with-voiceover.mp4");
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
    "app-home-mobile": path.join(publicDir, "app-home-mobile.png"),
    "app-services-mobile": path.join(publicDir, "app-services-mobile.png"),
    "app-ferry-mobile": path.join(publicDir, "app-ferry-mobile.png"),
    "app-daily-mobile": path.join(publicDir, "app-daily-mobile.png"),
    "app-admin-dashboard": path.join(authDir, "app-admin-dashboard.png")
  };
  const result = {};
  for (const [key, file] of Object.entries(files)) {
    if (fs.existsSync(file)) result[key] = await imageDataUri(file, 430, 830, "cover");
  }
  return result;
}

async function imageDataUri(file, w, h, fit = "cover") {
  const buffer = await sharp(file)
    .resize(w, h, { fit, position: "top", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

async function renderOverlay({ scene, images, logo, output }) {
  const image = images[scene.visual] || images["app-home-mobile"];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000000" stop-opacity=".82"/>
        <stop offset="46%" stop-color="#000000" stop-opacity=".42"/>
        <stop offset="100%" stop-color="#000000" stop-opacity=".74"/>
      </linearGradient>
      <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${palette.navy}" stop-opacity=".9"/>
        <stop offset="100%" stop-color="${palette.black}" stop-opacity=".84"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#shade)"/>
    <path d="M -40 1560 C 260 1450, 450 1640, 720 1500 S 980 1410, 1120 1480" fill="none" stroke="${palette.orange}" stroke-width="16" opacity=".9"/>
    <image href="${logo}" x="70" y="78" width="72" height="72" preserveAspectRatio="xMidYMid meet"/>
    <text x="160" y="132" fill="${palette.white}" font-family="Arial, Helvetica, sans-serif" font-size="52" font-weight="900">VanuWay</text>
    <rect x="70" y="210" width="940" height="470" rx="32" fill="url(#panel)" opacity=".8"/>
    ${textBlock(scene.title, 112, 330, 72, 13, palette.white, 900, 1.03)}
    ${textBlock(scene.body, 114, 482, 35, 29, palette.mist, 680, 1.22)}
    ${tagBlock(scene.tags)}
    <g>
      <rect x="326" y="742" width="458" height="906" rx="78" fill="#020617" opacity=".62"/>
      <rect x="350" y="720" width="430" height="890" rx="68" fill="#05070D"/>
      <clipPath id="phoneClip"><rect x="373" y="748" width="384" height="834" rx="44"/></clipPath>
      <image href="${image}" x="373" y="748" width="384" height="834" preserveAspectRatio="xMidYMin slice" clip-path="url(#phoneClip)"/>
      <rect x="498" y="752" width="136" height="22" rx="11" fill="#05070D"/>
    </g>
    <text x="70" y="1792" fill="${palette.white}" opacity=".94" font-family="Arial, Helvetica, sans-serif" font-size="38" font-weight="900">vanuway.com</text>
    <text x="70" y="1848" fill="${palette.white}" opacity=".94" font-family="Arial, Helvetica, sans-serif" font-size="38" font-weight="900">app.vanuway.com</text>
  </svg>`;
  await sharp(Buffer.from(svg)).png().toFile(output);
}

function tagBlock(tags) {
  return tags.slice(0, 3).map((tag, index) => {
    const x = 114 + index * 286;
    const y = 608;
    const fill = index % 2 === 0 ? palette.orange : palette.white;
    const color = index % 2 === 0 ? palette.white : palette.navy;
    return `<rect x="${x}" y="${y}" width="250" height="52" rx="26" fill="${fill}"/>
      <text x="${x + 125}" y="${y + 35}" text-anchor="middle" fill="${color}" font-family="Arial, Helvetica, sans-serif" font-size="21" font-weight="900">${esc(tag)}</text>`;
  }).join("");
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
  if (result.status !== 0) throw new Error(`${command} failed:\n${result.stderr || result.stdout}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
