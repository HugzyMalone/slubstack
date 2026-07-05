"use client";

import * as THREE from "three";
import { mulberry32 } from "@/lib/multiplayer/rng";
import {
  ARENA_HALF,
  FLOOR_COLOR,
  FOG_COLOR,
  MAP_BOXES,
  SPAWNS,
  pickSpawn,
  spawnYaw,
} from "./map";
import {
  ADS_SPEED_MULT,
  EYE_HEIGHT,
  GRAVITY,
  JUMP_V,
  REGEN_DELAY_MS,
  REGEN_PER_S,
  SPRINT_SPEED,
  WALK_SPEED,
  damageForHit,
  rayEntity,
  rayWorld,
  slideMove,
  spreadDir,
} from "./combat";
import { createBotSim, updateBot, type BotSim, type BotTargetView } from "./bots";
import {
  BASE_FOV,
  KILL_LIMIT,
  MATCH_MS,
  MAX_HP,
  RESPAWN_MS,
  SPAWN_PROTECT_MS,
  STATE_SEND_MS,
  INTERP_DELAY_MS,
  TEAMS,
  WEAPONS,
  type BotsPayload,
  type DeathPayload,
  type EndPayload,
  type EntityId,
  type FxPayload,
  type HitPayload,
  type HudState,
  type KillFeedEntry,
  type NetEvent,
  type RosterEntry,
  type ScoreRow,
  type StatePayload,
  type Team,
  type Vec3,
  type WeaponId,
} from "./types";
import {
  sfxDamageTaken,
  sfxDeath,
  sfxDryFire,
  sfxHitConfirm,
  sfxKill,
  sfxReload,
  sfxRespawn,
  sfxShot,
} from "./audio";

const STEP = 1 / 60;
const SENS_KEY = "blockops_sens";
const AIR_CONTROL = 0.3;
const TRACER_MS = 80;
const CORPSE_HIDE_MS = 2400;

type Snap = { t: number; x: number; y: number; z: number; yaw: number; pitch: number };

type Entity = {
  id: EntityId;
  name: string;
  team: Team;
  isBot: boolean;
  hp: number;
  alive: boolean;
  group: THREE.Group;
  gun: THREE.Group;
  muzzle: THREE.Sprite;
  label: THREE.Sprite;
  labelCanvas: HTMLCanvasElement;
  labelTex: THREE.CanvasTexture;
  labelHp: number;
  snaps: Snap[];
  pos: Vec3;
  yaw: number;
  pitch: number;
  walkPhase: number;
  firingUntil: number;
  diedAt: number;
  lastDamageAt: number;
  bot: BotSim | null;
};

type Tracer = { line: THREE.Line; mat: THREE.LineBasicMaterial; until: number };
type Spark = { sprite: THREE.Sprite; mat: THREE.SpriteMaterial; until: number; scale: number };

export type EngineUiEvents = {
  onHud: (h: HudState) => void;
  onKillFeed: (e: KillFeedEntry) => void;
  onHitmarker: (hs: boolean) => void;
  onDamageFlash: () => void;
  onEnd: (p: EndPayload) => void;
  onPointerLock: (locked: boolean) => void;
};

export type EngineConfig = {
  container: HTMLElement;
  localId: EntityId;
  roster: RosterEntry[];
  isHost: boolean;
  practice: boolean;
  seed: string;
  send: (event: NetEvent, payload: unknown) => void;
  events: EngineUiEvents;
};

export class BlockOpsEngine {
  private cfg: EngineConfig;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private resizeObs: ResizeObserver;
  private raf = 0;
  private acc = 0;
  private lastFrame = 0;
  private started = false;
  private over = false;
  private paused = false;

  private isAuthority: boolean;
  private beginAt = 0;
  private lastMsLeft = MATCH_MS;
  private teamScores: [number, number] = [0, 0];
  private scores = new Map<EntityId, { kills: number; deaths: number }>();
  private roster = new Map<EntityId, RosterEntry>();
  private entities = new Map<EntityId, Entity>();
  private feedKey = 1;

  private rnd: () => number;

  // ── Local player ────────────────────────────────────────────────────────
  private me: RosterEntry;
  private pos: Vec3 = { x: 0, y: 0, z: 0 };
  private vel: Vec3 = { x: 0, y: 0, z: 0 };
  private yaw = 0;
  private pitch = 0;
  private kickPitch = 0;
  private kickYaw = 0;
  private shakeRoll = 0;
  private grounded = true;
  private hp = MAX_HP;
  private alive = true;
  private respawnAt = 0;
  private protectedUntil = 0;
  private lastDamageAt = -Infinity;
  private diedBy = "";
  private weapon: WeaponId = "rifle";
  private mags: Record<WeaponId, number> = { rifle: WEAPONS.rifle.magSize, pistol: WEAPONS.pistol.magSize };
  private reloadUntil = 0;
  private swapUntil = 0;
  private nextShotAt = 0;
  private triggerHeld = false;
  // A tap can press and release between sim ticks; the latch guarantees the
  // shot still lands on the next step.
  private fireLatch = false;
  private triggerConsumed = false;
  private adsHeld = false;
  private adsAmount = 0;
  private sprintHeld = false;
  private fov = BASE_FOV;
  private sensMult = 1;

  private keys = new Set<string>();
  private touchMove = { x: 0, y: 0 };
  private touchLook = { x: 0, y: 0 };
  private touchJump = false;

  // ── Net ─────────────────────────────────────────────────────────────────
  private lastStateSend = 0;
  private pendingFx = new Map<EntityId, { o: [number, number, number]; e: [number, number, number] }[]>();
  private lastHudSend = 0;

  // ── Rendering pools ─────────────────────────────────────────────────────
  private viewmodel = new THREE.Group();
  private vmRifle = new THREE.Group();
  private vmPistol = new THREE.Group();
  private vmKick = 0;
  private muzzleLight: THREE.PointLight;
  private muzzleFlash: THREE.Sprite;
  private muzzleUntil = 0;
  private tracers: Tracer[] = [];
  private sparks: Spark[] = [];
  private walkPhase = 0;

  private cleanupFns: (() => void)[] = [];

