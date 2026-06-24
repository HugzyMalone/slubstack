import type { Metadata } from "next";
import { getGhostRunSummary } from "@/lib/multiplayer/ghostRunSummary";
import { DuelClient } from "./DuelClient";

type Props = { params: Promise<{ runId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { runId } = await params;
  const run = await getGhostRunSummary(runId).catch(() => null);

  const title = run
    ? `Beat my score on ${run.gameName} — Slubstack`
    : "Take on this duel — Slubstack";
  const description = run
    ? `${run.displayName} scored ${run.score} ${run.scoreLabel} on ${run.gameName}. Can you beat it?`
    : "Someone has challenged you to a duel on Slubstack. Can you beat their score?";

  const ogImage = `/duel/${runId}/opengraph-image`;

  return {
    title,
    description,
    openGraph: {
      type: "website",
      siteName: "Slubstack",
      title,
      description,
      url: `/duel/${runId}`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default function DuelPage() {
  return <DuelClient />;
}
