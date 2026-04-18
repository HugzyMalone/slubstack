"use client";

import Image from "next/image";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import type { PandaMood } from "./Panda";

const MOOD_IMAGE: Record<PandaMood, string> = {
  idle:        "/happy-bear1.png",
  happy:       "/surprised-bear1.png",
  celebrating: "/funny-bear2.png",
  sad:         "/sad-bear2.png",
  sleeping:    "/sad-bear2.png",
  wrong:       "/angrybear2.png",
};

const ALL_BEAR_IMAGES = Object.values(MOOD_IMAGE).filter((v, i, a) => a.indexOf(v) === i);

let preloaded = false;
function preloadBearImages() {
  if (preloaded || typeof window === "undefined") return;
  preloaded = true;
  ALL_BEAR_IMAGES.forEach((src) => {
    const img = new window.Image();
    img.src = src;
  });
}

type Props = {
  mood?: PandaMood;
  size?: number;
  fill?: boolean;
  className?: string;
};

export function Bear({ mood = "idle", size = 120, fill = false, className }: Props) {
  useEffect(() => { preloadBearImages(); }, []);
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
