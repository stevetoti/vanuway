const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const rawDir = path.join(root, "higgsfield", "raw-clips");
const logDir = path.join(root, "higgsfield", "logs");

const model = "cinematic_studio_3_0";
const scenes = [
  ["doc-01-island-life-opener.mp4", "Documentary cinematic footage of Vanuatu island life at golden hour, coastal road, tropical greenery, village homes, small boats in the distance, warm Pacific light, natural handheld camera movement, hopeful and premium travel documentary mood, no text, no visible phone screens."],
  ["doc-02-ni-vanuatu-family-daily-life.mp4", "Cinematic documentary scene of a Ni-Vanuatu family moving through a local market and town street, friendly everyday energy, produce stalls, people greeting each other, authentic Pacific island community atmosphere, natural smiles, no text, no visible phone screens."],
  ["doc-03-rides-package-delivery.mp4", "Cinematic documentary shot of a Ni-Vanuatu driver beside a clean vehicle helping a customer with a small parcel, Port Vila street feel, professional and trustworthy, motion from driver opening car door and package handoff, no text, no visible phone screens."],
  ["doc-04-food-shopping-marketplace.mp4", "Cinematic documentary footage of local restaurant food, fresh produce, and shop goods being prepared and handed over at a market-style storefront, Ni-Vanuatu vendor and customer interaction, warm natural light, premium realistic look, no text, no visible phone screens."],
  ["doc-05-cruise-visitors-arrive.mp4", "Cinematic documentary shot of cruise ship visitors walking near a tropical port area, welcomed by a Ni-Vanuatu guide, relaxed travel energy, buses and local transport in background, authentic tourism moment, no text, no visible phone screens."],
  ["doc-06-tours-attractions.mp4", "Cinematic documentary scene of mixed Ni-Vanuatu guide and visitors exploring a beautiful Vanuatu attraction, blue water, lush landscape, cultural warmth, guided tour feeling, premium travel documentary, no text, no visible phone screens."],
  ["doc-07-airport-travellers.mp4", "Cinematic documentary shot of travellers and expats arriving at a small Pacific airport terminal, luggage, friendly local driver greeting them outside, bright tropical daylight, realistic travel footage, no text, no visible phone screens."],
  ["doc-08-hotels-stays.mp4", "Cinematic documentary footage of a guest arriving at a boutique island hotel or beachfront guesthouse in Vanuatu, local staff welcome, luggage, tropical architecture, calm hospitality mood, no text, no visible phone screens."],
  ["doc-09-ferry-inter-island-travel.mp4", "Cinematic documentary scene of people boarding a local ferry or small inter-island boat in Vanuatu, bags and goods being loaded, blue water, practical island travel, natural motion, no text, no visible phone screens."],
  ["doc-10-expats-settling-in.mp4", "Cinematic documentary shot of an expat couple or professional walking through a home or property with a Ni-Vanuatu real estate agent, warm conversation, tropical residential setting, realistic and aspirational, no text, no visible phone screens."],
  ["doc-11-health-jobs-services.mp4", "Cinematic documentary montage-style shot of local health provider, pharmacy counter, and young Ni-Vanuatu professionals in a training or small office environment, hopeful community services mood, no text, no visible phone screens."],
  ["doc-12-business-community-closing.mp4", "Cinematic documentary shot of local business owners, vendors, drivers, visitors, and families moving through a lively Vanuatu community setting, connected and optimistic, premium launch film ending mood, no text, no visible phone screens."]
];

fs.mkdirSync(rawDir, { recursive: true });
fs.mkdirSync(logDir, { recursive: true });

for (const [fileName, prompt] of scenes) {
  const outFile = path.join(rawDir, fileName);
  if (fs.existsSync(outFile) && fs.statSync(outFile).size > 100000) {
    console.log(`Skipping existing ${fileName}`);
    continue;
  }

  console.log(`Generating ${fileName}`);
  const result = spawnSync("higgsfield", [
    "--no-color",
    "generate",
    "create",
    model,
    "--prompt",
    `${prompt} Negative prompt: no captions, no text, no fake logos, no phone screen closeups, no blank phones shown to camera, no distorted hands, no surreal faces, no extra limbs, no over-stylized sci-fi look.`,
    "--aspect_ratio",
    "16:9",
    "--duration",
    "5",
    "--wait",
    "--wait-timeout",
    "20m",
    "--wait-interval",
    "5s"
  ], { encoding: "utf8", maxBuffer: 1024 * 1024 * 16 });

  fs.writeFileSync(path.join(logDir, `${path.basename(fileName, ".mp4")}.log`), `${result.stdout}\n${result.stderr}`);
  if (result.status !== 0) {
    throw new Error(`Higgsfield failed for ${fileName}:\n${result.stderr || result.stdout}`);
  }

  const urls = [...result.stdout.matchAll(/https:\/\/[^\s"']+\.mp4[^\s"']*/g)].map((match) => match[0]);
  const url = urls.at(-1);
  if (!url) throw new Error(`Could not find MP4 URL for ${fileName}:\n${result.stdout}`);

  const curl = spawnSync("curl", ["-L", "--fail", "-o", outFile, url], { encoding: "utf8", maxBuffer: 1024 * 1024 * 16 });
  if (curl.status !== 0) {
    throw new Error(`Download failed for ${fileName}:\n${curl.stderr || curl.stdout}`);
  }
  console.log(`Saved ${outFile}`);
}
