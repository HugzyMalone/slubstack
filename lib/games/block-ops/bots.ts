import type { MapBox } from "./map";
import { WAYPOINTS, nearestWaypoint } from "./map";
import type { EntityId, Team, Vec3 } from "./types";
import { MAX_HP, WEAPONS } from "./types";
import { EYE_HEIGHT, GRAVITY, JUMP_V, lineOfSight, slideMove, spreadDir } from "./combat";

const BOT_WALK = 4.7;
const BOT_STRAFE = 4.1;
const ACCEL = 26;
const ENGAGE_RANGE = 46;
const AIM_ERR_START = 0.09;
const AIM_ERR_FLOOR = 0.02;
const AIM_SETTLE_MS = 2200;
const TURN_SPEED = 7;

export type BotSim = {
  id: EntityId;
  team: Team;
  pos: Vec3;
  vel: Vec3;
  yaw: number;
  pitch: number;
  hp: number;
  alive: boolean;
  respawnAt: number;
  ammo: number;
  reloadUntil: number;
  nextShotAt: number;
  burstLeft: number;
  mode: "patrol" | "engage" | "hunt";
  targetId: EntityId | null;
  lastSeen: Vec3 | null;
  wptGoal: number;
  engageSince: number;
  reactAt: number;
  strafeDir: 1 | -1;
  strafeFlipAt: number;
  grounded: boolean;
  stuckCheckAt: number;
  lastProgress: Vec3;
  firingUntil: number;
  lastDamageAt: number;
};

export type BotTargetView = { id: EntityId; pos: Vec3 };

export type BotCtx = {
  now: number;
  rnd: () => number;
  boxes: MapBox[];
  enemies: BotTargetView[];
  fire: (bot: BotSim, dir: Vec3) => void;
};

export function createBotSim(id: EntityId, team: Team, spawn: Vec3, yaw: number): BotSim {
  return {
    id,
    team,
    pos: { ...spawn },
    vel: { x: 0, y: 0, z: 0 },
    yaw,
    pitch: 0,
    hp: MAX_HP,
    alive: true,
    respawnAt: 0,
    ammo: WEAPONS.rifle.magSize,
    reloadUntil: 0,
    nextShotAt: 0,
    burstLeft: 0,
    mode: "patrol",
    targetId: null,
    lastSeen: null,
    wptGoal: nearestWaypoint(spawn),
    engageSince: 0,
    reactAt: 0,
    strafeDir: 1,
    strafeFlipAt: 0,
    grounded: true,
    stuckCheckAt: 0,
    lastProgress: { ...spawn },
    firingUntil: 0,
    lastDamageAt: 0,
  };
}

function eyeOf(p: Vec3): Vec3 {
  return { x: p.x, y: p.y + EYE_HEIGHT, z: p.z };
}

