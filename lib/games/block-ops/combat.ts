import type { MapBox } from "./map";
import type { Vec3, WeaponSpec } from "./types";

export const PLAYER_RADIUS = 0.38;
export const PLAYER_HEIGHT = 1.7;
export const EYE_HEIGHT = 1.55;
export const HEAD_RADIUS = 0.26;
export const STEP_UP = 0.62;
export const GRAVITY = 13;
export const JUMP_V = 5.2;
export const WALK_SPEED = 5.2;
export const SPRINT_SPEED = 7.3;
export const ADS_SPEED_MULT = 0.62;
export const REGEN_DELAY_MS = 5000;
export const REGEN_PER_S = 25;

function overlaps(pos: Vec3, r: number, h: number, b: MapBox): boolean {
  return (
    pos.x + r > b.x - b.w / 2 &&
    pos.x - r < b.x + b.w / 2 &&
    pos.z + r > b.z - b.d / 2 &&
    pos.z - r < b.z + b.d / 2 &&
    pos.y + h > b.y &&
    pos.y < b.y + b.h
  );
}

export type MoveResult = { grounded: boolean; hitWall: boolean };

/**
 * Axis-separated collide-and-slide for a feet-anchored AABB character.
 * Mutates pos/vel. Grounded characters auto-step ledges up to STEP_UP so
 * half-crates work as stairs.
 */
export function slideMove(
  pos: Vec3,
  vel: Vec3,
  dt: number,
  boxes: MapBox[],
  wasGrounded: boolean,
): MoveResult {
  const r = PLAYER_RADIUS;
  const h = PLAYER_HEIGHT;
  let hitWall = false;

  for (const axis of ["x", "z"] as const) {
    const delta = vel[axis] * dt;
    if (delta === 0) continue;
    const prev = pos[axis];
    pos[axis] += delta;

    let stepTop = -1;
    let blocked = false;
    for (const b of boxes) {
      if (!overlaps(pos, r, h, b)) continue;
      const top = b.y + b.h;
      if (wasGrounded && top - pos.y <= STEP_UP && top - pos.y > 0) {
        stepTop = Math.max(stepTop, top);
      } else {
        blocked = true;
        break;
      }
    }
    if (blocked) {
      pos[axis] = prev;
      vel[axis] = 0;
      hitWall = true;
    } else if (stepTop >= 0) {
      pos.y = stepTop;
    }
  }

  const prevY = pos.y;
  pos.y += vel.y * dt;
  let grounded = false;

  if (pos.y <= 0) {
    pos.y = 0;
    if (vel.y < 0) vel.y = 0;
    grounded = true;
  }

  for (const b of boxes) {
    if (!overlaps(pos, r, h, b)) continue;
    const top = b.y + b.h;
    if (vel.y <= 0 && prevY >= top - 0.08) {
      pos.y = top;
      vel.y = 0;
      grounded = true;
    } else if (vel.y > 0 && prevY + h <= b.y + 0.08) {
      pos.y = b.y - h;
      vel.y = 0;
    }
  }

  return { grounded, hitWall };
}

export function rayBox(o: Vec3, d: Vec3, b: MapBox): number | null {
  const minX = b.x - b.w / 2;
  const maxX = b.x + b.w / 2;
  const minY = b.y;
  const maxY = b.y + b.h;
  const minZ = b.z - b.d / 2;
  const maxZ = b.z + b.d / 2;

  let tMin = -Infinity;
  let tMax = Infinity;

  const axes: [number, number, number, number][] = [
    [o.x, d.x, minX, maxX],
    [o.y, d.y, minY, maxY],
    [o.z, d.z, minZ, maxZ],
  ];
  for (const [oc, dc, lo, hi] of axes) {
    if (Math.abs(dc) < 1e-9) {
      if (oc < lo || oc > hi) return null;
    } else {
      let t1 = (lo - oc) / dc;
      let t2 = (hi - oc) / dc;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tMin = Math.max(tMin, t1);
      tMax = Math.min(tMax, t2);
      if (tMin > tMax) return null;
    }
  }
  if (tMax < 0) return null;
  return tMin >= 0 ? tMin : 0;
}

export function rayWorld(o: Vec3, d: Vec3, maxDist: number, boxes: MapBox[]): number {
  let nearest = maxDist;
  for (const b of boxes) {
    const t = rayBox(o, d, b);
    if (t !== null && t < nearest) nearest = t;
  }
  return nearest;
}

export type EntityHit = { t: number; hs: boolean };

/** Head sphere first, then body AABB — a grazing head hit wins the multiplier. */
export function rayEntity(o: Vec3, d: Vec3, feet: Vec3): EntityHit | null {
  const headC = { x: feet.x, y: feet.y + EYE_HEIGHT, z: feet.z };
  const oc = { x: o.x - headC.x, y: o.y - headC.y, z: o.z - headC.z };
  const bDot = oc.x * d.x + oc.y * d.y + oc.z * d.z;
  const cVal = oc.x * oc.x + oc.y * oc.y + oc.z * oc.z - HEAD_RADIUS * HEAD_RADIUS;
  let headT: number | null = null;
  const disc = bDot * bDot - cVal;
  if (disc >= 0) {
    const t = -bDot - Math.sqrt(disc);
    if (t >= 0) headT = t;
  }

  const bodyT = rayBox(o, d, {
    x: feet.x,
    y: feet.y,
    z: feet.z,
    w: PLAYER_RADIUS * 2,
    h: PLAYER_HEIGHT,
    d: PLAYER_RADIUS * 2,
    c: 0,
  });

  if (headT === null && bodyT === null) return null;
  if (headT !== null && (bodyT === null || headT <= bodyT + 0.15)) {
    return { t: headT, hs: true };
  }
  return { t: bodyT as number, hs: false };
}

export function damageForHit(spec: WeaponSpec, dist: number, hs: boolean): number {
  const base = hs ? spec.damageHead : spec.damageBody;
  if (dist <= spec.falloffStart) return base;
  if (dist >= spec.falloffEnd) return Math.round(base * spec.falloffMult);
  const f = (dist - spec.falloffStart) / (spec.falloffEnd - spec.falloffStart);
  return Math.round(base * (1 - f * (1 - spec.falloffMult)));
}

/** Uniform cone perturbation; rnd injected so bots can share a seeded stream. */
export function spreadDir(dir: Vec3, spread: number, rnd: () => number): Vec3 {
  if (spread <= 0) return dir;
  const up = Math.abs(dir.y) > 0.95 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 };
  const right = norm(cross(dir, up));
  const realUp = cross(right, dir);
  const angle = rnd() * Math.PI * 2;
  const radius = Math.sqrt(rnd()) * spread;
  const ox = Math.cos(angle) * radius;
  const oy = Math.sin(angle) * radius;
  return norm({
    x: dir.x + right.x * ox + realUp.x * oy,
    y: dir.y + right.y * ox + realUp.y * oy,
    z: dir.z + right.z * ox + realUp.z * oy,
  });
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
}

function norm(v: Vec3): Vec3 {
  const l = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / l, y: v.y / l, z: v.z / l };
}

export function lineOfSight(a: Vec3, b: Vec3, boxes: MapBox[]): boolean {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = b.z - a.z;
  const dist = Math.hypot(dx, dy, dz);
  if (dist < 0.001) return true;
  const d = { x: dx / dist, y: dy / dist, z: dz / dist };
  return rayWorld(a, d, dist, boxes) >= dist - 0.05;
}
