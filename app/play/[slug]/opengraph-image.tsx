import { ImageResponse } from "next/og";
import { getGameBySlug } from "@/lib/games/catalog";

export const runtime = "nodejs";

export const alt = "Play free daily games on Slubstack";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#1a0e26";
const SURFACE = "#261538";
const FG = "#fff1e0";
const MUTED = "#b4a0c8";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = getGameBySlug(slug);

  const name = game?.name ?? "Slubstack";
  const accent = game?.accent ?? "#ff8a4c";
  const tagline = game ? "Free daily game on" : "Free daily games on";

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
              background: accent,
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
          <div style={{ fontSize: 32, color: MUTED, marginBottom: 12 }}>{`${tagline} Slubstack`}</div>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              alignItems: "center",
              background: accent,
              color: BG,
              fontSize: 88,
              fontWeight: 900,
              letterSpacing: -2,
              padding: "24px 44px",
              borderRadius: 28,
            }}
          >
            {name}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              border: `4px solid ${accent}`,
              color: FG,
              fontSize: 38,
              fontWeight: 800,
              padding: "18px 40px",
              borderRadius: 999,
            }}
          >
            Play free, no sign-up
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
