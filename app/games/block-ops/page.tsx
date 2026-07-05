import type { Metadata } from "next";
import { BlockOpsShell } from "@/components/games/block-ops/BlockOpsShell";

export const metadata: Metadata = {
  title: "Block Ops — 3v3 Team Deathmatch | Slubstack",
  description:
    "A free browser FPS. 3v3 team deathmatch in a blocky arena — host a room, share the code, bots fill the empty slots.",
};

export default function BlockOpsPage() {
  return <BlockOpsShell />;
}
