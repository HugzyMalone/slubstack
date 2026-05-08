"use client";

import { useEffect, useRef } from "react";
import type * as LeafletNS from "leaflet";
import type { Guess } from "@/lib/games/geo-clone/adapter";
import { useLeafletMap } from "@/lib/games/geo-clone/useLeafletMap";

type GuessMapProps = {
  onGuess: (guess: Guess) => void;
  guess: Guess | null;
  disabled?: boolean;
};

export function GuessMap({ onGuess, guess, disabled = false }: GuessMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const map = useLeafletMap(containerRef, { center: [20, 0], zoom: 2, worldCopyJump: true });
  const markerRef = useRef<LeafletNS.Marker | null>(null);
  const onGuessRef = useRef(onGuess);
  onGuessRef.current = onGuess;

  useEffect(() => {
    if (!map) return;
    const handler = (e: LeafletNS.LeafletMouseEvent) => {
      onGuessRef.current({ lat: e.latlng.lat, lng: e.latlng.lng });
    };
    map.on("click", handler);
    return () => {
      map.off("click", handler);
    };
  }, [map]);

  useEffect(() => {
    if (!map) return;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled) return;
      if (!guess) {
        if (markerRef.current) {
          markerRef.current.remove();
          markerRef.current = null;
        }
        return;
      }
      if (markerRef.current) {
        markerRef.current.setLatLng([guess.lat, guess.lng]);
      } else {
        markerRef.current = L.marker([guess.lat, guess.lng]).addTo(map);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [map, guess]);

  useEffect(() => {
    if (!map) return;
    if (disabled) {
      map.dragging.disable();
      map.scrollWheelZoom.disable();
      map.doubleClickZoom.disable();
      map.touchZoom.disable();
    } else {
      map.dragging.enable();
      map.scrollWheelZoom.enable();
      map.doubleClickZoom.enable();
      map.touchZoom.enable();
    }
  }, [map, disabled]);

  return <div ref={containerRef} className="h-full w-full" />;
}
