"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";

export type PandaMood = "idle" | "happy" | "sad" | "celebrating" | "sleeping";

const PANDAS = [
  "/3dpanda.png",
  "/3dpanda-angry.png",
  "/3dpanda-sad.png",
  "/3dpanda-wink.png",
  "/3dpanda-wink2.png",
];

type Props = {
  mood?: PandaMood;
  size?: number;
  className?: string;
};

export function Panda({ size = 120, className }: Props) {
  const [src, setSrc] = useState(PANDAS[0]);

  useEffect(() => {
    setSrc(PANDAS[Math.floor(Math.random() * PANDAS.length)]);
  }, []);

  const bounce = { y: [0, -6, 0] };

  return (
    <motion.div
      className={cn("inline-block select-none", className)}
      style={{ width: size, height: size }}
      animate={bounce}
      transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
    >
      <Image
        src={src}
        alt="Panda"
        width={size}
        height={size}
        className="object-contain drop-shadow-md"
        priority
      />
    </motion.div>
  );
}

/** Standalone image for use outside motion contexts (logo, favicon etc.) */
export function PandaImage({ size = 32, className }: { size?: number; className?: string }) {
  const [src, setSrc] = useState(PANDAS[0]);

  useEffect(() => {
    setSrc(PANDAS[Math.floor(Math.random() * PANDAS.length)]);
  }, []);

  return (
    <Image
      src={src}
      alt="Panda"
      width={size}
      height={size}
      className={cn("object-contain", className)}
    />
  );
}
