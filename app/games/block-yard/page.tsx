import { Blocks, ArrowLeft, Play, Users } from "lucide-react";
import Link from "next/link";

export default function BlockYardPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="flex max-w-md flex-col items-center text-center">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-3xl text-white shadow-md"
          style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" }}
        >
          <Blocks size={36} />
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight">BlockYard</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          A multiplayer voxel sandbox. Fly around a shared island and build together
          with other Slubstack players — creative mode, no accounts to set up.
        </p>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-[13px] text-muted">
          <Users size={14} /> Up to 8 players · signed-in only
        </p>

        <a
          href="/blockyard"
          className="mt-8 flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white shadow-md transition-transform hover:-translate-y-0.5"
          style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" }}
        >
          <Play size={16} /> Play BlockYard
        </a>
        <Link
          href="/games"
          className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-border px-5 py-3 text-sm font-medium transition-colors hover:bg-border/30"
        >
          <ArrowLeft size={15} /> Back to Games
        </Link>
      </div>
    </div>
  );
}
