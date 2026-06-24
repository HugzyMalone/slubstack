import { ImageResponse } from "next/og";
import { getGhostRunSummary } from "@/lib/multiplayer/ghostRunSummary";

export const runtime = "nodejs";

export const alt = "Beat my score on Slubstack";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#1a0e26";
const SURFACE = "#261538";
const FG = "#fff1e0";
const MUTED = "#b4a0c8";
const ACCENT = "#ff8a4c";
const GAME = "#e83a8e";

export default async function Image({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const run = await getGhostRunSummary(runId).catch(() => null);

  const gameName = run?.gameName ?? "Slubstack";
  const score = run ? `${run.score}` : null;
  const scoreLabel = run?.scoreLabel ?? "pts";
  const who = run?.displayName ?? "A friend";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: `linear-gradient(135deg, ${BG} 0%, #2a1142 100%)`,
          padding: "72px 80px",
          fontFamily: "sans-serif",
          color: FG,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: 18,
              background: ACCENT,
              color: BG,
              fontSize: 40,
              fontWeight: 800,
            }}
          >
            S
          </div>
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -0.5 }}>Slubstack</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 30, color: MUTED, marginBottom: 8 }}>
            {`${who} challenged you on`}
          </div>
          <div style={{ fontSize: 64, fontWeight: 800, color: GAME, letterSpacing: -1 }}>
            {gameName}
          </div>

          {score !== null ? (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 18, marginTop: 36 }}>
              <div style={{ fontSize: 200, fontWeight: 900, lineHeight: 0.9, color: FG }}>
                {score}
              </div>
              <div style={{ fontSize: 44, fontWeight: 700, color: MUTED, marginBottom: 28 }}>
                {`${scoreLabel} to beat`}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 52, fontWeight: 700, color: FG, marginTop: 36 }}>
              A score is waiting to be beaten
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: ACCENT,
              color: BG,
              fontSize: 38,
              fontWeight: 800,
              padding: "20px 40px",
              borderRadius: 999,
            }}
          >
            Can you beat it?
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 28,
              color: MUTED,
              background: SURFACE,
              padding: "16px 28px",
              borderRadius: 999,
            }}
          >
            slubstack.com
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
