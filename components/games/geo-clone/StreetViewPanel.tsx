"use client";

import { useEffect, useRef } from "react";
import type { Location } from "@/lib/games/geo-clone/adapter";

type StreetViewPanelProps = {
  location: Location;
};

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export function StreetViewPanel({ location }: StreetViewPanelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Block iOS rubber-band only when the touch originates inside the pano container,
  // so the GuessMap's touch panning still works.
  useEffect(() => {
    const handler = (e: TouchEvent) => {
      const target = e.target as Node | null;
      if (target && containerRef.current?.contains(target)) {
        e.preventDefault();
      }
    };
    document.addEventListener("touchmove", handler, { passive: false });
    return () => document.removeEventListener("touchmove", handler);
  }, []);

  if (!apiKey) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-bg p-8 text-center text-sm text-muted">
        Street View is unavailable — set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your env to play GeoClone.
      </div>
    );
  }

  const src = `https://www.google.com/maps/embed/v1/streetview?key=${apiKey}&location=${location.lat},${location.lng}&heading=${location.heading}&pitch=0&fov=80`;

  return (
    <div ref={containerRef} className="relative h-full w-full touch-none overflow-hidden">
      <iframe
        key={`${location.lat},${location.lng}`}
        src={src}
        className="absolute border-0"
        style={{
          top: -56,
          left: -40,
          width: "calc(100% + 80px)",
          height: "calc(100% + 168px)",
        }}
        loading="eager"
        referrerPolicy="no-referrer-when-downgrade"
        allow="accelerometer; gyroscope"
        allowFullScreen
        title="Street View"
      />
      <div
        aria-hidden
        className="absolute bottom-0 left-0 right-0 z-10"
        style={{
          height: 56,
          background: "var(--bg)",
        }}
      />
    </div>
  );
}
