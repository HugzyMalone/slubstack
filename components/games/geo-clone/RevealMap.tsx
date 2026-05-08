"use client";

import { useEffect, useRef } from "react";
import type * as LeafletNS from "leaflet";
import { useLeafletMap } from "@/lib/games/geo-clone/useLeafletMap";

type RevealGuess = {
  slot: number;
  displayName: string;
  lat: number;
  lng: number;
};

type RevealMapProps = {
  actual: { lat: number; lng: number };
  guesses: ReadonlyArray<RevealGuess>;
};

const SLOT_COLOURS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
];

function colourForSlot(slot: number): string {
  const idx = ((slot % SLOT_COLOURS.length) + SLOT_COLOURS.length) % SLOT_COLOURS.length;
  return SLOT_COLOURS[idx];
}

export function RevealMap({ actual, guesses }: RevealMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const map = useLeafletMap(containerRef, {
    center: [actual.lat, actual.lng],
    zoom: 2,
    worldCopyJump: true,
  });

  useEffect(() => {
    if (!map) return;
    let cancelled = false;
    const layers: LeafletNS.Layer[] = [];

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled) return;

      const actualMarker = L.marker([actual.lat, actual.lng]).addTo(map);
      layers.push(actualMarker);

      for (const g of guesses) {
        const colour = colourForSlot(g.slot);
        const initial = (g.displayName.trim().charAt(0) || "?").toUpperCase();
        const icon = L.divIcon({
          className: "geo-clone-guess-icon",
          html: `<div style="background:${colour};color:#fff;width:24px;height:24px;border-radius:9999px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.4);">${initial}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        const marker = L.marker([g.lat, g.lng], { icon }).addTo(map);
        const line = L.polyline(
          [
            [g.lat, g.lng],
            [actual.lat, actual.lng],
          ],
          { color: colour, weight: 2, opacity: 0.8, dashArray: "6 6" }
        ).addTo(map);
        layers.push(marker, line);
      }

      const group = L.featureGroup(layers);
      map.fitBounds(group.getBounds(), { padding: [40, 40] });
    })();

    return () => {
      cancelled = true;
      for (const layer of layers) {
        if (map.hasLayer(layer)) map.removeLayer(layer);
      }
    };
  }, [map, actual, guesses]);

  return <div ref={containerRef} className="h-full w-full" />;
}
