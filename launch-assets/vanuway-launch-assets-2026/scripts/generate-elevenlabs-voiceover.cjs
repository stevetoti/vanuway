const fs = require("node:fs");
const path = require("node:path");
const https = require("node:https");

const root = path.resolve(__dirname, "..");
const repoRoot = path.resolve(root, "../..");
const env = readEnv(path.join(repoRoot, ".env.local"));

const apiKey = env.ELEVENLABS_API_KEY;
const femaleVoiceId = env.ELEVENLABS_FEMALE_VOICE_ID || env.ELEVENLABS_Female_VOICE_ID;
const maleVoiceId = env.ELEVENLABS_MALE_VOICE_ID || env.LABS_Male_VOICE_ID;
const modelId = env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";
const outDir = path.join(root, "higgsfield", "voiceover");

if (!apiKey) throw new Error("Missing ELEVENLABS_API_KEY in .env.local");
if (!femaleVoiceId) throw new Error("Missing ELEVENLABS_FEMALE_VOICE_ID in .env.local");

fs.mkdirSync(outDir, { recursive: true });

const flagshipScript = [
  "Vanuatu, meet VanuWay.",
  "One app for everyday Vanuatu.",
  "Book a ride, send a package, order food, shop from local stores, and buy or sell in the marketplace.",
  "Find hotels, discover tours and attractions, and plan ferry or flight travel between islands.",
  "Learn Bislama, stay informed with emergency updates, discover community events, and connect with local service providers.",
  "Browse real estate, access VanuHealth services, find jobs, and hire local talent through VanuJobs.",
  "For businesses, VanuWay helps you reach customers, manage listings, receive messages, track activity, and promote your business online.",
  "VanuWay is launching now.",
  "Visit vanuway.com or open app.vanuway.com."
].join(" ");

const reelScript = [
  "VanuWay is launching.",
  "Rides, delivery, food, shopping, marketplace, hotels, tours, ferry, flights, Bislama, alerts, events, providers, property, health, jobs, and business tools.",
  "One app for everyday Vanuatu.",
  "Visit vanuway.com or open app.vanuway.com."
].join(" ");

async function main() {
  await synthesize({
    voiceId: femaleVoiceId,
    text: flagshipScript,
    output: path.join(outDir, "vanuway-launch-voiceover-female.mp3")
  });

  if (maleVoiceId) {
    await synthesize({
      voiceId: maleVoiceId,
      text: flagshipScript,
      output: path.join(outDir, "vanuway-launch-voiceover-male.mp3")
    });
  }

  await synthesize({
    voiceId: femaleVoiceId,
    text: reelScript,
    output: path.join(outDir, "vanuway-launch-reel-voiceover-female.mp3")
  });

  fs.writeFileSync(
    path.join(outDir, "voiceover-script.txt"),
    `FLAGSHIP\n${flagshipScript}\n\nREEL\n${reelScript}\n`
  );

  console.log(`Generated ElevenLabs voiceovers in ${outDir}`);
}

function readEnv(file) {
  const result = {};
  if (!fs.existsSync(file)) return result;
  for (const line of fs.readFileSync(file, "utf8").split(/\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    const value = match[2].trim().replace(/^['"]|['"]$/g, "");
    result[key] = value;
  }
  return result;
}

function synthesize({ voiceId, text, output }) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: {
        stability: 0.46,
        similarity_boost: 0.82,
        style: 0.18,
        use_speaker_boost: true
      }
    });

    const request = https.request(
      {
        hostname: "api.elevenlabs.io",
        path: `/v1/text-to-speech/${encodeURIComponent(voiceId)}`,
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
          "Content-Length": Buffer.byteLength(body)
        }
      },
      (response) => {
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => {
          const buffer = Buffer.concat(chunks);
          if (response.statusCode >= 400) {
            reject(new Error(`ElevenLabs TTS failed (${response.statusCode}): ${buffer.toString("utf8")}`));
            return;
          }
          fs.writeFileSync(output, buffer);
          console.log(`${path.basename(output)} (${buffer.length} bytes)`);
          resolve();
        });
      }
    );

    request.on("error", reject);
    request.write(body);
    request.end();
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
