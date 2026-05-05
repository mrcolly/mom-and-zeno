export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const COLORS = {
  bgDark: 0x1a1a2e,
  bgPanel: 0x2a2347,
  accent: 0xec4899,
  accentDark: 0xb13177,
  textLight: "#ffffff",
  textMuted: "#cfd0e0",
  // Soft rose palette for the rounded buttons. These are warm and friendly
  // (Mother's Day vibe) and read well over the saturated background art.
  buttonFill: 0xfb7185,
  buttonHover: 0xfda4af,
  buttonShadow: 0x6e1c2c,
  buttonStroke: 0x000000,
  finishLine: 0xffeb3b,
  ground: 0x8d6e4a,
  groundShadow: 0x6e553a,
} as const;

// Friendly rounded sans for all UI text. Loaded via index.html's Google Fonts
// <link>; main.ts waits on document.fonts.ready before booting Phaser so the
// canvas-baked text never falls back silently to the system default.
export const FONT_FAMILY = '"Fredoka", "Quicksand", "Helvetica Neue", sans-serif';

// ---- Race scene tuning ------------------------------------------------------
export const RACE = {
  // World is 6 viewports wide; finish line near the end.
  trackLength: GAME_WIDTH * 6,
  finishX: GAME_WIDTH * 6 - 200,

  // Single shared track on the corridor floor. All runners live on the same
  // baseline (with a tiny per-runner y offset for visual separation when they
  // overlap). `floorY` is the y where everyone's feet (and the obstacles)
  // plant; `laneTop` is the sprite-center y that produces those feet given
  // the chosen runnerScale.
  // NOTE: laneTop has to move up when runnerScale grows, otherwise the
  // (centered-origin) sprite's feet sink below the floor.
  laneCount: 1,
  laneTop: 530,
  laneSpacing: 0,
  floorY: 700,
  // Display scale for runner sprites (208 px source frames → 499 px on screen).
  runnerScale: 2.4,
  // Tiny vertical jitter so overlapping runners are still distinguishable.
  runnerYJitter: 6,

  // Tap-to-run physics.
  tapImpulse: 95, // px/sec velocity gained per RUN tap
  maxSpeed: 900, // px/sec cap (high enough that mashing actually feels powerful)
  friction: 0.965, // per-frame velocity decay at 60fps; closer to 1 = momentum lingers longer
  hitSlowdown: 0.55, // velocity multiplier on obstacle hit
  // Below this velocity (px/sec) the runner is treated as "stopped" and
  // switches to idle. Set to a small value rather than 0 so the run anim
  // stops "treadmilling" while the character is barely drifting on residual
  // friction — the run anim's leg cycle has a fixed visual speed and looks
  // wrong against very slow horizontal motion.
  idleVelocityThreshold: 30,
  // Visual-only stun. Input is NEVER blocked; the player can always tap to recover.
  hitFlashMs: 250,

  // Jump tuning. The arc has to clear the *visible* top of the tallest
  // obstacle (bicycle ≈ 120 px tall after rendering), so the apex sits a bit
  // above that. Half-duration (300 ms) is the time-to-peak the AI plans
  // around in `handleObstaclesFor`.
  jumpHeight: 130,
  jumpDurationMs: 600,

  // Obstacle layout (per lane, identical count across lanes).
  obstaclesPerLane: 12,
  // Buffer at the start so racers don't immediately hit one, and at the end
  // so the finish line is clean.
  obstacleStartBuffer: 800,
  obstacleEndBuffer: 400,
  // Hitbox is uniform across all obstacle kinds (visuals can extend above
  // and beside it, see OBSTACLE_HEIGHTS). The width is what makes timing
  // matter: a runner has to stay above `obstacleHeight` for the full
  // horizontal span centered on the spawn x — a half-jump clearing only the
  // centerline now nicks the trailing edge.
  obstacleWidth: 60,
  obstacleHeight: 30,

  // Per-character speed and jump-skill stats live in `RACER_STATS` (sprites.ts).
  // The AI jump decision window is now velocity-aware (computed in RaceScene)
  // so slow runners jump close, fast runners jump early — both peaking on
  // the obstacle.
} as const;
