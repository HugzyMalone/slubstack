"use client";

import { MultiplayerShell } from "@/components/multiplayer/MultiplayerShell";
import { postersAdapter } from "@/lib/games/posters/adapter";

export default function PostersPage() {
  return <MultiplayerShell adapter={postersAdapter} />;
}
