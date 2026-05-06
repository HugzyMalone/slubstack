"use client";

import { MultiplayerShell } from "@/components/multiplayer/MultiplayerShell";
import { higherLowerAdapter } from "@/lib/games/higher-lower/adapter";

export default function HigherLowerPage() {
  return <MultiplayerShell adapter={higherLowerAdapter} />;
}
