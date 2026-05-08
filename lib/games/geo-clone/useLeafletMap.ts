"use client";

import { useEffect, useState, type RefObject } from "react";
import type * as LeafletNS from "leaflet";

export type LeafletMapOptions = {
  center: [number, number];
  zoom: number;
  worldCopyJump?: boolean;
};

let iconDefaultsPatched = false;

export function useLeafletMap(
  containerRef: RefObject<HTMLDivElement | null>,
  options: LeafletMapOptions
): LeafletNS.Map | null {
  const [map, setMap] = useState<LeafletNS.Map | null>(null);
  const centerKey = `${options.center[0]},${options.center[1]}`;
  const { zoom, worldCopyJump } = options;

  useEffect(() => {
    let cancelled = false;
    let instance: LeafletNS.Map | null = null;
    const [lat, lng] = centerKey.split(",").map(Number) as [number, number];

    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !containerRef.current) return;

      if (!iconDefaultsPatched) {
        delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });
        iconDefaultsPatched = true;
      }

      instance = L.map(containerRef.current, { center: [lat, lng], zoom, worldCopyJump });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 18,
        subdomains: "abcd",
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      }).addTo(instance);

      setMap(instance);
    })();

    return () => {
      cancelled = true;
      if (instance) {
        instance.remove();
        instance = null;
      }
      setMap(null);
    };
  }, [containerRef, centerKey, zoom, worldCopyJump]);

  return map;
}
