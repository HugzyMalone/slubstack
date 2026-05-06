"use client";

import { MultiplayerShell } from "@/components/multiplayer/MultiplayerShell";
import { mathBlitzAdapter } from "@/lib/games/math-blitz/adapter";

export default function MathBlitzPage() {
  return <MultiplayerShell adapter={mathBlitzAdapter} />;
}
