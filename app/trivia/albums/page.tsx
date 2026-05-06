"use client";

import { MultiplayerShell } from "@/components/multiplayer/MultiplayerShell";
import { albumsAdapter } from "@/lib/games/albums/adapter";

export default function AlbumsPage() {
  return <MultiplayerShell adapter={albumsAdapter} />;
}
