"use client";

import { useEffect, useRef, useState } from "react";
import { MapPinOff } from "lucide-react";
import type { Location } from "@/lib/games/geo-clone/adapter";

type StreetViewPanelProps = {
  location: Location;
};

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

type PanoStatus = "loading" | "ok" | "unavailable";

export function StreetViewPanel({ location }: StreetViewPanelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [panoStatus, setPanoStatus] = useState<PanoStatus>("loading");
  const [panoId, setPanoId] = useState<string | null>(null);

  // Reset to the loading state the moment the round changes, before the new
  // metadata fetch fires below.
  const locKey = `${location.lat},${location.lng},${location.name}`;
  const [prevLocKey, setPrevLocKey] = useState(locKey);
  if (locKey !== prevLocKey) {
    setPrevLocKey(locKey);
    setPanoStatus("loading");
    setPanoId(null);
  }

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

  useEffect(() => {
    if (!apiKey) return;
    const ctrl = new AbortController();
    // source=outdoor rejects indoor/user-contributed Photo Spheres so the iframe
    // can't snap to them. radius=80 gives some flex around the listed coord but
    // not enough to drift onto a parallel street.
    const url = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${location.lat},${location.lng}&source=outdoor&radius=80&key=${apiKey}`;
    fetch(url, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data: { status?: string; pano_id?: string }) => {
        if (data.status === "OK" && data.pano_id) {
          setPanoId(data.pano_id);
          setPanoStatus("ok");
        } else if (data.status === "ZERO_RESULTS" || data.status === "NOT_FOUND") {
          // Google confirmed there is no usable pano here — show the fallback.
          console.warn(`[GeoClone] No Street View imagery for ${location.name} (${location.lat},${location.lng}): ${data.status}`);
          setPanoStatus("unavailable");
        } else {
          // Metadata API itself errored (REQUEST_DENIED, OVER_QUERY_LIMIT, project
          // misconfigured, etc). Trust the Embed API instead of nuking the round.
          console.warn(`[GeoClone] Metadata pre-flight inconclusive for ${location.name}: ${data.status ?? "no status"} — falling through to iframe`);
          setPanoStatus("ok");
        }
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        // Network failure — fall back to location-based iframe so the round still plays.
        setPanoStatus("ok");
      });
    return () => ctrl.abort();
  }, [location.lat, location.lng, location.name]);

  if (!apiKey) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-bg p-8 text-center text-sm text-muted">
        Street View is unavailable — set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your env to play GeoClone.
      </div>
    );
  }

  // Prefer pano= over location= so we render the exact pano the metadata
  // pre-flight verified (and snap is not re-done by the Embed API).
  const src = panoId
    ? `https://www.google.com/maps/embed/v1/streetview?key=${apiKey}&pano=${panoId}&heading=${location.heading}&pitch=0&fov=80`
    : `https://www.google.com/maps/embed/v1/streetview?key=${apiKey}&location=${location.lat},${location.lng}&heading=${location.heading}&pitch=0&fov=80`;

  return (
    <div ref={containerRef} className="relative h-full w-full touch-none overflow-hidden">
      {panoStatus !== "unavailable" && (
        <iframe
          key={panoId ?? `${location.lat},${location.lng}`}
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
      )}
      {panoStatus === "unavailable" && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center"
          style={{
            background: "linear-gradient(135deg, #1e1b2e 0%, #2a2440 100%)",
            color: "var(--fg)",
          }}
        >
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: "color-mix(in srgb, var(--fg) 14%, transparent)" }}
          >
            <MapPinOff size={28} />
          </div>
          <div className="text-base font-black tracking-tight">Street View unavailable here</div>
          <div className="max-w-xs text-sm text-muted">
            This pano isn&apos;t loading. Make your best guess on the map below — everyone playing is in the same boat for this round.
          </div>
        </div>
      )}
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
