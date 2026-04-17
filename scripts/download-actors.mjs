import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "../public/actors");

const ACTORS = [
  "Tom Hanks", "Morgan Freeman", "Denzel Washington", "Samuel L. Jackson",
  "Brad Pitt", "Leonardo DiCaprio", "Matt Damon", "Johnny Depp",
  "Keanu Reeves", "Will Smith", "Tom Cruise", "Harrison Ford",
  "Robert De Niro", "Al Pacino", "Jack Nicholson", "Jim Carrey",
  "Robin Williams", "Eddie Murphy", "Meryl Streep", "Julia Roberts",
  "Sandra Bullock", "Cate Blanchett", "Nicole Kidman", "Charlize Theron",
  "Halle Berry", "Angelina Jolie", "Natalie Portman", "Scarlett Johansson",
  "Jennifer Lawrence", "Emma Stone", "Reese Witherspoon", "Viola Davis",
];

const slug = (name) => name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

for (const name of ACTORS) {
  await sleep(1200);
  try {
    const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`;
    const res = await fetch(apiUrl, { headers: { "User-Agent": "SlubstackApp/1.0 (hugo@slubstack.com)" } });
    const data = await res.json();
    const imgUrl = data.thumbnail?.source;
    if (!imgUrl) { console.log(`⚠  No image for ${name}`); continue; }

    const bigUrl = imgUrl.replace(/\/\d+px-/, "/400px-");
    const imgRes = await fetch(bigUrl, { headers: { "User-Agent": "Mozilla/5.0 (compatible; SlubstackApp/1.0)" } });
    if (!imgRes.ok) { console.log(`⚠  Failed to download image for ${name} (${imgRes.status})`); continue; }

    const ext = bigUrl.includes(".png") ? "png" : "jpg";
    const filename = `${slug(name)}.${ext}`;
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    writeFileSync(join(OUT_DIR, filename), buffer);
    console.log(`✓  ${name} → /actors/${filename}`);
  } catch (e) {
    console.log(`✗  ${name}: ${e.message}`);
  }
}

console.log("\nDone. Update actor configs with the paths above.");
