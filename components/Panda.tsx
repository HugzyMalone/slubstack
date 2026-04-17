"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

export type PandaMood = "idle" | "happy" | "sad" | "celebrating" | "sleeping" | "wrong";

const MOOD_IMAGE: Record<PandaMood, string> = {
  idle:        "/3dpanda.png",
  happy:       "/3dpanda-wink.png",
  celebrating: "/3dpanda-wink2.png",
  sad:         "/3dpanda-sad.png",
  sleeping:    "/3dpanda-sad.png",
  wrong:       "/3dpanda-angry.png",
};

type Props = {
  mood?: PandaMood;
  size?: number;
  fill?: boolean;
  className?: string;
};

export function Panda({ mood = "idle", size = 120, fill = false, className }: Props) {
  const src = MOOD_IMAGE[mood];

  if (fill) {
    return (
      <div className={cn("relative select-none w-full h-full", className)}>
        <Image
          src={src}
          alt="Panda"
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
        alt="Panda"
        width={size}
        height={size}
        className="object-contain drop-shadow-xl transition-all duration-300"
        priority
      />
    </div>
  );
}

/** Small panda for TopBar logo — always idle */
export function PandaImage({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <Image
      src={MOOD_IMAGE.idle}
      alt="Panda"
      width={size}
      height={size}
      className={cn("object-contain", className)}
    />
  );
}
