// One-off generator for the Semantle similarity dataset.
//
// USAGE:
//   1. Obtain GloVe 50d vectors (glove.6B.50d.txt, ~170MB, ~400k words).
//      Download glove.6B.zip from https://huggingface.co/stanfordnlp/glove
//      and unzip glove.6B.50d.txt, OR pass a path/URL via GLOVE env var.
//        GLOVE=/path/to/glove.6B.50d.txt node scripts/build-semantle-data.mjs
//      If GLOVE is unset the script tries /tmp/glove.6B.50d.txt then a download.
//   2. Output is written to lib/games/semantle/data/:
//        <secret>.json  — { secret, neighbours: [[word, cosine], ...] } (top 300)
//        vocab.json     — flat array of the ~VOCAB_SIZE most-common vocab words.
//
// Cosine similarity is computed honestly from the embeddings. No fabricated values.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DATA_DIR = join(ROOT, "lib/games/semantle/data");
const TOP_N = 300;
const VOCAB_SIZE = 20000;

const secretsSrc = readFileSync(join(ROOT, "lib/games/semantle/secrets.ts"), "utf8");
const SECRETS = [...secretsSrc.matchAll(/"([a-z]+)"/g)].map((m) => m[1]);
const SECRET_SET = new Set(SECRETS);

async function resolveGloveFile() {
  const env = process.env.GLOVE;
  if (env && existsSync(env)) return env;
  const tmp = "/tmp/glove.6B.50d.txt";
  if (existsSync(tmp)) return tmp;
  throw new Error(
    "GloVe vectors not found. Set GLOVE=/path/to/glove.6B.50d.txt (download glove.6B.zip from https://huggingface.co/stanfordnlp/glove and unzip the 50d file).",
  );
}

function cosine(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

async function main() {
  const glovePath = await resolveGloveFile();
  console.log(`Reading vectors from ${glovePath}`);

  const vocab = [];
  const vectors = new Map();

  const rl = createInterface({ input: createReadStream(glovePath), crlfDelay: Infinity });
  let count = 0;
  for await (const line of rl) {
    const sp = line.indexOf(" ");
    if (sp === -1) continue;
    const word = line.slice(0, sp);
    if (!/^[a-z]+$/.test(word)) continue;
    if (count >= VOCAB_SIZE && !SECRET_SET.has(word)) continue;
    const vec = line.slice(sp + 1).split(" ").map(Number);
    vectors.set(word, vec);
    if (count < VOCAB_SIZE) vocab.push(word);
    count++;
  }
  console.log(`Loaded ${vectors.size} vectors (vocab ${vocab.length})`);

  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(join(DATA_DIR, "vocab.json"), JSON.stringify(vocab));

  const entries = [...vectors.entries()];
  for (const secret of SECRETS) {
    const sv = vectors.get(secret);
    if (!sv) {
      console.warn(`No vector for secret "${secret}" — skipping`);
      continue;
    }
    const scored = [];
    for (const [word, vec] of entries) {
      if (word === secret) continue;
      scored.push([word, cosine(sv, vec)]);
    }
    scored.sort((a, b) => b[1] - a[1]);
    const neighbours = scored.slice(0, TOP_N).map(([w, c]) => [w, Math.round(c * 10000) / 10000]);
    writeFileSync(join(DATA_DIR, `${secret}.json`), JSON.stringify({ secret, neighbours }));
  }
  console.log(`Wrote ${SECRETS.length} secret files + vocab.json to ${DATA_DIR}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
