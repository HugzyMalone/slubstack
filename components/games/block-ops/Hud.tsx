"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Crosshair, Pause, RefreshCw, Repeat, ArrowBigUp, Table2 } from "lucide-react";
import {
  KILL_LIMIT,
  TEAMS,
  WEAPONS,
  type HudState,
  type KillFeedEntry,
  type ScoreRow,
  type Team,
} from "@/lib/games/block-ops/types";

type HudProps = {
  hud: HudState;
  feed: KillFeedEntry[];
  hitmarker: { key: number; hs: boolean } | null;
  damageKey: number;
  myTeam: Team;
  myId: string;
  touch: boolean;
  pointerLocked: boolean;
  scoreboardOpen: boolean;
  rows: ScoreRow[];
  onLockRequest: () => void;
  onTouchMove: (x: number, y: number) => void;
  onTouchLook: (dx: number, dy: number) => void;
  onFire: (down: boolean) => void;
  onAdsToggle: () => void;
  adsOn: boolean;
  onJump: () => void;
  onReload: () => void;
  onSwap: () => void;
  onScoreboard: (open: boolean) => void;
  onPause: () => void;
};

function fmtClock(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function Hud(props: HudProps) {
  const { hud, feed, hitmarker, damageKey, myTeam, touch } = props;
  const dead = hud.dead;
  const lowHp = hud.hp < 40 && !dead;

  return (
    <div className="pointer-events-none absolute inset-0 select-none" style={{ touchAction: "none" }}>
      {/* Damage vignette */}
      <AnimatePresence>
        {damageKey > 0 && (
          <motion.div
            key={damageKey}
            initial={{ opacity: 0.55 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse at center, transparent 45%, rgba(220,38,38,0.55) 100%)" }}
          />
        )}
      </AnimatePresence>
      {lowHp && (
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at center, transparent 55%, rgba(220,38,38,0.4) 100%)",
            opacity: (40 - hud.hp) / 40,
          }}
        />
      )}

      {/* Top bar: scores + clock */}
      <div className="absolute left-1/2 top-3 flex -translate-x-1/2 items-center gap-2">
        <ScorePill team={0} score={hud.scores[0]} mine={myTeam === 0} />
        <div className="rounded-xl bg-black/55 px-3 py-1.5 text-center backdrop-blur-sm">
          <div className="text-[15px] font-black tabular-nums leading-none text-white">{fmtClock(hud.msLeft)}</div>
          <div className="mt-0.5 text-[8px] font-bold uppercase tracking-widest text-white/50">first to {KILL_LIMIT}</div>
        </div>
        <ScorePill team={1} score={hud.scores[1]} mine={myTeam === 1} />
      </div>

      {/* Kill feed */}
      <div className="absolute right-3 top-3 flex flex-col items-end gap-1">
        <AnimatePresence>
          {feed.map((f) => (
            <motion.div
              key={f.key}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-lg bg-black/55 px-2.5 py-1 text-[12px] font-bold backdrop-blur-sm"
            >
              <span style={{ color: TEAMS[f.attackerTeam].color }}>{f.attacker}</span>
              <span className="mx-1.5 text-white/70">{f.hs ? "⊕" : "✕"}</span>
              <span style={{ color: TEAMS[f.victimTeam].color }}>{f.victim}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Crosshair + hitmarker */}
      {!dead && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <CrosshairMark ads={hud.ads} />
          <AnimatePresence>
            {hitmarker && (
              <motion.div
                key={hitmarker.key}
                initial={{ opacity: 1, scale: 1 }}
                animate={{ opacity: 0, scale: 1.5 }}
                transition={{ duration: 0.22 }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xl font-black"
                style={{ color: hitmarker.hs ? "#fbbf24" : "#ffffff" }}
              >
                ✕
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Bottom left: health */}
      <div className="absolute bottom-4 left-4 lg:bottom-6 lg:left-6">
        <div className="flex items-end gap-2">
          <span
            className="text-4xl font-black tabular-nums leading-none"
            style={{ color: lowHp ? "#f87171" : "#ffffff", textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}
          >
            {hud.hp}
          </span>
          <div className="mb-1 h-2.5 w-28 overflow-hidden rounded-full bg-black/45">
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{
                width: `${hud.hp}%`,
                background: lowHp ? "#ef4444" : "linear-gradient(90deg,#4ade80,#22c55e)",
              }}
            />
          </div>
        </div>
        {hud.spawnProtected && (
          <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-cyan-300" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
            spawn shield
          </div>
        )}
        <div className="mt-1 text-[11px] font-bold text-white/70" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
          {hud.kills} kills · {hud.deaths} deaths
        </div>
      </div>

      {/* Bottom right: ammo (lifted clear of the touch button cluster) */}
      <div className={touch ? "absolute bottom-[272px] right-4 text-right" : "absolute bottom-4 right-4 text-right lg:bottom-6 lg:right-6"}>
        <div className="text-[11px] font-bold uppercase tracking-widest text-white/70" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
          {WEAPONS[hud.weapon].name}
        </div>
        {hud.reloading ? (
          <div className="mt-0.5 flex items-center justify-end gap-1.5 text-lg font-black text-amber-300" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}>
            <RefreshCw size={16} className="animate-spin" /> RELOADING
          </div>
        ) : (
          <div className={`${touch ? "text-3xl" : "text-4xl"} font-black tabular-nums leading-tight text-white`} style={{ textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}>
            {hud.ammo}
            <span className="text-lg text-white/55"> / {hud.magSize}</span>
          </div>
        )}
      </div>

      {/* Death overlay */}
      {dead && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/45">
          <div className="text-center">
            <div className="text-sm font-bold uppercase tracking-[0.3em] text-red-400">eliminated</div>
            <div className="mt-2 text-2xl font-black text-white">by {dead.by}</div>
            <div className="mt-3 text-sm font-bold tabular-nums text-white/70">
              respawning in {(dead.msLeft / 1000).toFixed(1)}s
            </div>
          </div>
        </div>
      )}

      {/* Desktop: click-to-lock + pause hint */}
      {!touch && !props.pointerLocked && !dead && (
        <button
          onClick={props.onLockRequest}
          className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-black/35"
        >
          <span className="rounded-2xl bg-black/70 px-6 py-4 text-sm font-bold text-white backdrop-blur-sm">
            <Crosshair size={16} className="mr-2 inline" />
            Click to aim — WASD move · Shift sprint · R reload · Q swap · Tab scores
          </span>
        </button>
      )}

      {/* Scoreboard */}
      {props.scoreboardOpen && <Scoreboard rows={props.rows} myId={props.myId} scores={hud.scores} />}

      {/* Touch controls */}
      {touch && (
        <TouchControls
          onMove={props.onTouchMove}
          onLook={props.onTouchLook}
          onFire={props.onFire}
          onAdsToggle={props.onAdsToggle}
          adsOn={props.adsOn}
          onJump={props.onJump}
          onReload={props.onReload}
          onSwap={props.onSwap}
          onScoreboard={() => props.onScoreboard(!props.scoreboardOpen)}
          onPause={props.onPause}
          dead={!!dead}
        />
      )}
    </div>
  );
}

function ScorePill({ team, score, mine }: { team: Team; score: number; mine: boolean }) {
  return (
    <div
      className="min-w-[64px] rounded-xl px-2.5 py-1.5 text-center backdrop-blur-sm sm:min-w-[76px] sm:px-3"
      style={{
        background: "rgba(0,0,0,0.55)",
        border: mine ? `1.5px solid ${TEAMS[team].color}` : "1.5px solid transparent",
      }}
    >
      <div className="whitespace-nowrap text-[9px] font-bold uppercase tracking-widest" style={{ color: TEAMS[team].color }}>
        {TEAMS[team].name}
        {mine ? " · you" : ""}
      </div>
      <div className="text-xl font-black tabular-nums leading-none text-white">{score}</div>
    </div>
  );
}

function CrosshairMark({ ads }: { ads: boolean }) {
  const gap = ads ? 3 : 7;
  const len = ads ? 5 : 7;
  const arm = (rot: number, tx: number, ty: number) => (
    <div
      className="absolute bg-white/90"
      style={{
        width: rot % 180 === 0 ? 2 : len,
        height: rot % 180 === 0 ? len : 2,
        transform: `translate(${tx}px, ${ty}px)`,
        boxShadow: "0 0 3px rgba(0,0,0,0.7)",
      }}
    />
  );
  return (
    <div className="relative">
      <div className="absolute h-[3px] w-[3px] rounded-full bg-white shadow" style={{ transform: "translate(-1.5px,-1.5px)" }} />
      {arm(0, -1, -gap - len)}
      {arm(180, -1, gap)}
      {arm(90, gap, -1)}
      {arm(270, -gap - len, -1)}
    </div>
  );
}

function Scoreboard({ rows, myId, scores }: { rows: ScoreRow[]; myId: string; scores: [number, number] }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/55 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-black/75 p-4 backdrop-blur-md">
        <div className="flex justify-center gap-6 text-center">
          {([0, 1] as Team[]).map((t) => (
            <div key={t} className="text-xl font-black" style={{ color: TEAMS[t].color }}>
              {TEAMS[t].name} {scores[t]}
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-4">
          {([0, 1] as Team[]).map((t) => (
            <div key={t}>
              <div className="mb-1 flex justify-between px-2 text-[10px] font-bold uppercase tracking-wider text-white/50">
                <span>player</span>
                <span>k / d</span>
              </div>
              {rows
                .filter((r) => r.team === t)
                .map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-lg px-2 py-1 text-[13px] font-bold"
                    style={{
                      background: r.id === myId ? `color-mix(in srgb, ${TEAMS[t].color} 25%, transparent)` : "transparent",
                      color: "#fff",
                    }}
                  >
                    <span className="truncate">
                      {r.name}
                      {r.isBot && <span className="ml-1 text-[9px] uppercase text-white/40">bot</span>}
                    </span>
                    <span className="tabular-nums">
                      {r.kills} / {r.deaths}
                    </span>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Touch controls ──────────────────────────────────────────────────────────

type TouchControlsProps = {
  onMove: (x: number, y: number) => void;
  onLook: (dx: number, dy: number) => void;
  onFire: (down: boolean) => void;
  onAdsToggle: () => void;
  adsOn: boolean;
  onJump: () => void;
  onReload: () => void;
  onSwap: () => void;
  onScoreboard: () => void;
  onPause: () => void;
  dead: boolean;
};

const STICK_R = 52;

function TouchControls(props: TouchControlsProps) {
  const stickZone = useRef<HTMLDivElement>(null);
  const lookZone = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState<{ x: number; y: number } | null>(null);
  const stickId = useRef<number | null>(null);
  const stickCentre = useRef({ x: 0, y: 0 });
  const lookId = useRef<number | null>(null);
  const lookLast = useRef({ x: 0, y: 0 });
  const { onMove, onLook } = props;

  useEffect(() => {
    const sz = stickZone.current;
    const lz = lookZone.current;
    if (!sz || !lz) return;

    const stickDown = (e: PointerEvent) => {
      if (stickId.current !== null) return;
      stickId.current = e.pointerId;
      stickCentre.current = { x: e.clientX, y: e.clientY };
      setKnob({ x: 0, y: 0 });
      sz.setPointerCapture(e.pointerId);
    };
    const stickMove = (e: PointerEvent) => {
      if (e.pointerId !== stickId.current) return;
      let dx = e.clientX - stickCentre.current.x;
      let dy = e.clientY - stickCentre.current.y;
      const len = Math.hypot(dx, dy);
      if (len > STICK_R) {
        dx = (dx / len) * STICK_R;
        dy = (dy / len) * STICK_R;
      }
      setKnob({ x: dx, y: dy });
      onMove(dx / STICK_R, dy / STICK_R);
    };
    const stickUp = (e: PointerEvent) => {
      if (e.pointerId !== stickId.current) return;
      stickId.current = null;
      setKnob(null);
      onMove(0, 0);
    };

    const lookDown = (e: PointerEvent) => {
      if (lookId.current !== null) return;
      lookId.current = e.pointerId;
      lookLast.current = { x: e.clientX, y: e.clientY };
      lz.setPointerCapture(e.pointerId);
    };
    const lookMove = (e: PointerEvent) => {
      if (e.pointerId !== lookId.current) return;
      onLook(e.clientX - lookLast.current.x, e.clientY - lookLast.current.y);
      lookLast.current = { x: e.clientX, y: e.clientY };
    };
    const lookUp = (e: PointerEvent) => {
      if (e.pointerId !== lookId.current) return;
      lookId.current = null;
    };

    sz.addEventListener("pointerdown", stickDown);
    sz.addEventListener("pointermove", stickMove);
    sz.addEventListener("pointerup", stickUp);
    sz.addEventListener("pointercancel", stickUp);
    lz.addEventListener("pointerdown", lookDown);
    lz.addEventListener("pointermove", lookMove);
    lz.addEventListener("pointerup", lookUp);
    lz.addEventListener("pointercancel", lookUp);
    return () => {
      sz.removeEventListener("pointerdown", stickDown);
      sz.removeEventListener("pointermove", stickMove);
      sz.removeEventListener("pointerup", stickUp);
      sz.removeEventListener("pointercancel", stickUp);
      lz.removeEventListener("pointerdown", lookDown);
      lz.removeEventListener("pointermove", lookMove);
      lz.removeEventListener("pointerup", lookUp);
      lz.removeEventListener("pointercancel", lookUp);
    };
  }, [onMove, onLook]);

  const btn =
    "pointer-events-auto flex items-center justify-center rounded-full font-black text-white active:scale-95 transition-transform";

  return (
    <>
      {/* Look zone: right half behind buttons */}
      <div ref={lookZone} className="pointer-events-auto absolute inset-y-0 right-0 w-[55%]" style={{ touchAction: "none" }} />
      {/* Stick zone: left-bottom quadrant */}
      <div ref={stickZone} className="pointer-events-auto absolute bottom-0 left-0 h-[45%] w-[45%]" style={{ touchAction: "none" }}>
        {knob && (
          <div
            className="absolute rounded-full border-2 border-white/35 bg-white/10"
            style={{
              width: STICK_R * 2 + 24,
              height: STICK_R * 2 + 24,
              left: stickCentre.current.x - STICK_R - 12,
              top: stickCentre.current.y - STICK_R - 12,
              position: "fixed",
            }}
          >
            <div
              className="absolute rounded-full bg-white/60"
              style={{
                width: 44,
                height: 44,
                left: STICK_R + 12 - 22 + knob.x,
                top: STICK_R + 12 - 22 + knob.y,
              }}
            />
          </div>
        )}
      </div>

      {/* Buttons */}
      {!props.dead && (
        <>
          <button
            className={`${btn} absolute bottom-16 right-5 h-[76px] w-[76px] text-[11px] uppercase tracking-wide`}
            style={{ background: "rgba(239,68,68,0.85)", boxShadow: "0 4px 20px rgba(239,68,68,0.4)" }}
            onPointerDown={(e) => {
              e.preventDefault();
              props.onFire(true);
            }}
            onPointerUp={() => props.onFire(false)}
            onPointerCancel={() => props.onFire(false)}
            onContextMenu={(e) => e.preventDefault()}
          >
            FIRE
          </button>
          <button
            className={`${btn} absolute bottom-[152px] right-8 h-12 w-12 text-[9px] uppercase`}
            style={{ background: props.adsOn ? "rgba(139,92,246,0.9)" : "rgba(255,255,255,0.22)" }}
            onPointerDown={(e) => {
              e.preventDefault();
              props.onAdsToggle();
            }}
          >
            ADS
          </button>
          <button
            className={`${btn} absolute bottom-20 right-[108px] h-14 w-14`}
            style={{ background: "rgba(255,255,255,0.22)" }}
            onPointerDown={(e) => {
              e.preventDefault();
              props.onJump();
            }}
          >
            <ArrowBigUp size={26} />
          </button>
          <button
            className={`${btn} absolute bottom-[152px] right-[124px] h-11 w-11`}
            style={{ background: "rgba(255,255,255,0.22)" }}
            onPointerDown={(e) => {
              e.preventDefault();
              props.onReload();
            }}
          >
            <RefreshCw size={18} />
          </button>
          <button
            className={`${btn} absolute bottom-[210px] right-6 h-11 w-11`}
            style={{ background: "rgba(255,255,255,0.22)" }}
            onPointerDown={(e) => {
              e.preventDefault();
              props.onSwap();
            }}
          >
            <Repeat size={18} />
          </button>
        </>
      )}
      <button
        className={`${btn} absolute left-4 top-3 h-10 w-10`}
        style={{ background: "rgba(255,255,255,0.18)" }}
        onPointerDown={(e) => {
          e.preventDefault();
          props.onPause();
        }}
      >
        <Pause size={18} />
      </button>
      <button
        className={`${btn} absolute left-16 top-3 h-10 w-10`}
        style={{ background: "rgba(255,255,255,0.18)" }}
        onPointerDown={(e) => {
          e.preventDefault();
          props.onScoreboard();
        }}
      >
        <Table2 size={18} />
      </button>
    </>
  );
}
