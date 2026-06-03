"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { PandaMood } from "./Panda";

const MOOD_IMAGE: Record<PandaMood, string> = {
  idle:        "/happy-bear1.webp",
  happy:       "/surprised-bear1.webp",
  celebrating: "/funny-bear2.webp",
  sad:         "/sad-bear2.webp",
  sleeping:    "/sad-bear2.webp",
  wrong:       "/angrybear2.webp",
};

type Props = {
  mood?: PandaMood;
  size?: number;
  fill?: boolean;
  className?: string;
};

export function Bear({ mood = "idle", size = 120, fill = false, className }: Props) {
  const src = MOOD_IMAGE[mood];

  if (fill) {
    return (
      <div className={cn("relative select-none w-full h-full", className)}>
        <Image
          src={src}
          alt="Bear"
          fill
          className="object-contain drop-shadow-xl transition-all duration-300"
          priority
        />
      </div>
    );
  }

  return (
    <div
      className={cn("inline-block select-none shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt="Bear"
        width={size}
        height={size}
        className="object-contain drop-shadow-xl transition-all duration-300"
        priority
      />
    </div>
  );
}
