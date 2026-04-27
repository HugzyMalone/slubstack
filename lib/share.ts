/**
 * Share-card generators — NYT-style emoji grids and one-liners.
 * Returned strings are copied to clipboard; no images, no API.
 */

export type WordleRow = ("correct" | "present" | "absent")[];

export function wordleShareCard({
  dayNumber,
  attempts,
  rows,
  solved,
}: {
  dayNumber: number;
  attempts: number; // 1..6
  rows: WordleRow[];
  solved: boolean;
}): string {
  const header = `Slubstack Wordle #${dayNumber} · ${solved ? attempts : "X"}/6`;
  const grid = rows
    .map((row) =>
      row
        .map((cell) => (cell === "correct" ? "🟩" : cell === "present" ? "🟨" : "⬛"))
        .join("")
    )
    .join("\n");
  return `${header}\n\n${grid}\n\nslubstack.com`;
}

export function mathBlitzShareCard({
  score,
  difficulty,
  correct,
  pb,
}: {
  score: number;
  difficulty: "easy" | "medium" | "hard";
  correct: number;
  pb: boolean;
}): string {
  const tier = difficulty === "easy" ? "🟢" : difficulty === "medium" ? "🟡" : "🔴";
  const pbStamp = pb ? " 🏆 NEW BEST" : "";
  return `Slubstack Math Blitz ${tier} ${difficulty.toUpperCase()}\nScore: ${score} · ${correct} correct${pbStamp}\n\nslubstack.com`;
}

export function connectionsShareCard({
  dayNumber,
  mistakes,
  solved,
  groupColours,
}: {
  dayNumber: number;
  mistakes: number;
  solved: boolean;
  groupColours: ("yellow" | "green" | "blue" | "purple")[][];
}): string {
  const map = { yellow: "🟨", green: "🟩", blue: "🟦", purple: "🟪" };
  const grid = groupColours.map((row) => row.map((c) => map[c]).join("")).join("\n");
  const header = `Slubstack Connections #${dayNumber}\n${solved ? "✅" : "❌"} · ${mistakes}/4 mistakes`;
  return `${header}\n\n${grid}\n\nslubstack.com`;
}

export function actorBlitzShareCard({
  score,
  correct,
  total,
  pb,
}: {
  score: number;
  correct: number;
  total: number;
  pb: boolean;
}): string {
  const pbStamp = pb ? " 🏆 NEW BEST" : "";
  return `Slubstack Actor Blitz 🎬\nScore: ${score} · ${correct}/${total} correct${pbStamp}\n\nslubstack.com`;
}

export function lessonShareCard({
  language,
  unitTitle,
  xpGained,
}: {
  language: string;
  unitTitle: string;
  xpGained: number;
}): string {
  return `Slubstack ${language}\nFinished "${unitTitle}" · +${xpGained} XP\n\nslubstack.com`;
}

/** Tries native share, falls back to clipboard. Returns "shared" | "copied" | "failed". */
export async function shareOrCopy(text: string): Promise<"shared" | "copied" | "failed"> {
  if (typeof navigator === "undefined") return "failed";
  const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
  if (nav.share) {
    try {
      await nav.share({ text });
      return "shared";
    } catch {
      // user cancelled — fall through to copy as a courtesy
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}
