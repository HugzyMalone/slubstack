"use client";

import { MultiplayerShell } from "@/components/multiplayer/MultiplayerShell";
import { flagBlitzAdapter } from "@/lib/games/flag-blitz/adapter";

export default function FlagBlitzPage() {
  return <MultiplayerShell adapter={flagBlitzAdapter} />;
}
