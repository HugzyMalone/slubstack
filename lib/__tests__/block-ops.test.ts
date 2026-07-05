import { describe, expect, it } from "vitest";
import {
  damageForHit,
  lineOfSight,
  rayBox,
  rayEntity,
  slideMove,
  PLAYER_HEIGHT,
  PLAYER_RADIUS,
  STEP_UP,
} from "@/lib/games/block-ops/combat";
import { MAP_BOXES, SPAWNS, WAYPOINTS, pickSpawn } from "@/lib/games/block-ops/map";
import { WEAPONS, assignTeams, xpForMatch } from "@/lib/games/block-ops/types";

describe("block-ops combat", () => {
  it("applies full damage inside falloff start and reduced beyond falloff end", () => {
    const rifle = WEAPONS.rifle;
    expect(damageForHit(rifle, 10, false)).toBe(rifle.damageBody);
    expect(damageForHit(rifle, 100, false)).toBe(Math.round(rifle.damageBody * rifle.falloffMult));
    expect(damageForHit(rifle, 10, true)).toBe(rifle.damageHead);
    expect(damageForHit(rifle, 10, true)).toBeGreaterThan(damageForHit(rifle, 10, false));
  });

  it("raycasts boxes at the right distance", () => {
    const box = { x: 0, y: 0, z: -10, w: 2, h: 2, d: 2, c: 0 };
    const t = rayBox({ x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: -1 }, box);
    expect(t).toBeCloseTo(9, 5);
    expect(rayBox({ x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 1 }, box)).toBeNull();
  });

  it("distinguishes headshots from body shots", () => {
    const feet = { x: 0, y: 0, z: -8 };
    const eye = { x: 0, y: 1.55, z: 0 };
    const head = rayEntity(eye, { x: 0, y: 0, z: -1 }, feet);
    expect(head?.hs).toBe(true);
    const low = rayEntity({ x: 0, y: 0.9, z: 0 }, { x: 0, y: 0, z: -1 }, feet);
    expect(low?.hs).toBe(false);
    expect(rayEntity(eye, { x: 0, y: 0, z: 1 }, feet)).toBeNull();
  });

  it("blocks walking into walls but steps up half-height crates", () => {
    const wall = { x: 0, y: 0, z: -2, w: 4, h: 3, d: 1, c: 0 };
    const pos = { x: 0, y: 0, z: 0 };
    const vel = { x: 0, y: 0, z: -10 };
    slideMove(pos, vel, 0.2, [wall], true);
    expect(pos.z).toBe(0);
    expect(vel.z).toBe(0);

    const crate = { x: 0, y: 0, z: -2, w: 4, h: STEP_UP - 0.05, d: 1, c: 0 };
    const p2 = { x: 0, y: 0, z: 0 };
    const v2 = { x: 0, y: 0, z: -10 };
    slideMove(p2, v2, 0.2, [crate], true);
    expect(p2.y).toBeCloseTo(STEP_UP - 0.05, 5);
    expect(p2.z).toBeLessThan(0);
  });

  it("lands on the floor under gravity", () => {
    const pos = { x: 0, y: 2, z: 0 };
    const vel = { x: 0, y: -10, z: 0 };
    slideMove(pos, vel, 0.5, [], false);
    expect(pos.y).toBe(0);
    expect(vel.y).toBe(0);
  });

  it("line of sight is blocked by walls and clear in the open", () => {
    const wall = { x: 0, y: 0, z: -5, w: 10, h: 4, d: 1, c: 0 };
    const a = { x: 0, y: 1.5, z: 0 };
    const b = { x: 0, y: 1.5, z: -10 };
    expect(lineOfSight(a, b, [wall])).toBe(false);
    expect(lineOfSight(a, b, [])).toBe(true);
  });
});

describe("block-ops teams and xp", () => {
  it("alternates teams down the sorted slot order", () => {
    const teams = assignTeams([3, 0, 2]);
    expect(teams.get(0)).toBe(0);
    expect(teams.get(2)).toBe(1);
    expect(teams.get(3)).toBe(0);
  });

  it("caps match xp at 50", () => {
    expect(xpForMatch(0, 10)).toBe(10);
    expect(xpForMatch(5, 10)).toBe(20);
    expect(xpForMatch(40, 10)).toBe(50);
  });
});

describe("block-ops map data", () => {
  it("waypoint links are valid indices and symmetric", () => {
    WAYPOINTS.forEach((w, i) => {
      expect(w.links.length).toBeGreaterThan(0);
      for (const l of w.links) {
        expect(l).toBeGreaterThanOrEqual(0);
        expect(l).toBeLessThan(WAYPOINTS.length);
        expect(WAYPOINTS[l].links).toContain(i);
      }
    });
  });

  it("no waypoint or spawn sits inside level geometry", () => {
    const standingClear = (p: { x: number; y: number; z: number }) => {
      for (const b of MAP_BOXES) {
        const inX = p.x + PLAYER_RADIUS > b.x - b.w / 2 && p.x - PLAYER_RADIUS < b.x + b.w / 2;
        const inZ = p.z + PLAYER_RADIUS > b.z - b.d / 2 && p.z - PLAYER_RADIUS < b.z + b.d / 2;
        const inY = p.y + PLAYER_HEIGHT > b.y + 0.01 && p.y + 0.01 < b.y + b.h;
        if (inX && inZ && inY) return false;
      }
      return true;
    };
    for (const w of WAYPOINTS) expect(standingClear(w.p), `waypoint ${JSON.stringify(w.p)}`).toBe(true);
    for (const side of SPAWNS) for (const s of side) expect(standingClear(s), `spawn ${JSON.stringify(s)}`).toBe(true);
  });

  it("picks the spawn furthest from enemies", () => {
    const enemy = [{ x: -8, y: 0, z: -20 }];
    const s = pickSpawn(0, enemy);
    expect(s.x).toBeGreaterThan(0);
  });
});
