import Link from "next/link";
import { Gamepad2, ArrowLeft } from "lucide-react";

export default function GamesNotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="flex max-w-md flex-col items-center text-center">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-3xl text-white shadow-md"
          style={{ background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)" }}
        >
          <Gamepad2 size={36} />
        </div>
        <p className="mt-6 text-[12px] font-semibold tracking-widest text-muted uppercase">Not found</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">No game here</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          That game does not exist or has moved. Browse the full line-up instead.
        </p>
        <Link
          href="/games"
          className="mt-8 flex items-center justify-center gap-2 rounded-2xl border border-border px-5 py-3 text-sm font-medium transition-colors hover:bg-border/30"
        >
          <ArrowLeft size={15} /> Back to Games
        </Link>
      </div>
    </div>
  );
}
