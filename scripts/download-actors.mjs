import { writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "../public/actors");

// Full actor list — matches ACTOR_CONFIGS in app/trivia/actors/page.tsx
const ACTORS = [
  // Batch 1
  "Tom Hanks", "Morgan Freeman", "Denzel Washington", "Samuel L. Jackson",
  "Brad Pitt", "Leonardo DiCaprio", "Matt Damon", "Johnny Depp",
  "Keanu Reeves", "Will Smith", "Tom Cruise", "Harrison Ford",
  "Robert De Niro", "Al Pacino", "Jack Nicholson", "Jim Carrey",
  "Robin Williams", "Eddie Murphy", "Meryl Streep", "Julia Roberts",
  "Sandra Bullock", "Cate Blanchett", "Nicole Kidman", "Charlize Theron",
  "Halle Berry", "Angelina Jolie", "Natalie Portman", "Scarlett Johansson",
  "Jennifer Lawrence", "Emma Stone", "Reese Witherspoon", "Viola Davis",
  // Batch 2
  "Chris Hemsworth", "Chris Pratt", "Ryan Reynolds", "Ryan Gosling",
  "Robert Downey Jr.", "Hugh Jackman", "Dwayne Johnson", "Ben Affleck",
  "Bradley Cooper", "Jake Gyllenhaal", "Joaquin Phoenix", "Benedict Cumberbatch",
  "Timothée Chalamet", "Margot Robbie", "Emily Blunt", "Amy Adams",
  "Keira Knightley", "Rachel McAdams", "Megan Fox", "Mila Kunis",
  "Anne Hathaway", "Kate Winslet", "Zoe Saldana", "Jennifer Aniston",
  "Clint Eastwood", "Mel Gibson", "Russell Crowe", "Arnold Schwarzenegger",
  "Sylvester Stallone", "Bruce Willis", "Nicolas Cage", "Gary Oldman",
  "Anthony Hopkins", "Michael Caine", "Judi Dench", "Helen Mirren",
  // Batch 3
  "George Clooney", "Idris Elba", "Michael B. Jordan", "Chadwick Boseman",
  "Liam Neeson", "Paul Rudd", "Mark Ruffalo", "Tom Hiddleston",
  "Daniel Craig", "Jeremy Renner", "Jared Leto", "Tobey Maguire",
  "Mark Wahlberg", "Jamie Foxx", "Forest Whitaker", "Jeff Bridges",
  "Adam Sandler", "Pedro Pascal", "Zendaya", "Florence Pugh",
  "Ana de Armas", "Gal Gadot", "Brie Larson", "Lupita Nyong'o",
  "Taraji P. Henson", "Octavia Spencer", "Angela Bassett", "Sigourney Weaver",
  "Jodie Foster", "Glenn Close", "Winona Ryder",
];

// Must match buildActors() in page.tsx: spaces→underscores, lowercase
const toFilename = (name) => name.replace(/ /g, "_").toLowerCase() + ".jpg";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const UA = "SlubstackApp/1.0 (hugo@slubstack.com; https://slubstack.com)";

async function fetchWithRetry(url, headers, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, { headers });
    if (res.status === 429) {
      const wait = 2000 * (i + 1);
      console.log(`    rate-limited, retrying in ${wait}ms…`);
      await sleep(wait);
      continue;
    }
    return res;
  }
  throw new Error("Too many retries (429)");
}

let ok = 0, skip = 0, fail = 0;

for (const name of ACTORS) {
  const filename = toFilename(name);
  const destPath = join(OUT_DIR, filename);

  if (existsSync(destPath)) {
    console.log(`  skip  ${filename}`);
    skip++;
    continue;
  }

  await sleep(1200);
  try {
    const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`;
    const res = await fetchWithRetry(apiUrl, { "User-Agent": UA });
    const data = await res.json();
    // Always use thumbnail URL — it has the /NNNpx- pattern we can swap out
    const rawUrl = data.thumbnail?.source;
    if (!rawUrl) { console.log(`  ⚠  no image  ${name}`); fail++; continue; }

    // 500px: crisp on mobile, ~50-100KB per image
    const bigUrl = rawUrl.replace(/\/\d+px-/, "/500px-");
    const imgRes = await fetchWithRetry(bigUrl, { "User-Agent": UA });
    if (!imgRes.ok) { console.log(`  ⚠  download failed ${name} (${imgRes.status})`); fail++; continue; }

    const buffer = Buffer.from(await imgRes.arrayBuffer());
    writeFileSync(destPath, buffer);
    console.log(`  ✓  ${filename}`);
    ok++;
  } catch (e) {
    console.log(`  ✗  ${name}: ${e.message}`);
    fail++;
  }
}

console.log(`\nDone: ${ok} downloaded, ${skip} skipped, ${fail} failed`);
