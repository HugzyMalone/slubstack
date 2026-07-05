export type Team = 0 | 1;

/** "h<slot>" for humans, "b<idx>" for bots. */
export type EntityId = string;

export type Vec3 = { x: number; y: number; z: number };

export type WeaponId = "rifle" | "pistol";

export type WeaponSpec = {
  id: WeaponId;
  name: string;
  auto: boolean;
  rpm: number;
  magSize: number;
  reloadMs: number;
  damageBody: number;
  damageHead: number;
  falloffStart: number;
  falloffEnd: number;
  falloffMult: number;
  spreadBase: number;
  spreadMove: number;
  spreadAds: number;
  recoilPitch: number;
  recoilYaw: number;
  adsFov: number;
  swapMs: number;
};

export const WEAPONS: Record<WeaponId, WeaponSpec> = {
  rifle: {
    id: "rifle",
    name: "SL-4 Rifle",
    auto: true,
    rpm: 600,
    magSize: 30,
    reloadMs: 1700,
    damageBody: 26,
    damageHead: 44,
    falloffStart: 22,
    falloffEnd: 45,
    falloffMult: 0.7,
    spreadBase: 0.016,
    spreadMove: 0.03,
    spreadAds: 0.004,
    recoilPitch: 0.011,
    recoilYaw: 0.005,
    adsFov: 52,
    swapMs: 400,
  },
  pistol: {
    id: "pistol",
    name: "Slub-9",
    auto: false,
    rpm: 320,
    magSize: 12,
    reloadMs: 1200,
    damageBody: 34,
    damageHead: 58,
    falloffStart: 14,
    falloffEnd: 30,
    falloffMult: 0.65,
    spreadBase: 0.012,
    spreadMove: 0.026,
    spreadAds: 0.003,
    recoilPitch: 0.017,
    recoilYaw: 0.004,
    adsFov: 60,
    swapMs: 300,
  },
};

export const TEAMS: { name: string; color: string; colorHex: number }[] = [
  { name: "Violet", color: "#8b5cf6", colorHex: 0x8b5cf6 },
  { name: "Amber", color: "#f59e0b", colorHex: 0xf59e0b },
];

export const MAX_HP = 100;
export const MATCH_MS = 4 * 60_000;
export const KILL_LIMIT = 30;
export const RESPAWN_MS = 3000;
export const SPAWN_PROTECT_MS = 1500;
export const STATE_SEND_MS = 100;
export const INTERP_DELAY_MS = 140;
export const COMBATANTS = 6;
export const BASE_FOV = 75;

export type RosterEntry = {
  id: EntityId;
  slot: number | null;
  name: string;
  team: Team;
  isBot: boolean;
  avatarUrl: string | null;
};

export type GoPayload = { seed: string; roster: RosterEntry[] };

export type StatePayload = {
  id: EntityId;
  p: [number, number, number];
  yaw: number;
  pitch: number;
  hp: number;
  w: WeaponId;
  dead: 0 | 1;
};

/** Host bot batch: [idx, x, y, z, yaw, hp, firing] per bot, plus host clock. */
export type BotsPayload = {
  list: [number, number, number, number, number, number, 0 | 1][];
  msLeft: number;
  scores: [number, number];
};

export type FxPayload = {
  id: EntityId;
  shots: { o: [number, number, number]; e: [number, number, number] }[];
};

export type HitPayload = { a: EntityId; t: EntityId; d: number; hs: 0 | 1 };

export type DeathPayload = { v: EntityId; a: EntityId; hs: 0 | 1 };

export type ScoreRow = {
  id: EntityId;
  name: string;
  team: Team;
  kills: number;
  deaths: number;
  isBot: boolean;
};

export type EndPayload = { scores: [number, number]; rows: ScoreRow[] };

export type NetEvent = "go" | "st" | "bt" | "fx" | "ht" | "dt" | "end";

export type KillFeedEntry = {
  key: number;
  attacker: string;
  attackerTeam: Team;
  victim: string;
  victimTeam: Team;
  hs: boolean;
};

export type HudState = {
  hp: number;
  ammo: number;
  magSize: number;
  weapon: WeaponId;
  reloading: boolean;
  scores: [number, number];
  msLeft: number;
  kills: number;
  deaths: number;
  ads: boolean;
  dead: { by: string; msLeft: number } | null;
  spawnProtected: boolean;
};

/**
 * Alternates teams down the present-slot order so a 2-human room is always
 * 1v1 humans (plus bots), never 2-humans-vs-bots.
 */
export function assignTeams(slots: number[]): Map<number, Team> {
  const sorted = [...slots].sort((a, b) => a - b);
  const out = new Map<number, Team>();
  sorted.forEach((slot, i) => out.set(slot, (i % 2) as Team));
  return out;
}

export function xpForMatch(kills: number, base: number): number {
  return Math.min(50, base + kills * 2);
}

export const BOT_NAMES = [
  "Sgt. Bamboo",
  "Recoil Rita",
  "Cpt. Crates",
  "Wallbang Wes",
  "Nade Nadia",
  "Trigger Ted",
  "Flanker Fay",
  "Camper Carl",
];
