/**
 * Single source of truth for sprite-sheet character & animation identifiers.
 *
 * Texture and animation keys are otherwise spread across BootScene + every
 * scene as ad-hoc strings (`"mom_run"`, `"parent1_jump_003"`, ...). This
 * module centralises the naming so:
 *   - typos surface as TypeScript errors instead of silently-missing textures,
 *   - renaming a character or animation is a single-file change,
 *   - BootScene's preload + animation registration both iterate the same
 *     `SPRITE_ANIMS` table.
 *
 * Convention:
 *   - texture key for frame i:  `<char>_<anim>_<NNN>` (zero-padded to 3)
 *   - animation key:            `<char>_<anim>`
 */

export const Char = {
  Mom: "mom",
  Zeno: "zeno",
  Teacher: "teacher",
  Parent1: "parent1",
  Parent2: "parent2",
  Parent3: "parent3",
} as const;
export type Char = (typeof Char)[keyof typeof Char];

export const Anim = {
  Run: "run",
  Jump: "jump",
  Idle: "idle",
  Wave: "wave",
  Hug: "hug",
  Walk: "walk",
} as const;
export type Anim = (typeof Anim)[keyof typeof Anim];

/** `<char>_<anim>_NNN` — texture key for a single frame. */
export const frameKey = (char: Char, anim: Anim, idx: number): string =>
  `${char}_${anim}_${idx.toString().padStart(3, "0")}`;

/** `<char>_<anim>` — animation key registered in the global anim manager. */
export const animKey = (char: Char, anim: Anim): string => `${char}_${anim}`;

/**
 * Per-character display metadata used by scenes that mix characters at
 * different scales (e.g. mom + zeno standing next to each other in the
 * kindergarten cutscene).
 *
 * - `scale` is a multiplier applied on top of whatever base scale a scene
 *   picks (e.g. `RACE.runnerScale`). The AI rendered every character at
 *   roughly the same body height inside its 208x208 canvas — so without a
 *   per-character shrink, a toddler and an adult come out the same height.
 *   Adults are 1.0 (base scale wins); Zeno is ~0.62 to read as a 3-year-old.
 *
 * - `feetOffsetPx` is the distance from the sprite's centered origin (0.5,
 *   0.5) to where the character's *feet* are actually drawn, measured in
 *   source pixels at scale 1. With Phaser's centered origin a scene plants
 *   feet on a floor line via:
 *
 *       feet_y = center_y + feetOffsetPx * scale
 *
 *   …and back-solves for the smaller character's `center_y` so its feet
 *   land on the same line as the bigger one's. The numbers are
 *   **tuned by eye, not measured** — bump up if a character looks too low,
 *   bring it down if too high. They roughly correspond to feet sitting
 *   ~74% of the way down a 208-px frame, with the rest being the AI's
 *   bottom whitespace.
 */
export const CHAR_DISPLAY: Readonly<
  Record<Char, { scale: number; feetOffsetPx: number }>
> = {
  [Char.Mom]: { scale: 1, feetOffsetPx: 50 },
  [Char.Teacher]: { scale: 1, feetOffsetPx: 50 },
  [Char.Parent1]: { scale: 1, feetOffsetPx: 50 },
  [Char.Parent2]: { scale: 1, feetOffsetPx: 50 },
  [Char.Parent3]: { scale: 1, feetOffsetPx: 50 },
  [Char.Zeno]: { scale: 0.62, feetOffsetPx: 50 },
};

/**
 * Compute the y-position to assign to a sprite (with the default centered
 * origin) so that its *feet* land on the given screen-space `feetY`, given
 * the character and the absolute display scale you intend to render it at.
 */
export function spriteCenterYForFeet(
  feetY: number,
  char: Char,
  scale: number,
): number {
  return feetY - CHAR_DISPLAY[char].feetOffsetPx * scale;
}

