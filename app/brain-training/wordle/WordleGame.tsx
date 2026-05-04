import { motion } from "framer-motion";

export type TileState = "correct" | "present" | "absent" | "empty" | "active";
export type GamePhase = "playing" | "won" | "lost";

const MAX_GUESSES = 6;
const WORD_LEN = 5;
const TILE = 52;
const GAP = 4;
const KEY_H = 48;
const KEY_W = 32;
const KEY_W_WIDE = 52;

const KEY_COLORS: Record<TileState, string> = {
  correct: "#6aaa64",
  present: "#c9b458",
  absent:  "#3a3a3c",
  empty:   "color-mix(in srgb, var(--fg) 12%, var(--surface))",
  active:  "color-mix(in srgb, var(--fg) 12%, var(--surface))",
};

const TILE_COLORS: Record<"correct" | "present" | "absent", string> = {
  correct: "#6aaa64",
  present: "#c9b458",
  absent:  "#3a3a3c",
};

function evaluate(guess: string, solution: string): TileState[] {
  const result: TileState[] = Array(WORD_LEN).fill("absent");
  const sol = solution.split("");
  const gss = guess.split("");
  for (let i = 0; i < WORD_LEN; i++) {
    if (gss[i] === sol[i]) { result[i] = "correct"; sol[i] = "#"; gss[i] = "#"; }
  }
  for (let i = 0; i < WORD_LEN; i++) {
    if (gss[i] !== "#") {
      const idx = sol.indexOf(gss[i]);
      if (idx !== -1) { result[i] = "present"; sol[idx] = "#"; }
    }
  }
  return result;
}

function getKeyStates(guesses: string[], solution: string): Record<string, TileState> {
  const states: Record<string, TileState> = {};
  const priority: Record<TileState, number> = { correct: 3, present: 2, absent: 1, empty: 0, active: 0 };
  for (const g of guesses) {
    const ev = evaluate(g, solution);
    for (let i = 0; i < g.length; i++) {
      const l = g[i];
      if ((priority[ev[i]] ?? 0) > (priority[states[l]] ?? 0)) states[l] = ev[i];
    }
  }
  return states;
}

function WordleStyles() {
  return (
    <style>{`
      @keyframes wShake {
        0%,100%{transform:translateX(0)}
        25%{transform:translateX(-6px)}
        50%{transform:translateX(6px)}
        75%{transform:translateX(-3px)}
      }
      @keyframes wDance {
        0%,100%{transform:translateY(0)}
        40%{transform:translateY(-12px)}
        70%{transform:translateY(-4px)}
      }
    `}</style>
  );
}

function WordleTile({
  letter, evaluation, colIdx, isRevealing, isRevealed, popKey,
}: {
  letter: string; evaluation: TileState; colIdx: number;
  isRevealing: boolean; isRevealed: boolean; popKey?: number;
}) {
  const verdictColor = isRevealing || isRevealed
    ? evaluation === "correct" || evaluation === "present" || evaluation === "absent"
      ? TILE_COLORS[evaluation]
      : undefined
    : undefined;

  const borderColor = letter
    ? "color-mix(in srgb, var(--fg) 50%, transparent)"
    : "color-mix(in srgb, var(--fg) 20%, transparent)";

  const flipDelay = colIdx * 0.08;
  const flipDuration = 0.3;

  return (
    <div
      data-flipped={isRevealed || isRevealing ? "true" : "false"}
      style={{ perspective: 600, width: TILE, height: TILE }}
    >
      <motion.div
        key={popKey}
        initial={popKey !== undefined ? { scale: 0.8 } : false}
        animate={isRevealing ? { rotateX: 180, scale: 1 } : isRevealed ? { rotateX: 180, scale: 1 } : { rotateX: 0, scale: 1 }}
        transition={
          isRevealing
            ? { rotateX: { delay: flipDelay, duration: flipDuration, ease: "easeInOut" }, scale: { duration: 0.06 } }
            : isRevealed
            ? { rotateX: { duration: 0 }, scale: { duration: 0.06 } }
            : { scale: { duration: 0.06 } }
        }
        style={{ width: TILE, height: TILE, position: "relative", transformStyle: "preserve-3d" }}
      >
        {/* Front face — letter on surface */}
        <div
          className="font-display"
          style={{
            position: "absolute", inset: 0, backfaceVisibility: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: `2px solid ${borderColor}`, borderRadius: 5,
            fontSize: 24, fontWeight: 800, color: "var(--fg)", background: "var(--surface)",
            letterSpacing: "0.02em",
          }}
        >
          {letter}
        </div>
        {/* Back face — verdict colour */}
        <div
          className="font-display"
          style={{
            position: "absolute", inset: 0, backfaceVisibility: "hidden",
            transform: "rotateX(180deg)",
            display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 5, fontSize: 24, fontWeight: 800, color: "#fff",
            background: verdictColor ?? "var(--surface)",
            letterSpacing: "0.02em",
          }}
        >
          {letter}
        </div>
      </motion.div>
    </div>
  );
}

