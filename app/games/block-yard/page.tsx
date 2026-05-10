"use client";

import Link from "next/link";
import { Blocks, ArrowLeft } from "lucide-react";

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
        <p className="mt-6 text-[12px] font-semibold tracking-widest text-muted uppercase">In development</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">BlockYard</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          A new game is being built and will slot in here soon. Come back shortly.
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
