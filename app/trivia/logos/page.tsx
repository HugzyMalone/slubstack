"use client";

import { MultiplayerShell } from "@/components/multiplayer/MultiplayerShell";
import { logosAdapter } from "@/lib/games/logos/adapter";

export default function LogosPage() {
  return <MultiplayerShell adapter={logosAdapter} />;
}