export function updateBot(bot: BotSim, ctx: BotCtx, dt: number): void {
  if (!bot.alive) return;
  const { now, rnd, boxes, enemies } = ctx;
  const eye = eyeOf(bot.pos);

  let target: BotTargetView | null = null;
  let targetDist = Infinity;
  for (const e of enemies) {
    const d = Math.hypot(e.pos.x - bot.pos.x, e.pos.z - bot.pos.z);
    if (d < targetDist && d < ENGAGE_RANGE && lineOfSight(eye, eyeOf(e.pos), boxes)) {
      target = e;
      targetDist = d;
    }
  }

  if (target) {
    if (bot.mode !== "engage" || bot.targetId !== target.id) {
      bot.mode = "engage";
      bot.targetId = target.id;
      bot.engageSince = now;
      bot.reactAt = now + 240 + rnd() * 260;
    }
    bot.lastSeen = { ...target.pos };
  } else if (bot.mode === "engage") {
    bot.mode = "hunt";
    bot.targetId = null;
  }

  let desired = { x: 0, z: 0 };
  let speed = BOT_WALK;

  if (bot.mode === "engage" && target) {
    const toT = { x: target.pos.x - bot.pos.x, z: target.pos.z - bot.pos.z };
    const len = Math.hypot(toT.x, toT.z) || 1;
    const fwd = { x: toT.x / len, z: toT.z / len };
    if (now >= bot.strafeFlipAt) {
      bot.strafeDir = rnd() < 0.5 ? 1 : -1;
      bot.strafeFlipAt = now + 700 + rnd() * 800;
    }
    const side = { x: -fwd.z * bot.strafeDir, z: fwd.x * bot.strafeDir };
    if (targetDist > 26) desired = fwd;
    else if (targetDist < 8) desired = { x: -fwd.x, z: -fwd.z };
    else desired = side;
    speed = BOT_STRAFE;

    const wantYaw = Math.atan2(-toT.x, -toT.z);
    bot.yaw = turnToward(bot.yaw, wantYaw, TURN_SPEED * dt);
    const dy = target.pos.y + EYE_HEIGHT - eye.y;
    bot.pitch = Math.atan2(dy, len);
  } else {
    const goal = bot.mode === "hunt" && bot.lastSeen ? bot.lastSeen : WAYPOINTS[bot.wptGoal].p;
    const toG = { x: goal.x - bot.pos.x, z: goal.z - bot.pos.z };
    const dist = Math.hypot(toG.x, toG.z);
    if (dist < 1.3) {
      if (bot.mode === "hunt") {
        bot.mode = "patrol";
        bot.wptGoal = nearestWaypoint(bot.pos);
      } else {
        const links = WAYPOINTS[bot.wptGoal].links;
        bot.wptGoal = links[Math.floor(rnd() * links.length)] ?? bot.wptGoal;
      }
    } else {
      desired = { x: toG.x / dist, z: toG.z / dist };
      const wantYaw = Math.atan2(-desired.x, -desired.z);
      bot.yaw = turnToward(bot.yaw, wantYaw, TURN_SPEED * dt);
      bot.pitch *= 0.9;
    }
  }

  bot.vel.x += (desired.x * speed - bot.vel.x) * Math.min(1, ACCEL * dt * 0.2);
  bot.vel.z += (desired.z * speed - bot.vel.z) * Math.min(1, ACCEL * dt * 0.2);
  bot.vel.y -= GRAVITY * dt;

  const res = slideMove(bot.pos, bot.vel, dt, boxes, bot.grounded);
  bot.grounded = res.grounded;

  if (now >= bot.stuckCheckAt) {
    const moved = Math.hypot(bot.pos.x - bot.lastProgress.x, bot.pos.z - bot.lastProgress.z);
    if (moved < 0.35 && bot.mode !== "engage") {
      if (bot.grounded && rnd() < 0.5) bot.vel.y = JUMP_V;
      else bot.wptGoal = WAYPOINTS[nearestWaypoint(bot.pos)].links[0] ?? bot.wptGoal;
    }
    bot.lastProgress = { ...bot.pos };
    bot.stuckCheckAt = now + 800;
  }

  if (bot.ammo === 0 && now >= bot.reloadUntil) bot.ammo = WEAPONS.rifle.magSize;

  if (bot.mode === "engage" && target && now >= bot.reactAt && bot.ammo > 0 && now >= bot.reloadUntil) {
    if (bot.burstLeft <= 0 && now >= bot.nextShotAt) {
      bot.burstLeft = 3 + Math.floor(rnd() * 4);
    }
    if (bot.burstLeft > 0 && now >= bot.nextShotAt) {
      const settle = Math.min(1, (now - bot.engageSince) / AIM_SETTLE_MS);
      const err = (AIM_ERR_START - (AIM_ERR_START - AIM_ERR_FLOOR) * settle) * (0.55 + targetDist / 45);
      const tEye = eyeOf(target.pos);
      const raw = {
        x: tEye.x - eye.x,
        y: tEye.y - 0.25 - eye.y,
        z: tEye.z - eye.z,
      };
      const len = Math.hypot(raw.x, raw.y, raw.z) || 1;
      const dir = spreadDir({ x: raw.x / len, y: raw.y / len, z: raw.z / len }, err, rnd);
      ctx.fire(bot, dir);
      bot.ammo--;
      bot.firingUntil = now + 130;
      bot.burstLeft--;
      if (bot.ammo === 0) {
        bot.reloadUntil = now + WEAPONS.rifle.reloadMs;
        bot.burstLeft = 0;
      }
      bot.nextShotAt =
        bot.burstLeft > 0 ? now + 60_000 / WEAPONS.rifle.rpm : now + 380 + rnd() * 400;
    }
  }
}

function turnToward(cur: number, want: number, maxStep: number): number {
  let diff = want - cur;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) <= maxStep) return want;
  return cur + Math.sign(diff) * maxStep;
}
