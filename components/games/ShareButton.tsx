"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { shareOrCopy } from "@/lib/share";

type Props = {
  text: string;
  label?: string;
  className?: string;
};

export function ShareButton({ text, label = "Share with a friend", className }: Props) {
  async function handleShare() {
    const result = await shareOrCopy(text);
    if (result === "shared") toast.success("Shared");
    else if (result === "copied") toast.success("Copied to clipboard");
    else toast.error("Couldn't copy — try again");
  }

  return (
    <button
      onClick={handleShare}
      className={
        className ??
        "flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 font-display text-[15px] font-extrabold uppercase tracking-wide text-white transition-transform duration-100 active:translate-y-[2px]"
      }
      style={
        className
          ? undefined
          : {
              background: "linear-gradient(120deg, var(--accent) 0%, var(--game) 100%)",
              boxShadow: "0 4px 0 color-mix(in srgb, var(--game) 70%, black)",
            }
      }
    >
      <Share2 size={18} strokeWidth={2.6} />
      {label}
    </button>
  );
}