  constructor(cfg: EngineConfig) {
    this.cfg = cfg;
    this.isAuthority = cfg.isHost || cfg.practice;
    this.rnd = mulberry32(`${cfg.seed}:${cfg.localId}`);

    const meEntry = cfg.roster.find((r) => r.id === cfg.localId);
    if (!meEntry) throw new Error("local player missing from roster");
    this.me = meEntry;

    for (const r of cfg.roster) {
      this.roster.set(r.id, r);
      this.scores.set(r.id, { kills: 0, deaths: 0 });
    }

    // Scene
    this.scene.background = new THREE.Color(FOG_COLOR);
    this.scene.fog = new THREE.Fog(FOG_COLOR, 50, 120);
    this.camera = new THREE.PerspectiveCamera(BASE_FOV, 1, 0.05, 220);
    this.scene.add(this.camera);

    this.renderer = new THREE.WebGLRenderer({
      antialias: (window.devicePixelRatio || 1) < 1.6,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const canvas = this.renderer.domElement;
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.touchAction = "none";
    cfg.container.appendChild(canvas);

    this.buildWorld();
    this.buildViewmodel();
    this.muzzleLight = new THREE.PointLight(0xffc36b, 0, 7, 1.8);
    this.camera.add(this.muzzleLight);
    this.muzzleLight.position.set(0.16, -0.1, -0.6);
    this.muzzleFlash = this.makeFlashSprite(0.22);
    this.camera.add(this.muzzleFlash);
    this.muzzleFlash.position.set(0.17, -0.085, -0.62);

    for (const r of cfg.roster) {
      if (r.id === cfg.localId) continue;
      this.entities.set(r.id, this.buildEntity(r));
    }

    // Host simulates bots
    if (this.isAuthority) this.adoptBots();

    // Local spawn
    const spawn = this.teamSpawn(this.me.team, cfg.roster.filter((r) => r.team === this.me.team).findIndex((r) => r.id === cfg.localId));
    this.pos = { ...spawn };
    this.yaw = spawnYaw(this.me.team);

    this.resizeObs = new ResizeObserver(() => this.resize());
    this.resizeObs.observe(cfg.container);
    this.resize();

    this.bindInput();
    this.readSens();
    this.emitHud(true);
    this.lastFrame = performance.now();
    this.raf = requestAnimationFrame(this.frame);
    (window as unknown as { __blockOps?: BlockOpsEngine }).__blockOps = this;
  }

  // ── Public API ───────────────────────────────────────────────────────────

  begin() {
    this.started = true;
    this.beginAt = performance.now();
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.resizeObs.disconnect();
    for (const fn of this.cleanupFns) fn();
    if (document.pointerLockElement === this.renderer.domElement) document.exitPointerLock();
    this.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = (mesh as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else if (mat) mat.dispose();
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
    const w = window as unknown as { __blockOps?: BlockOpsEngine };
    if (w.__blockOps === this) delete w.__blockOps;
  }

  setPaused(p: boolean) {
    this.paused = p;
    if (p) {
      this.keys.clear();
      this.triggerHeld = false;
      this.adsHeld = false;
    }
  }

  requestPointerLock() {
    this.renderer.domElement.requestPointerLock();
  }

  setSensitivity(mult: number) {
    this.sensMult = mult;
    localStorage.setItem(SENS_KEY, String(mult));
  }

  getSensitivity() {
    return this.sensMult;
  }

  becomeHost() {
    if (this.isAuthority) return;
    this.isAuthority = true;
    this.beginAt = performance.now() - (MATCH_MS - this.lastMsLeft);
    this.adoptBots();
  }

  /** A human left mid-match: hide their soldier and stop tracking them. */
  dropEntity(id: EntityId) {
    const e = this.entities.get(id);
    if (!e) return;
    e.group.visible = false;
    e.alive = false;
    this.entities.delete(id);
  }

  // Touch bridge
  setTouchMove(x: number, y: number) {
    this.touchMove.x = x;
    this.touchMove.y = y;
  }
  addTouchLook(dx: number, dy: number) {
    this.touchLook.x += dx;
    this.touchLook.y += dy;
  }
  setTouchFire(down: boolean) {
    this.triggerHeld = down;
    if (down) this.fireLatch = true;
    else this.triggerConsumed = false;
  }
  setTouchAds(on: boolean) {
    this.adsHeld = on;
  }
  touchJumpPress() {
    this.touchJump = true;
  }
  touchReload() {
    this.startReload();
  }
  touchSwap() {
    this.swapWeapon();
  }

  onNet(event: NetEvent, payload: unknown) {
    switch (event) {
      case "st":
        this.onRemoteState(payload as StatePayload);
        break;
      case "bt":
        this.onBotsState(payload as BotsPayload);
        break;
      case "fx":
        this.onFx(payload as FxPayload);
        break;
      case "ht":
        this.onHit(payload as HitPayload);
        break;
      case "dt":
        this.onDeath(payload as DeathPayload);
        break;
      case "end":
        this.onMatchEnd(payload as EndPayload);
        break;
    }
  }

  // ── World construction ───────────────────────────────────────────────────

  private buildWorld() {
    const hemi = new THREE.HemisphereLight(0xeef2ff, 0x8a7f70, 1.15);
    this.scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xfff2dd, 1.6);
    dir.position.set(18, 32, 9);
    this.scene.add(dir);

    const floorGeo = new THREE.PlaneGeometry(ARENA_HALF * 2 + 4, ARENA_HALF * 2 + 4);
    const floor = new THREE.Mesh(floorGeo, new THREE.MeshLambertMaterial({ color: FLOOR_COLOR }));
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);

    const grid = new THREE.GridHelper(ARENA_HALF * 2, ARENA_HALF, 0xb3a893, 0xc4baa8);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.35;
    grid.position.y = 0.01;
    this.scene.add(grid);

    for (const t of [0, 1] as Team[]) {
      const decal = new THREE.Mesh(
        new THREE.PlaneGeometry(16, 7),
        new THREE.MeshBasicMaterial({ color: TEAMS[t].colorHex, transparent: true, opacity: 0.14 }),
      );
      decal.rotation.x = -Math.PI / 2;
      decal.position.set(0, 0.02, t === 0 ? -24 : 24);
      this.scene.add(decal);
    }

    const matCache = new Map<number, THREE.MeshLambertMaterial>();
    for (const b of MAP_BOXES) {
      let mat = matCache.get(b.c);
      if (!mat) {
        mat = new THREE.MeshLambertMaterial({ color: b.c });
        matCache.set(b.c, mat);
      }
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), mat);
      mesh.position.set(b.x, b.y + b.h / 2, b.z);
      this.scene.add(mesh);
    }
  }

  private makeFlashSprite(scale: number): THREE.Sprite {
    const cvs = document.createElement("canvas");
    cvs.width = 64;
    cvs.height = 64;
    const c = cvs.getContext("2d")!;
    const grad = c.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0, "rgba(255,240,190,1)");
    grad.addColorStop(0.5, "rgba(255,180,80,0.7)");
    grad.addColorStop(1, "rgba(255,140,40,0)");
    c.fillStyle = grad;
    c.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(cvs);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.setScalar(scale);
    sprite.visible = false;
    return sprite;
  }

  private buildGunMesh(dark: THREE.MeshLambertMaterial): THREE.Group {
    const gun = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, 0.52), dark);
    body.position.set(0, 0, -0.1);
    gun.add(body);
    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 0.3), dark);
    barrel.position.set(0, 0.02, -0.48);
    gun.add(barrel);
    return gun;
  }

  private buildEntity(r: RosterEntry): Entity {
    const teamCol = TEAMS[r.team].colorHex;
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshLambertMaterial({ color: teamCol });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x3c3644 });
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xe6c39c });

    const legs = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.72, 0.3), darkMat);
    legs.position.y = 0.36;
    group.add(legs);
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.6, 0.34), bodyMat);
    torso.position.y = 1.02;
    group.add(torso);
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.5, 0.16), bodyMat);
    armL.position.set(-0.4, 1.05, 0);
    group.add(armL);
    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.5, 0.16), bodyMat);
    armR.position.set(0.4, 1.05, 0);
    group.add(armR);

    const headGroup = new THREE.Group();
    headGroup.position.y = 1.55;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.34), skinMat);
    headGroup.add(head);
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.1, 0.36), bodyMat);
    band.position.y = 0.14;
    headGroup.add(band);
    group.add(headGroup);

    const gun = this.buildGunMesh(darkMat);
    gun.position.set(0.28, 1.28, -0.18);
    group.add(gun);

    const muzzle = this.makeFlashSprite(0.3);
    muzzle.position.set(0.28, 1.3, -0.85);
    group.add(muzzle);

    const labelCanvas = document.createElement("canvas");
    labelCanvas.width = 256;
    labelCanvas.height = 64;
    const labelTex = new THREE.CanvasTexture(labelCanvas);
    labelTex.colorSpace = THREE.SRGBColorSpace;
    const label = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: labelTex, transparent: true, depthWrite: false }),
    );
    label.scale.set(1.7, 0.42, 1);
    label.position.y = 2.12;
    group.add(label);

    group.visible = true;
    this.scene.add(group);

    const ent: Entity = {
      id: r.id,
      name: r.name,
      team: r.team,
      isBot: r.isBot,
      hp: MAX_HP,
      alive: true,
      group,
      gun,
      muzzle,
      label,
      labelCanvas,
      labelTex,
      labelHp: -1,
      snaps: [],
      pos: { x: 0, y: 0, z: 0 },
      yaw: 0,
      pitch: 0,
      walkPhase: 0,
      firingUntil: 0,
      diedAt: 0,
      lastDamageAt: 0,
      bot: null,
    };
    this.drawLabel(ent);
    return ent;
  }

  private drawLabel(ent: Entity) {
    if (ent.labelHp === ent.hp) return;
    ent.labelHp = ent.hp;
    const c = ent.labelCanvas.getContext("2d")!;
    c.clearRect(0, 0, 256, 64);
    c.font = "700 26px system-ui, sans-serif";
    c.textAlign = "center";
    c.fillStyle = "rgba(0,0,0,0.45)";
    c.fillText(ent.name, 129, 29);
    c.fillStyle = TEAMS[ent.team].color;
    c.fillText(ent.name, 128, 27);
    c.fillStyle = "rgba(0,0,0,0.35)";
    c.fillRect(64, 40, 128, 9);
    c.fillStyle = ent.team === this.me.team ? "#4ade80" : "#f87171";
    c.fillRect(65, 41, 126 * Math.max(0, ent.hp / MAX_HP), 7);
    ent.labelTex.needsUpdate = true;
  }

  private buildViewmodel() {
    const dark = new THREE.MeshLambertMaterial({ color: 0x2f2a38 });
    const grey = new THREE.MeshLambertMaterial({ color: 0x554e66 });
    const accent = new THREE.MeshLambertMaterial({ color: 0x8b5cf6 });

    const rifle = this.vmRifle;
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 0.36), dark);
    rifle.add(receiver);
    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.026, 0.3), grey);
    barrel.position.set(0, 0.014, -0.3);
    rifle.add(barrel);
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.07), grey);
    mag.position.set(0, -0.09, 0.02);
    mag.rotation.x = 0.15;
    rifle.add(mag);
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.06, 0.14), dark);
    stock.position.set(0, -0.01, 0.22);
    rifle.add(stock);
    const sightPost = new THREE.Mesh(new THREE.BoxGeometry(0.007, 0.03, 0.007), accent);
    sightPost.position.set(0, 0.052, -0.16);
    rifle.add(sightPost);
    const sightRing = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.008, 0.01), dark);
    sightRing.position.set(0, 0.045, 0.05);
    rifle.add(sightRing);

    const pistol = this.vmPistol;
    const pBody = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.08, 0.2), dark);
    pistol.add(pBody);
    const pBarrel = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.024, 0.1), grey);
    pBarrel.position.set(0, 0.02, -0.14);
    pistol.add(pBarrel);
    const pGrip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.05), grey);
    pGrip.position.set(0, -0.07, 0.06);
    pGrip.rotation.x = 0.25;
    pistol.add(pGrip);
    const pSight = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.022, 0.006), accent);
    pSight.position.set(0, 0.055, -0.08);
    pistol.add(pSight);
    pistol.visible = false;

    this.viewmodel.add(rifle);
    this.viewmodel.add(pistol);
    this.viewmodel.position.set(0.16, -0.15, -0.3);
    this.camera.add(this.viewmodel);
  }

  // ── Input ────────────────────────────────────────────────────────────────

  private bindInput() {
    const canvas = this.renderer.domElement;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Tab") e.preventDefault();
      if (this.paused || this.over) return;
      this.keys.add(e.code);
      if (e.code === "KeyR") this.startReload();
      if (e.code === "Digit1" && this.weapon !== "rifle") this.swapWeapon();
      if (e.code === "Digit2" && this.weapon !== "pistol") this.swapWeapon();
      if (e.code === "KeyQ") this.swapWeapon();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      this.keys.delete(e.code);
    };
    const onMouseDown = (e: MouseEvent) => {
      if (this.paused || this.over) return;
      if (document.pointerLockElement !== canvas) return;
      if (e.button === 0) {
        this.triggerHeld = true;
        this.fireLatch = true;
      }
      if (e.button === 2) this.adsHeld = true;
    };
    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        this.triggerHeld = false;
        this.triggerConsumed = false;
      }
      if (e.button === 2) this.adsHeld = false;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== canvas || this.paused || this.over) return;
      const fovScale = this.camera.fov / BASE_FOV;
      const s = 0.0023 * this.sensMult * fovScale;
      this.yaw -= e.movementX * s;
      this.pitch -= e.movementY * s;
      this.pitch = Math.max(-1.52, Math.min(1.52, this.pitch));
    };
    const onContext = (e: Event) => e.preventDefault();
    const onLockChange = () => {
      this.cfg.events.onPointerLock(document.pointerLockElement === canvas);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("contextmenu", onContext);
    document.addEventListener("pointerlockchange", onLockChange);

    this.cleanupFns.push(() => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("contextmenu", onContext);
      document.removeEventListener("pointerlockchange", onLockChange);
    });
  }

  private readSens() {
    const raw = localStorage.getItem(SENS_KEY);
    const v = raw ? parseFloat(raw) : 1;
    if (!Number.isNaN(v) && v > 0.1 && v < 4) this.sensMult = v;
  }

  private resize() {
    const w = this.cfg.container.clientWidth || 1;
    const h = this.cfg.container.clientHeight || 1;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  // ── Spawning ─────────────────────────────────────────────────────────────

  private teamSpawn(team: Team, index: number): Vec3 {
    const spawns = SPAWNS[team];
    return { ...spawns[Math.max(0, index) % spawns.length] };
  }

  private livingEnemyPositions(team: Team): Vec3[] {
    const out: Vec3[] = [];
    for (const e of this.entities.values()) {
      if (e.team !== team && e.alive) out.push(e.pos);
    }
    if (this.me.team !== team && this.alive) out.push(this.pos);
    return out;
  }

  private adoptBots() {
    for (const e of this.entities.values()) {
      if (!e.isBot || e.bot) continue;
      const sim = createBotSim(e.id, e.team, e.pos.x === 0 && e.pos.z === 0 ? this.teamSpawn(e.team, Number(e.id.slice(1)) % 4) : e.pos, spawnYaw(e.team));
      sim.hp = e.hp;
      sim.alive = e.alive;
      if (!e.alive) sim.respawnAt = performance.now() + RESPAWN_MS;
      e.bot = sim;
      e.pos = { ...sim.pos };
    }
  }

  // ── Frame loop ───────────────────────────────────────────────────────────

  private frame = (now: number) => {
    this.raf = requestAnimationFrame(this.frame);
    const dt = Math.min(0.1, (now - this.lastFrame) / 1000);
    this.lastFrame = now;

    if (this.started && !this.over && !(this.paused && this.cfg.practice)) {
      this.acc += dt;
      while (this.acc >= STEP) {
        this.stepSim(STEP, performance.now());
        this.acc -= STEP;
      }
    }

    this.updateVisuals(now, dt);
    this.renderer.render(this.scene, this.camera);
  };

  private msLeft(now: number): number {
    if (this.isAuthority) return Math.max(0, MATCH_MS - (now - this.beginAt));
    return this.lastMsLeft;
  }

  private stepSim(dt: number, now: number) {
    this.stepLocal(dt, now);

    if (this.isAuthority) {
      this.stepBots(dt, now);
      const left = this.msLeft(now);
      if (left <= 0 || this.teamScores[0] >= KILL_LIMIT || this.teamScores[1] >= KILL_LIMIT) {
        this.endMatch();
      }
    }

    if (now - this.lastStateSend >= STATE_SEND_MS) {
      this.lastStateSend = now;
      this.netFlush(now);
    }
    if (now - this.lastHudSend >= 100) {
      this.lastHudSend = now;
      this.emitHud();
    }
  }

  // ── Local player sim ─────────────────────────────────────────────────────

  private stepLocal(dt: number, now: number) {
    if (!this.alive) {
      if (now >= this.respawnAt) this.respawnLocal(now);
      return;
    }

    // Regen
    if (this.hp < MAX_HP && now - this.lastDamageAt > REGEN_DELAY_MS) {
      this.hp = Math.min(MAX_HP, this.hp + REGEN_PER_S * dt);
    }

    // Movement input
    let ix = 0;
    let iz = 0;
    if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) iz -= 1;
    if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) iz += 1;
    if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) ix -= 1;
    if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) ix += 1;
    ix += this.touchMove.x;
    iz += this.touchMove.y;
    const ilen = Math.hypot(ix, iz);
    if (ilen > 1) {
      ix /= ilen;
      iz /= ilen;
    }

    const touchSprint = Math.hypot(this.touchMove.x, this.touchMove.y) > 0.92;
    this.sprintHeld =
      (this.keys.has("ShiftLeft") || this.keys.has("ShiftRight") || touchSprint) &&
      iz < -0.35 &&
      this.adsAmount < 0.3 &&
      !this.triggerHeld;

    const speed =
      (this.sprintHeld ? SPRINT_SPEED : WALK_SPEED) *
      (1 - (1 - ADS_SPEED_MULT) * this.adsAmount);

    const sin = Math.sin(this.yaw);
    const cos = Math.cos(this.yaw);
    const wishX = (ix * cos - iz * sin) * speed;
    const wishZ = (ix * sin + iz * cos) * speed;

    const control = this.grounded ? 1 : AIR_CONTROL;
    const blend = Math.min(1, 14 * dt * control);
    this.vel.x += (wishX - this.vel.x) * blend;
    this.vel.z += (wishZ - this.vel.z) * blend;

    if ((this.keys.has("Space") || this.touchJump) && this.grounded) {
      this.vel.y = JUMP_V;
      this.grounded = false;
    }
    this.touchJump = false;

    this.vel.y -= GRAVITY * dt;
    const res = slideMove(this.pos, this.vel, dt, MAP_BOXES, this.grounded);
    this.grounded = res.grounded;

    // Touch look
    if (this.touchLook.x !== 0 || this.touchLook.y !== 0) {
      const fovScale = this.camera.fov / BASE_FOV;
      const s = 0.0042 * this.sensMult * fovScale;
      this.yaw -= this.touchLook.x * s;
      this.pitch = Math.max(-1.52, Math.min(1.52, this.pitch - this.touchLook.y * s));
      this.touchLook.x = 0;
      this.touchLook.y = 0;
    }

    // ADS
    const adsTarget = this.adsHeld && !this.sprintHeld ? 1 : 0;
    this.adsAmount += (adsTarget - this.adsAmount) * Math.min(1, 12 * dt);

    // Walk bob
    const hSpeed = Math.hypot(this.vel.x, this.vel.z);
    if (this.grounded && hSpeed > 0.5) this.walkPhase += dt * hSpeed * 1.6;

    // Weapons
    if (this.reloadUntil > 0 && now >= this.reloadUntil) {
      this.mags[this.weapon] = WEAPONS[this.weapon].magSize;
      this.reloadUntil = 0;
    }
    if (this.triggerHeld || this.fireLatch) {
      this.fireLatch = false;
      this.tryFire(now);
    }

    if (this.pos.y < -5) {
      this.hp = 0;
      this.localDie("h?", false, now);
    }
  }

  private tryFire(now: number) {
    const spec = WEAPONS[this.weapon];
    if (!this.alive || this.over) return;
    if (now < this.nextShotAt || now < this.swapUntil || this.reloadUntil > 0) return;
    if (!spec.auto && this.triggerConsumed) return;

    if (this.mags[this.weapon] <= 0) {
      sfxDryFire();
      this.triggerConsumed = true;
      this.startReload();
      return;
    }

    this.mags[this.weapon]--;
    this.nextShotAt = now + 60_000 / spec.rpm;
    this.triggerConsumed = true;

    const moveFactor = Math.min(1, Math.hypot(this.vel.x, this.vel.z) / WALK_SPEED);
    const airFactor = this.grounded ? 0 : 0.022;
    const spread =
      spec.spreadBase * (1 - this.adsAmount) +
      spec.spreadAds * this.adsAmount +
      spec.spreadMove * moveFactor * (1 - this.adsAmount * 0.75) +
      airFactor;

    const fwd = new THREE.Vector3();
    this.camera.getWorldDirection(fwd);
    const dir = spreadDir({ x: fwd.x, y: fwd.y, z: fwd.z }, spread, Math.random);
    const eye: Vec3 = { x: this.pos.x, y: this.pos.y + EYE_HEIGHT, z: this.pos.z };

    this.fireHitscan(this.cfg.localId, this.me.team, eye, dir, spec, now, true);

    this.kickPitch += spec.recoilPitch * (0.8 + Math.random() * 0.4);
    this.kickYaw += (Math.random() - 0.5) * spec.recoilYaw * 2;
    this.vmKick = 1;
    this.muzzleUntil = now + 55;
    sfxShot(this.weapon, true);
  }

  private fireHitscan(
    shooterId: EntityId,
    shooterTeam: Team,
    eye: Vec3,
    dir: Vec3,
    spec: (typeof WEAPONS)[WeaponId],
    now: number,
    isLocalShot: boolean,
  ) {
    const worldT = rayWorld(eye, dir, 200, MAP_BOXES);

    let bestT = worldT;
    let bestEnt: Entity | null = null;
    let bestLocal = false;
    let bestHs = false;

    for (const e of this.entities.values()) {
      if (e.id === shooterId || !e.alive || e.team === shooterTeam) continue;
      const hit = rayEntity(eye, dir, e.pos);
      if (hit && hit.t < bestT) {
        bestT = hit.t;
        bestEnt = e;
        bestLocal = false;
        bestHs = hit.hs;
      }
    }
    if (!isLocalShot && this.alive && this.me.team !== shooterTeam) {
      const hit = rayEntity(eye, dir, this.pos);
      if (hit && hit.t < bestT) {
        bestT = hit.t;
        bestEnt = null;
        bestLocal = true;
        bestHs = hit.hs;
      }
    }

    const end: [number, number, number] = [
      eye.x + dir.x * bestT,
      eye.y + dir.y * bestT,
      eye.z + dir.z * bestT,
    ];
    this.spawnTracer(eye, end);
    if (!bestEnt && !bestLocal) this.spawnSpark(end, 0xffc36b);
    else this.spawnSpark(end, 0xff6b6b);

    const queue = this.pendingFx.get(shooterId) ?? [];
    queue.push({ o: [eye.x, eye.y, eye.z], e: end });
    this.pendingFx.set(shooterId, queue);

    if (bestLocal) {
      const dmg = damageForHit(spec, bestT, bestHs);
      this.applyDamageToLocal(dmg, shooterId, bestHs, now);
      return;
    }
    if (!bestEnt) return;

    const dmg = damageForHit(spec, bestT, bestHs);
    if (isLocalShot) {
      this.cfg.events.onHitmarker(bestHs);
      sfxHitConfirm(bestHs);
    }

    if (bestEnt.isBot && this.isAuthority) {
      this.applyDamageToBot(bestEnt, dmg, shooterId, bestHs, now);
    } else {
      this.cfg.send("ht", { a: shooterId, t: bestEnt.id, d: dmg, hs: bestHs ? 1 : 0 } satisfies HitPayload);
    }
  }

  private startReload() {
    const spec = WEAPONS[this.weapon];
    if (!this.alive || this.reloadUntil > 0 || this.mags[this.weapon] >= spec.magSize) return;
    this.reloadUntil = performance.now() + spec.reloadMs;
    sfxReload();
  }

  private swapWeapon() {
    if (!this.alive) return;
    this.weapon = this.weapon === "rifle" ? "pistol" : "rifle";
    this.swapUntil = performance.now() + WEAPONS[this.weapon].swapMs;
    this.reloadUntil = 0;
    this.vmRifle.visible = this.weapon === "rifle";
    this.vmPistol.visible = this.weapon === "pistol";
    this.emitHud(true);
  }

  private applyDamageToLocal(dmg: number, attackerId: EntityId, hs: boolean, now: number) {
    if (!this.alive || now < this.protectedUntil || this.over) return;
    this.hp -= dmg;
    this.lastDamageAt = now;
    this.shakeRoll = (Math.random() - 0.5) * 0.09;
    sfxDamageTaken();
    this.cfg.events.onDamageFlash();
    if (this.hp <= 0) {
      this.hp = 0;
      this.localDie(attackerId, hs, now);
    }
  }

  private localDie(attackerId: EntityId, hs: boolean, now: number) {
    if (!this.alive) return;
    this.alive = false;
    this.respawnAt = now + RESPAWN_MS;
    this.diedBy = this.roster.get(attackerId)?.name ?? "the arena";
    this.recordKill(attackerId, this.cfg.localId, hs);
    this.cfg.send("dt", { v: this.cfg.localId, a: attackerId, hs: hs ? 1 : 0 } satisfies DeathPayload);
    sfxDeath();
    this.emitHud(true);
  }

  private respawnLocal(now: number) {
    const spawn = pickSpawn(this.me.team, this.livingEnemyPositions(this.me.team));
    this.pos = { ...spawn };
    this.vel = { x: 0, y: 0, z: 0 };
    this.yaw = spawnYaw(this.me.team);
    this.pitch = 0;
    this.hp = MAX_HP;
    this.alive = true;
    this.protectedUntil = now + SPAWN_PROTECT_MS;
    this.mags = { rifle: WEAPONS.rifle.magSize, pistol: WEAPONS.pistol.magSize };
    this.reloadUntil = 0;
    this.weapon = "rifle";
    this.vmRifle.visible = true;
    this.vmPistol.visible = false;
    sfxRespawn();
    this.emitHud(true);
  }

  // ── Bots (authority side) ────────────────────────────────────────────────

  private stepBots(dt: number, now: number) {
    const botRnd = this.rnd;
    for (const e of this.entities.values()) {
      if (!e.bot) continue;
      const bot = e.bot;

      if (!bot.alive) {
        if (now >= bot.respawnAt) {
          const spawn = pickSpawn(bot.team, this.livingEnemyPositions(bot.team));
          bot.pos = { ...spawn };
          bot.vel = { x: 0, y: 0, z: 0 };
          bot.hp = MAX_HP;
          bot.alive = true;
          bot.mode = "patrol";
          bot.yaw = spawnYaw(bot.team);
          e.alive = true;
          e.hp = MAX_HP;
          e.snaps = [];
        }
        continue;
      }

      if (bot.hp < MAX_HP && now - bot.lastDamageAt > REGEN_DELAY_MS) {
        bot.hp = Math.min(MAX_HP, bot.hp + REGEN_PER_S * dt);
        e.hp = Math.round(bot.hp);
      }

      const enemies: BotTargetView[] = [];
      for (const other of this.entities.values()) {
        if (other.team !== bot.team && other.alive) enemies.push({ id: other.id, pos: other.pos });
      }
      if (this.alive && this.me.team !== bot.team && performance.now() >= this.protectedUntil) {
        enemies.push({ id: this.cfg.localId, pos: this.pos });
      }

      updateBot(bot, {
        now,
        rnd: botRnd,
        boxes: MAP_BOXES,
        enemies,
        fire: (b, dir) => {
          const eye: Vec3 = { x: b.pos.x, y: b.pos.y + EYE_HEIGHT, z: b.pos.z };
          this.fireHitscan(b.id, b.team, eye, dir, WEAPONS.rifle, now, false);
          const dist = Math.hypot(b.pos.x - this.pos.x, b.pos.z - this.pos.z);
          sfxShot("rifle", false, dist);
          e.firingUntil = now + 90;
        },
      }, dt);

      e.pos = bot.pos;
      e.yaw = bot.yaw;
      e.pitch = bot.pitch;
      e.hp = Math.round(bot.hp);
    }
  }

  private applyDamageToBot(ent: Entity, dmg: number, attackerId: EntityId, hs: boolean, now: number) {
    const bot = ent.bot;
    if (!bot || !bot.alive) return;
    bot.hp -= dmg;
    bot.lastDamageAt = now;
    ent.hp = Math.max(0, Math.round(bot.hp));
    if (bot.hp <= 0) {
      bot.alive = false;
      bot.respawnAt = now + RESPAWN_MS;
      ent.alive = false;
      ent.diedAt = now;
      this.recordKill(attackerId, ent.id, hs);
      this.cfg.send("dt", { v: ent.id, a: attackerId, hs: hs ? 1 : 0 } satisfies DeathPayload);
    }
  }

  // ── Scoring ──────────────────────────────────────────────────────────────

  private recordKill(attackerId: EntityId, victimId: EntityId, hs: boolean) {
    const att = this.roster.get(attackerId);
    const vic = this.roster.get(victimId);
    const attScore = this.scores.get(attackerId);
    const vicScore = this.scores.get(victimId);
    if (vicScore) vicScore.deaths++;
    if (att && vic && att.team !== vic.team) {
      if (attScore) attScore.kills++;
      this.teamScores[att.team]++;
    }
    if (att && vic) {
      this.cfg.events.onKillFeed({
        key: this.feedKey++,
        attacker: att.name,
        attackerTeam: att.team,
        victim: vic.name,
        victimTeam: vic.team,
        hs,
      });
    }
    if (attackerId === this.cfg.localId) sfxKill();
    this.emitHud(true);
  }

  private endMatch() {
    if (this.over) return;
    const payload: EndPayload = { scores: [...this.teamScores], rows: this.buildRows() };
    this.cfg.send("end", payload);
    this.onMatchEnd(payload);
  }

  private buildRows(): ScoreRow[] {
    const rows: ScoreRow[] = [];
    for (const r of this.roster.values()) {
      const s = this.scores.get(r.id) ?? { kills: 0, deaths: 0 };
      rows.push({ id: r.id, name: r.name, team: r.team, kills: s.kills, deaths: s.deaths, isBot: r.isBot });
    }
    rows.sort((a, b) => b.kills - a.kills || a.deaths - b.deaths);
    return rows;
  }

  private onMatchEnd(p: EndPayload) {
    if (this.over) return;
    this.over = true;
    this.teamScores = [...p.scores];
    if (document.pointerLockElement === this.renderer.domElement) document.exitPointerLock();
    this.cfg.events.onEnd(p);
  }

  // ── Net in ───────────────────────────────────────────────────────────────

  private onRemoteState(p: StatePayload) {
    if (p.id === this.cfg.localId) return;
    const e = this.entities.get(p.id);
    if (!e) return;
    const now = performance.now();
    e.snaps.push({ t: now, x: p.p[0], y: p.p[1], z: p.p[2], yaw: p.yaw, pitch: p.pitch });
    if (e.snaps.length > 30) e.snaps.splice(0, e.snaps.length - 30);
    e.hp = p.hp;
    if (p.dead === 0 && !e.alive) {
      e.alive = true;
      e.snaps = e.snaps.slice(-1);
    }
    if (p.dead === 1 && e.alive) {
      e.alive = false;
      e.diedAt = now;
    }
  }

  private onBotsState(p: BotsPayload) {
    if (this.isAuthority) return;
    this.lastMsLeft = p.msLeft;
    this.teamScores = [...p.scores];
    const now = performance.now();
    for (const [idx, x, y, z, yaw, hp, firing] of p.list) {
      const e = this.entities.get(`b${idx}`);
      if (!e) continue;
      e.snaps.push({ t: now, x, y, z, yaw, pitch: 0 });
      if (e.snaps.length > 30) e.snaps.splice(0, e.snaps.length - 30);
      const wasAlive = e.alive;
      e.hp = hp;
      if (hp > 0 && !wasAlive) {
        e.alive = true;
        e.snaps = e.snaps.slice(-1);
      }
      if (firing) e.firingUntil = now + 90;
    }
  }

  private onFx(p: FxPayload) {
    if (p.id === this.cfg.localId) return;
    const e = this.entities.get(p.id);
    for (const s of p.shots) {
      this.spawnTracer({ x: s.o[0], y: s.o[1], z: s.o[2] }, s.e);
      this.spawnSpark(s.e, 0xffc36b);
    }
    if (e && p.shots.length > 0) {
      e.firingUntil = performance.now() + 90;
      const dist = Math.hypot(e.pos.x - this.pos.x, e.pos.z - this.pos.z);
      sfxShot("rifle", false, dist);
    }
  }

  private onHit(p: HitPayload) {
    const now = performance.now();
    if (p.t === this.cfg.localId) {
      this.applyDamageToLocal(p.d, p.a, p.hs === 1, now);
      return;
    }
    const e = this.entities.get(p.t);
    if (e?.bot && this.isAuthority) {
      this.applyDamageToBot(e, p.d, p.a, p.hs === 1, now);
    }
  }

  private onDeath(p: DeathPayload) {
    const e = this.entities.get(p.v);
    if (e) {
      e.alive = false;
      e.hp = 0;
      e.diedAt = performance.now();
      if (e.bot) {
        e.bot.alive = false;
        e.bot.respawnAt = performance.now() + RESPAWN_MS;
      }
    }
    this.recordKill(p.a, p.v, p.hs === 1);
  }

  // ── Net out ──────────────────────────────────────────────────────────────

  private netFlush(now: number) {
    if (this.cfg.practice) {
      this.pendingFx.clear();
      return;
    }

    this.cfg.send("st", {
      id: this.cfg.localId,
      p: [round2(this.pos.x), round2(this.pos.y), round2(this.pos.z)],
      yaw: round3(this.yaw),
      pitch: round3(this.pitch),
      hp: Math.round(this.hp),
      w: this.weapon,
      dead: this.alive ? 0 : 1,
    } satisfies StatePayload);

    if (this.isAuthority) {
      const list: BotsPayload["list"] = [];
      for (const e of this.entities.values()) {
        if (!e.bot) continue;
        list.push([
          Number(e.id.slice(1)),
          round2(e.pos.x),
          round2(e.pos.y),
          round2(e.pos.z),
          round3(e.yaw),
          Math.max(0, Math.round(e.bot.hp)),
          now < e.bot.firingUntil ? 1 : 0,
        ]);
      }
      if (list.length > 0) {
        this.cfg.send("bt", { list, msLeft: this.msLeft(now), scores: [...this.teamScores] } satisfies BotsPayload);
      }
    }

    if (this.pendingFx.size > 0) {
      for (const [id, shots] of this.pendingFx) {
        if (id !== this.cfg.localId && !this.entities.get(id)?.bot) continue;
        this.cfg.send("fx", { id, shots } satisfies FxPayload);
      }
      this.pendingFx.clear();
    }
  }

  // ── Visual update ────────────────────────────────────────────────────────

  private updateVisuals(now: number, dt: number) {
    // Camera
    const bobAmp = 0.021 * (1 - this.adsAmount * 0.8);
    const bob = this.alive ? Math.sin(this.walkPhase * 2) * bobAmp * Math.min(1, Math.hypot(this.vel.x, this.vel.z) / WALK_SPEED) : 0;
    const deadDrop = this.alive ? 0 : 0.85;
    this.camera.position.set(this.pos.x, this.pos.y + EYE_HEIGHT + bob - deadDrop, this.pos.z);

    this.kickPitch *= Math.max(0, 1 - 9 * dt);
    this.kickYaw *= Math.max(0, 1 - 9 * dt);
    this.shakeRoll *= Math.max(0, 1 - 7 * dt);
    const rollDead = this.alive ? 0 : 0.35;
    this.camera.rotation.set(0, 0, 0);
    this.camera.rotateY(this.yaw + this.kickYaw);
    this.camera.rotateX(this.pitch + this.kickPitch);
    this.camera.rotateZ(this.shakeRoll + rollDead);

    const targetFov =
      (BASE_FOV - (BASE_FOV - WEAPONS[this.weapon].adsFov) * this.adsAmount) +
      (this.sprintHeld ? 4 : 0);
    if (Math.abs(this.camera.fov - targetFov) > 0.1) {
      this.camera.fov += (targetFov - this.camera.fov) * Math.min(1, 11 * dt);
      this.camera.updateProjectionMatrix();
    }

    // Viewmodel
    const spec = WEAPONS[this.weapon];
    this.vmKick *= Math.max(0, 1 - 10 * dt);
    const hipPos = { x: 0.16, y: -0.15, z: -0.3 };
    const adsPos = { x: 0, y: -0.104, z: -0.23 };
    const a = this.adsAmount;
    const sprintDip = this.sprintHeld ? 1 : 0;
    const reloadT = this.reloadUntil > 0 ? Math.max(0, Math.min(1, 1 - (this.reloadUntil - now) / spec.reloadMs)) : 0;
    const reloadDip = this.reloadUntil > 0 ? Math.sin(reloadT * Math.PI) : 0;
    this.viewmodel.position.set(
      hipPos.x + (adsPos.x - hipPos.x) * a + Math.sin(this.walkPhase) * 0.006 * (1 - a),
      hipPos.y + (adsPos.y - hipPos.y) * a + Math.abs(Math.cos(this.walkPhase)) * 0.005 * (1 - a) - reloadDip * 0.12 - sprintDip * 0.05,
      hipPos.z + (adsPos.z - hipPos.z) * a + this.vmKick * 0.04,
    );
    this.viewmodel.rotation.set(
      -reloadDip * 0.7 + this.vmKick * 0.05,
      sprintDip * 0.4,
      0,
    );
    this.viewmodel.visible = this.alive;

    this.muzzleFlash.visible = now < this.muzzleUntil && this.alive;
    this.muzzleLight.intensity = now < this.muzzleUntil ? 9 : 0;

    // Entities
    const renderT = now - INTERP_DELAY_MS;
    for (const e of this.entities.values()) {
      if (!e.bot) this.interpolate(e, renderT);
      this.poseEntity(e, now, dt);
    }

    // Tracers/sparks decay
    for (const t of this.tracers) {
      if (now >= t.until) t.line.visible = false;
      else t.mat.opacity = ((t.until - now) / TRACER_MS) * 0.85;
    }
    for (const s of this.sparks) {
      if (now >= s.until) s.sprite.visible = false;
      else {
        const f = (s.until - now) / 130;
        s.mat.opacity = f;
        s.sprite.scale.setScalar(s.scale * (1.6 - f * 0.6));
      }
    }
  }

  private interpolate(e: Entity, renderT: number) {
    const snaps = e.snaps;
    if (snaps.length === 0) return;
    if (snaps.length === 1 || renderT <= snaps[0].t) {
      const s = snaps[0];
      e.pos = { x: s.x, y: s.y, z: s.z };
      e.yaw = s.yaw;
      e.pitch = s.pitch;
      return;
    }
    let i = snaps.length - 1;
    while (i > 0 && snaps[i - 1].t > renderT) i--;
    const s1 = snaps[Math.min(i, snaps.length - 1)];
    const s0 = snaps[Math.max(0, i - 1)];
    const span = s1.t - s0.t;
    const f = span > 0 ? Math.max(0, Math.min(1.3, (renderT - s0.t) / span)) : 1;
    const jump = Math.hypot(s1.x - s0.x, s1.z - s0.z);
    if (jump > 4) {
      e.pos = { x: s1.x, y: s1.y, z: s1.z };
      e.yaw = s1.yaw;
      e.pitch = s1.pitch;
      return;
    }
    e.pos = {
      x: s0.x + (s1.x - s0.x) * f,
      y: s0.y + (s1.y - s0.y) * f,
      z: s0.z + (s1.z - s0.z) * f,
    };
    e.yaw = lerpAngle(s0.yaw, s1.yaw, f);
    e.pitch = s0.pitch + (s1.pitch - s0.pitch) * f;
  }

  private poseEntity(e: Entity, now: number, dt: number) {
    const g = e.group;
    if (!e.alive) {
      const t = Math.min(1, (now - e.diedAt) / 420);
      g.rotation.z = (Math.PI / 2) * t;
      const sink = now - e.diedAt > 1300 ? Math.min(1, (now - e.diedAt - 1300) / 900) : 0;
      g.position.set(e.pos.x, e.pos.y + 0.35 * t - sink * 1.4, e.pos.z);
      g.visible = now - e.diedAt < CORPSE_HIDE_MS;
      e.label.visible = false;
      return;
    }
    g.visible = true;
    g.rotation.z = 0;
    e.walkPhase += dt * 6;
    g.position.set(e.pos.x, e.pos.y, e.pos.z);
    g.rotation.y = e.yaw;
    e.gun.rotation.x = e.pitch;
    e.muzzle.visible = now < e.firingUntil;
    e.label.visible = true;
    this.drawLabel(e);
  }

  private spawnTracer(from: Vec3, to: [number, number, number]) {
    let tracer = this.tracers.find((t) => !t.line.visible);
    if (!tracer && this.tracers.length < 48) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
      const mat = new THREE.LineBasicMaterial({
        color: 0xffd27a,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const line = new THREE.Line(geo, mat);
      line.frustumCulled = false;
      this.scene.add(line);
      tracer = { line, mat, until: 0 };
      this.tracers.push(tracer);
    }
    if (!tracer) return;
    const attr = tracer.line.geometry.getAttribute("position") as THREE.BufferAttribute;
    attr.setXYZ(0, from.x, from.y - 0.06, from.z);
    attr.setXYZ(1, to[0], to[1], to[2]);
    attr.needsUpdate = true;
    tracer.line.visible = true;
    tracer.until = performance.now() + TRACER_MS;
  }

  private spawnSpark(at: [number, number, number], color: number) {
    let spark = this.sparks.find((s) => !s.sprite.visible);
    if (!spark && this.sparks.length < 32) {
      const mat = new THREE.SpriteMaterial({
        map: this.muzzleFlash.material.map,
        color,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(mat);
      this.scene.add(sprite);
      spark = { sprite, mat, until: 0, scale: 0.22 };
      this.sparks.push(spark);
    }
    if (!spark) return;
    spark.mat.color.setHex(color);
    spark.sprite.position.set(at[0], at[1], at[2]);
    spark.sprite.visible = true;
    spark.until = performance.now() + 130;
  }

  // ── HUD ──────────────────────────────────────────────────────────────────

  private emitHud(force = false) {
    const now = performance.now();
    if (!force && now - this.lastHudSend < 90) return;
    const s = this.scores.get(this.cfg.localId) ?? { kills: 0, deaths: 0 };
    this.cfg.events.onHud({
      hp: Math.max(0, Math.round(this.hp)),
      ammo: this.mags[this.weapon],
      magSize: WEAPONS[this.weapon].magSize,
      weapon: this.weapon,
      reloading: this.reloadUntil > 0,
      scores: [...this.teamScores],
      msLeft: this.started ? this.msLeft(now) : MATCH_MS,
      kills: s.kills,
      deaths: s.deaths,
      ads: this.adsAmount > 0.5,
      dead: this.alive ? null : { by: this.diedBy, msLeft: Math.max(0, this.respawnAt - now) },
      spawnProtected: now < this.protectedUntil,
    });
  }

  getScoreRows(): ScoreRow[] {
    return this.buildRows();
  }

  getMyTeam(): Team {
    return this.me.team;
  }
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
function round3(v: number): number {
  return Math.round(v * 1000) / 1000;
}
function lerpAngle(a: number, b: number, f: number): number {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * f;
}