const KB_ROWS = [
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L"],
  ["ENTER","Z","X","C","V","B","N","M","⌫"],
];

function WordleKeyboard({ onKey, keyStates }: {
  onKey: (k: string) => void;
  keyStates: Record<string, TileState>;
}) {
  return (
    <div className="flex flex-col items-center gap-1 px-1">
      {KB_ROWS.map((row, ri) => (
        <div key={ri} className="flex gap-1">
          {row.map((key) => {
            const state = keyStates[key] ?? "empty";
            const isWide = key === "ENTER" || key === "⌫";
            return (
              <button
                key={key}
                onPointerDown={(e) => { e.preventDefault(); onKey(key); }}
                style={{
                  background: KEY_COLORS[state],
                  color: state === "empty" ? "var(--fg)" : "#fff",
                  width: isWide ? KEY_W_WIDE : KEY_W,
                  height: KEY_H,
                  borderRadius: 5,
                  fontSize: isWide ? 10 : 14,
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  transition: "background 0.3s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  userSelect: "none",
                }}
              >
                {key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function WordleGrid({
  rows, guesses, solution, revealingRow, revealedRows, shakingRow, phase, current,
}: {
  rows: string[][];
  guesses: string[];
  solution: string;
  revealingRow: number | null;
  revealedRows: Set<number>;
  shakingRow: number | null;
  phase: GamePhase;
  current: string;
}) {
  const gridWidth = WORD_LEN * TILE + (WORD_LEN - 1) * GAP;
  const wonRow = phase === "won" ? guesses.length - 1 : -1;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: `repeat(${MAX_GUESSES}, ${TILE}px)`,
        gap: GAP,
        width: gridWidth,
      }}
    >
      {rows.map((letters, ri) => {
        const isRevealing = revealingRow === ri;
        const isRevealed  = revealedRows.has(ri);
        const isShaking   = shakingRow === ri;
        const hasWon      = ri === wonRow && isRevealed;
        return (
          <div
            key={ri}
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${WORD_LEN}, ${TILE}px)`,
              gap: GAP,
              animation: isShaking
                ? "wShake 0.28s ease-in-out"
                : hasWon
                ? "wDance 0.5s ease-in-out 0.65s"
                : undefined,
            }}
          >
            {letters.map((letter, ci) => {
              const trimmed = letter.trim();
              const ev = (isRevealed || isRevealing) && guesses[ri]
                ? evaluate(guesses[ri], solution)[ci]
                : trimmed ? "active" : "empty";
              return (
                <WordleTile
                  key={ci}
                  letter={trimmed}
                  evaluation={ev}
                  colIdx={ci}
                  isRevealing={isRevealing}
                  isRevealed={isRevealed}
                  popKey={ri === guesses.length && phase === "playing" ? current.length : undefined}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export function WordleGame({
  guesses,
  current,
  phase,
  revealingRow,
  revealedRows,
  shakingRow,
  solution,
  onKey,
  layout = "fill",
}: {
  guesses: string[];
  current: string;
  phase: GamePhase;
  revealingRow: number | null;
  revealedRows: Set<number>;
  shakingRow: number | null;
  solution: string;
  onKey: (k: string) => void;
  layout?: "fill" | "stacked";
}) {
  const keyStates = getKeyStates(guesses, solution);
  const rows = Array.from({ length: MAX_GUESSES }, (_, i) => {
    if (i < guesses.length) return guesses[i].padEnd(WORD_LEN, " ").split("");
    if (i === guesses.length && phase === "playing") return current.padEnd(WORD_LEN, " ").split("");
    return Array(WORD_LEN).fill(" ");
  });

  if (layout === "stacked") {
    return (
      <>
        <WordleStyles />
        <WordleGrid
          rows={rows}
          guesses={guesses}
          solution={solution}
          revealingRow={revealingRow}
          revealedRows={revealedRows}
          shakingRow={shakingRow}
          phase={phase}
          current={current}
        />
        <div className="mt-4">
          <WordleKeyboard onKey={onKey} keyStates={keyStates} />
        </div>
      </>
    );
  }

  return (
    <>
      <WordleStyles />
      <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden">
        <WordleGrid
          rows={rows}
          guesses={guesses}
          solution={solution}
          revealingRow={revealingRow}
          revealedRows={revealedRows}
          shakingRow={shakingRow}
          phase={phase}
          current={current}
        />
      </div>
      <div
        className="shrink-0 pb-2"
        style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
      >
        <WordleKeyboard onKey={onKey} keyStates={keyStates} />
      </div>
    </>
  );
}

