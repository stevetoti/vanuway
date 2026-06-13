const fs = require("node:fs");
const path = require("node:path");
const https = require("node:https");

const root = path.resolve(__dirname, "..");
const repoRoot = path.resolve(root, "../..");
const env = readEnv(path.join(repoRoot, ".env.local"));

const apiKey = env.ELEVENLABS_API_KEY;
const voiceId = env.ELEVENLABS_MALE_VOICE_ID || env.ELEVENLABS_FEMALE_VOICE_ID;
const modelId = env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";
const outDir = path.join(root, "higgsfield", "voiceover");
const scriptFile = path.join(root, "content", "documentary-launch-script.md");

if (!apiKey) throw new Error("Missing ELEVENLABS_API_KEY in .env.local");
if (!voiceId) throw new Error("Missing ELEVENLABS_MALE_VOICE_ID or ELEVENLABS_FEMALE_VOICE_ID in .env.local");

fs.mkdirSync(outDir, { recursive: true });

const script = fs.readFileSync(scriptFile, "utf8")
  .split("## Production Voiceover")[1]
  .replace(/^#+ .+$/gm, "")
  .replace(/\n+/g, " ")
  .replace(/\s+/g, " ")
  .trim();

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

async function main() {
  const output = path.join(outDir, "vanuway-documentary-launch-voiceover-male.mp3");
  await synthesize({ text: script, output });
  fs.writeFileSync(path.join(outDir, "vanuway-documentary-launch-script.txt"), `${script}\n`);
  console.log(`Generated ${output}`);
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

function synthesize({ text, output }) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: {
        stability: 0.5,
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
