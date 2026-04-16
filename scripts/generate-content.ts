/**
 * Content generator for new vocabulary categories (or future languages / sentences / dialogues).
 *
 * Usage:
 *   pnpm tsx scripts/generate-content.ts --category <slug> --count 20
 *   pnpm tsx scripts/generate-content.ts --category food --count 30 > draft.json
 *
 * Reads ANTHROPIC_API_KEY from env (.env.local). Prints JSON to stdout for you to review
 * and merge into content/mandarin/vocab.json.
 *
 * The prompt deliberately asks for NATIVE-SPOKEN phrasing, not textbook translation.
 * Every card gets a usage/cultural note when one would help a beginner.
 */
import Anthropic from "@anthropic-ai/sdk";
import "dotenv/config";

const args = new Map<string, string>();
process.argv.slice(2).forEach((tok, i, a) => {
  if (tok.startsWith("--")) args.set(tok.slice(2), a[i + 1] ?? "");
});

const category = args.get("category");
const count = Number(args.get("count") ?? 20);
if (!category) {
  console.error("Missing --category");
  process.exit(1);
}

const SYSTEM = `You generate Mandarin beginner vocabulary for a flashcard app.

Authenticity is the #1 goal. Give the word or phrase a native speaker would actually use, not a textbook literal translation. If the textbook form is stilted in real life, pick the casual/common form and flag the difference in the note.

Output schema (JSON array only, no prose):
{
  "id": string,              // "<category-short>-NN"
  "category": string,         // the category slug passed in
  "hanzi": string,            // simplified characters
  "pinyin": string,           // with tone marks (mǎ not ma3)
  "english": string,          // natural English, not a dictionary headword
  "note"?: string             // only if a beginner would be confused or miss nuance
}

Prefer high-frequency words. Do not include duplicates. Do not translate proper nouns.`;

const USER = `Produce ${count} beginner Mandarin cards for category "${category}".
Return ONLY a JSON array.`;

async function main() {
  const client = new Anthropic();
  const res = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 4096,
    system: SYSTEM,
    messages: [{ role: "user", content: USER }],
  });
  const block = res.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("No text block returned");
  const text = block.text.trim();
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  console.log(text.slice(start, end + 1));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
