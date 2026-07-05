import type { Team, Vec3 } from "./types";

/** x,z = centre, y = bottom of the box. */
export type MapBox = {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  c: number;
};

export const ARENA_HALF = 28;
export const WALL_H = 5;

const COL = {
  wall: 0xb8b2c8,
  shield: 0xa89fc4,
  crate: 0xc98f4e,
  crateDark: 0xa06c34,
  half: 0xd8a55e,
  accent: 0x8b5cf6,
  platform: 0x9a93ad,
};

function box(x: number, y: number, z: number, w: number, h: number, d: number, c: number): MapBox {
  return { x, y, z, w, h, d, c };
}

/** 180° rotational twin so both teams read an identical arena. */
function mirrored(b: MapBox): MapBox {
  return { ...b, x: -b.x, z: -b.z };
}

function buildBoxes(): MapBox[] {
  const A = ARENA_HALF;
  const perimeter: MapBox[] = [
    box(0, 0, -(A + 0.5), 2 * A + 3, WALL_H, 1, COL.wall),
    box(0, 0, A + 0.5, 2 * A + 3, WALL_H, 1, COL.wall),
    box(-(A + 0.5), 0, 0, 1, WALL_H, 2 * A + 3, COL.wall),
    box(A + 0.5, 0, 0, 1, WALL_H, 2 * A + 3, COL.wall),
  ];

  const centre: MapBox[] = [
    box(0, 0, 0, 9, 1.2, 9, COL.platform),
    box(0, 0, 6, 3, 0.6, 2.6, COL.half),
    box(0, 0, -6, 3, 0.6, 2.6, COL.half),
    box(-6.5, 0, 0, 1.6, 3.4, 1.6, COL.accent),
    box(6.5, 0, 0, 1.6, 3.4, 1.6, COL.accent),
  ];

  const south: MapBox[] = [
    box(0, 0, -19, 9, 2.8, 1, COL.shield),
    box(-13, 0, -16, 2, 1.5, 2, COL.crate),
    box(13, 0, -15.5, 2, 1.5, 2, COL.crateDark),
    box(14.8, 0, -15.5, 1.6, 0.6, 1.6, COL.half),
    box(-17, 0, -5, 1, 2.6, 9, COL.wall),
    box(-9, 0, -8, 5, 1.5, 1.2, COL.shield),
    box(9, 0, -8, 2, 1.5, 2, COL.crate),
    box(11, 0, -8, 1.6, 0.6, 1.6, COL.half),
    box(-23, 0, -23, 2.5, 4, 2.5, COL.accent),
    box(23, 0, -23, 2.5, 4, 2.5, COL.crateDark),
    box(-23, 0, -8, 2, 1.5, 2, COL.crate),
    box(22, 0, -2.5, 2, 0.6, 2, COL.half),
    box(5, 0, -13, 2, 1.5, 2, COL.crateDark),
    box(-5.5, 0, -24, 2, 1.5, 2, COL.crate),
  ];

  return [...perimeter, ...centre, ...south, ...south.map(mirrored)];
}

export const MAP_BOXES: MapBox[] = buildBoxes();

export const FLOOR_COLOR = 0xd6cec2;
export const FOG_COLOR = 0xc9d2e4;

/** Feet positions; team 0 attacks towards +z, team 1 towards -z. */
export const SPAWNS: [Vec3[], Vec3[]] = [
  [
    { x: -8, y: 0, z: -24 },
    { x: -3, y: 0, z: -25 },
    { x: 3, y: 0, z: -25 },
    { x: 8, y: 0, z: -24 },
  ],
  [
    { x: 8, y: 0, z: 24 },
    { x: 3, y: 0, z: 25 },
    { x: -3, y: 0, z: 25 },
    { x: -8, y: 0, z: 24 },
  ],
];

/** Three.js yaw 0 faces -z, so team 0 (spawning at -z) turns about-face. */
export function spawnYaw(team: Team): number {
  return team === 0 ? Math.PI : 0;
}

export type Waypoint = { p: Vec3; links: number[] };

const WP: [number, number, number?][] = [
  [0, -22],
  [-10, -20],
  [10, -20],
  [-20, -12],
  [20, -12],
  [-10, -10],
  [10, -10],
  [0, -12],
  [-22, 0],
  [22, 0],
  [0, 0, 1.2],
  [-8, 0],
  [8, 0],
  [0, 22],
  [10, 20],
  [-10, 20],
  [20, 12],
  [-20, 12],
  [10, 10],
  [-10, 10],
  [0, 12],
];

const WP_LINKS: [number, number][] = [
  [0, 1], [0, 2], [1, 3], [2, 4], [1, 5], [2, 6], [0, 7], [5, 7], [6, 7],
  [3, 8], [4, 9], [5, 11], [6, 12], [7, 11], [7, 12], [8, 11], [9, 12],
  [10, 7], [10, 20], [11, 10], [12, 10], [11, 19], [12, 18], [8, 17], [9, 16],
  [13, 14], [13, 15], [14, 16], [15, 17], [14, 18], [15, 19], [13, 20],
  [18, 20], [19, 20], [16, 9], [17, 8], [18, 12], [19, 11],
];

function buildWaypoints(): Waypoint[] {
  const pts: Waypoint[] = WP.map(([x, z, y]) => ({ p: { x, y: y ?? 0, z }, links: [] }));
  for (const [a, b] of WP_LINKS) {
    if (!pts[a].links.includes(b)) pts[a].links.push(b);
    if (!pts[b].links.includes(a)) pts[b].links.push(a);
  }
  return pts;
}

export const WAYPOINTS: Waypoint[] = buildWaypoints();

export function nearestWaypoint(p: Vec3): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < WAYPOINTS.length; i++) {
    const w = WAYPOINTS[i].p;
    const d = (w.x - p.x) ** 2 + (w.z - p.z) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

/** Spawn furthest from living enemies so respawns aren't instant re-deaths. */
export function pickSpawn(team: Team, enemies: Vec3[]): Vec3 {
  const options = SPAWNS[team];
  if (enemies.length === 0) return options[Math.floor(Math.random() * options.length)];
  let best = options[0];
  let bestScore = -Infinity;
  for (const s of options) {
    let minD = Infinity;
    for (const e of enemies) {
      const d = (s.x - e.x) ** 2 + (s.z - e.z) ** 2;
      if (d < minD) minD = d;
    }
    if (minD > bestScore) {
      bestScore = minD;
      best = s;
    }
  }
  return best;
}