export type SpriteAnimDef = Readonly<{
  char: Char;
  anim: Anim;
  /** Number of frames (frame_000.png … frame_<frames-1>.png). */
  frames: number;
  fps: number;
  /** -1 to loop forever, 0 to play once and freeze on the last frame. */
  repeat: number;
}>;

/**
 * Every animation we ship. BootScene loads each frame as a texture and
 * registers each row as an animation in `this.anims` during `create()`.
 */
/**
 * Per-character racing stats used by `RaceScene` to give each AI parent its
 * own personality. Mom is the player, so she has no entry here — her speed is
 * driven by the human masher. Teacher / Zeno don't race.
 *
 * Tuning rules of thumb:
 *   - `tapIntervalMs` — average ms between AI taps. Lower = faster runner.
 *     Frame-cap is ~120 (matching a strong human masher); 320+ is sluggish.
 *   - `jumpSkill` — probability the AI commits to a jump when an obstacle
 *     enters its planning window. 0.4 = trips often, 0.9 = nearly perfect.
 */
export type RacerStats = Readonly<{
  displayName: string;
  tapIntervalMs: number;
  jumpSkill: number;
}>;

export const RACER_STATS: Readonly<Partial<Record<Char, RacerStats>>> = {
  // Old lady: brittle joints, slow shuffle, trips a lot.
  [Char.Parent1]: {
    displayName: "Grandma",
    tapIntervalMs: 300,
    jumpSkill: 0.4,
  },
  // Athletic mom in a hurry: the headline competitor — quick cadence,
  // near-perfect jumper. Still beatable by a determined player.
  [Char.Parent2]: {
    displayName: "Latina Mom",
    tapIntervalMs: 170,
    jumpSkill: 0.88,
  },
  // Out-of-shape smoker: medium pace, frequently winded by obstacles.
  [Char.Parent3]: {
    displayName: "Mr. Smoker",
    tapIntervalMs: 215,
    jumpSkill: 0.55,
  },
};

export const SPRITE_ANIMS: readonly SpriteAnimDef[] = [
  { char: Char.Mom, anim: Anim.Run, frames: 8, fps: 14, repeat: -1 },
  { char: Char.Mom, anim: Anim.Jump, frames: 8, fps: 14, repeat: 0 },
  { char: Char.Mom, anim: Anim.Idle, frames: 4, fps: 6, repeat: -1 },
  { char: Char.Mom, anim: Anim.Wave, frames: 9, fps: 10, repeat: -1 },
  { char: Char.Mom, anim: Anim.Hug, frames: 9, fps: 10, repeat: 0 },

  { char: Char.Zeno, anim: Anim.Run, frames: 8, fps: 14, repeat: -1 },
  { char: Char.Zeno, anim: Anim.Idle, frames: 4, fps: 6, repeat: -1 },
  { char: Char.Zeno, anim: Anim.Wave, frames: 9, fps: 10, repeat: -1 },
  { char: Char.Zeno, anim: Anim.Jump, frames: 9, fps: 12, repeat: -1 },

  { char: Char.Teacher, anim: Anim.Idle, frames: 4, fps: 6, repeat: -1 },
  { char: Char.Teacher, anim: Anim.Walk, frames: 6, fps: 12, repeat: -1 },

  { char: Char.Parent1, anim: Anim.Run, frames: 8, fps: 14, repeat: -1 },
  { char: Char.Parent1, anim: Anim.Jump, frames: 8, fps: 14, repeat: 0 },
  { char: Char.Parent2, anim: Anim.Run, frames: 8, fps: 14, repeat: -1 },
  { char: Char.Parent2, anim: Anim.Jump, frames: 8, fps: 14, repeat: 0 },
  { char: Char.Parent3, anim: Anim.Run, frames: 8, fps: 14, repeat: -1 },
  { char: Char.Parent3, anim: Anim.Jump, frames: 8, fps: 14, repeat: 0 },
];
