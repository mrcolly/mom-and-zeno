import Phaser from "phaser";
import {
  GAME_HEIGHT,
  GAME_WIDTH,
  COLORS,
  FONT_FAMILY,
  RACE,
} from "../constants";
import { createButton, type Button } from "../ui/Button";
import {
  Anim,
  Char,
  CHAR_DISPLAY,
  OBSTACLE_HEIGHTS,
  OBSTACLE_VARIANTS,
  ObstacleKind,
  RACER_STATS,
  animKey,
  frameKey,
  obstacleTextureKey,
  spriteCenterYForFeet,
} from "../sprites";
import { getSafeArea } from "../viewport";

/**
 * What the runner's sprite is currently *playing*. Tracked so the per-frame
 * updater can transition between Run / Idle / Still / Jump only when the
 * required state actually changes — Phaser will keep restarting an animation
 * if you call `play()` with the same key every frame.
 *
 * - "running": Anim.Run looping
 * - "idle":    Anim.Idle looping (only for characters that have it)
 * - "still":   anims stopped, sprite frozen on Anim.Run frame 0 (a neutral
 *              "ready" pose, used when the character has no idle animation)
 * - "jump":    Anim.Jump in flight (controlled by startJump's tween)
 */
type AnimMode = "running" | "idle" | "still" | "jump" | null;

type Runner = {
  sprite: Phaser.GameObjects.Sprite;
  /** Which character this runner draws from for textures + animations. */
  charKey: Char;
  baseY: number;
  lane: number;
  velocity: number;
  isMom: boolean;
  isJumping: boolean;
  /** Whatever the sprite is currently playing — see AnimMode. */
  animMode: AnimMode;
  // Index of the next upcoming obstacle in this runner's lane.
  nextObstacleIdx: number;
  // Whether the runner has already chosen jump-or-not for the upcoming obstacle.
  upcomingDecided: boolean;
  // Set on the frame the runner clips the current obstacle so the hit
  // applies once even though the runner spends several frames inside the
  // obstacle's hitbox. Cleared when they exit past `obs.x + obstacleWidth/2`.
  hitOnCurrent: boolean;
  // AI only.
  nextTapAt?: number;
  tapInterval?: number;
  jumpSkill?: number;
};

type Keys = {
  jump: Phaser.Input.Keyboard.Key[];
  run: Phaser.Input.Keyboard.Key[];
};

type Obstacle = {
  image: Phaser.GameObjects.Image;
  x: number;
  lane: number;
};

export class RaceScene extends Phaser.Scene {
  private runners: Runner[] = [];
  private mom!: Runner;
  /** Per-lane sorted obstacle list. Index = lane. */
  private obstaclesByLane: Obstacle[][] = [];
  private started = false;
  private finished = false;
  private startedAt = 0;
  private keys?: Keys;

  constructor() {
    super("RaceScene");
  }

  create() {
    this.runners = [];
    this.obstaclesByLane = [];
    this.started = false;
    this.finished = false;
    this.startedAt = this.time.now;
    this.keys = undefined;

    this.cameras.main.setBounds(0, 0, RACE.trackLength, GAME_HEIGHT);

    // Tile the school corridor background across the track, replacing the
    // very last tile with the finish-door background. The door image is
    // pre-rendered with the corridor walls + floor so it lines up with the
    // adjacent corridor tiles seamlessly. The race ends when mom reaches
    // RACE.finishX, which is positioned so she stops in front of the door.
    const bgTile = this.textures.get("bg_school").getSourceImage();
    const bgW = (bgTile as HTMLImageElement | HTMLCanvasElement).width;
    const lastTileStart = Math.floor((RACE.trackLength - 1) / bgW) * bgW;
    for (let x = 0; x < RACE.trackLength; x += bgW) {
      const key = x === lastTileStart ? "bg_finish_door" : "bg_school";
      this.add.image(x, 0, key).setOrigin(0, 0);
    }

    this.spawnRunners();
    this.spawnObstacles();
    this.buildHud();
    this.bindKeyboard();

    this.cameras.main.startFollow(this.mom.sprite, true, 0.15, 0.15);
    this.cameras.main.setFollowOffset(-200, 0);

    // Race is paused until the player dismisses the rules overlay.
    this.showIntroOverlay();
  }

  /**
   * Pre-race "How to play" overlay. Blocks gameplay (update() bails out while
   * `started` is false) and explains the controls + objective. Tapping GO
   * destroys the overlay, starts the race timer, and unblocks input.
   *
   * The GO button lives at scene-root level (not inside the overlay container)
   * because the Button helper deliberately stays out of containers - that's
   * what keeps its hit area aligned with its visual.
   */
  private showIntroOverlay() {
    const overlayDepth = 4000;
    const container = this.add
      .container(0, 0)
      .setDepth(overlayDepth)
      .setScrollFactor(0);

    const backdrop = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.78,
    );

    const panel = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 880, 540, COLORS.bgPanel, 0.98)
      .setStrokeStyle(6, 0xffffff);

    const title = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 200, "Come si gioca", {
        fontFamily: FONT_FAMILY,
        fontSize: "44px",
        color: COLORS.textLight,
      })
      .setOrigin(0.5);

    const rulesText = [
      "Corri contro gli altri genitori per arrivare da Zeno!",
      "",
      "CORRI: pigia il tasto CORRI   (o freccia destra / D / J)",
      "SALTA: tocca il tasto SALTA   (o spazio / freccia su / W)",
      "",
      "Se sbatti contro un ostacolo perdi velocità.",
      "Vince chi arriva primo al traguardo!",
    ].join("\n");

    const rules = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, rulesText, {
        fontFamily: FONT_FAMILY,
        fontSize: "20px",
        color: COLORS.textLight,
        align: "center",
        lineSpacing: 10,
      })
      .setOrigin(0.5);

    container.add([backdrop, panel, title, rules]);

    const goBtn = createButton(
      this,
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 + 180,
      "VIA!",
      {
        width: 280,
        height: 90,
        fontSize: 40,
        onClick: () => this.beginRace(container, goBtn),
      },
    ).setDepth(overlayDepth + 1);
  }

  private beginRace(overlay: Phaser.GameObjects.Container, goBtn: Button) {
    overlay.destroy();
    goBtn.destroy();
    this.started = true;
    this.startedAt = this.time.now;
    // Re-baseline AI tap timers so they don't fire a flurry of impulses on
    // frame 1 from the time spent on the overlay.
    for (const runner of this.runners) {
      if (!runner.isMom && runner.tapInterval !== undefined) {
        runner.nextTapAt = this.time.now + runner.tapInterval;
      }
      // Force the per-frame anim updater to pick run vs idle on the next
      // tick based on actual velocity — mom (velocity 0) starts in idle,
      // AI runners briefly idle until their first scheduled tap fires.
      runner.animMode = null;
    }
  }

  private bindKeyboard() {
    const kb = this.input.keyboard;
    if (!kb) return;
    // Multiple keys per action so PC players can pick whatever feels natural.
    // RUN keys are intended to be tap-mashed; JUMP keys are single-press.
    this.keys = {
      jump: [
        kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
        kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
        kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      ],
      run: [
        kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
        kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        kb.addKey(Phaser.Input.Keyboard.KeyCodes.J),
      ],
    };
    // Stop browser from scrolling when arrow/space are pressed.
    kb.addCapture("SPACE,UP,DOWN,LEFT,RIGHT,W,A,S,D,J");
  }

  // ---------------- Setup helpers -----------------------------------------

  private spawnRunners() {
    // All runners share the same lane on the corridor floor. We stagger the
    // start x so they form a small queue at the start (otherwise they'd all
    // sit on top of each other), and apply a tiny y jitter so overlapping
    // sprites don't render perfectly on top of each other.
    const baseStartX = 100;
    const startGapX = 70;

    const charKeys: Char[] = [Char.Mom, Char.Parent1, Char.Parent2, Char.Parent3];
    // Pick the adult feet-line off mom (the player) — every runner's sprite
    // center is back-solved from this so feet plant on the same y regardless
    // of per-character scale.
    const adultFeetY =
      RACE.laneTop + CHAR_DISPLAY[Char.Mom].feetOffsetPx * RACE.runnerScale;
    for (let i = 0; i < charKeys.length; i++) {
      const charKey = charKeys[i];
      const isMom = charKey === Char.Mom;
      const x = baseStartX + i * startGapX;
      // Symmetric jitter around the lane center, scaled so the topmost runner
      // (mom, i=0) sits closest to the viewer (slightly lower y in the screen,
      // i.e. higher on screen). It's only a few pixels.
      const yJitter = ((i % 2 === 0 ? 1 : -1) * RACE.runnerYJitter * Math.ceil(i / 2));
      // Per-character scale — adults are 1.0 here, but we still go through
      // CHAR_DISPLAY so the math stays correct if a smaller racer (e.g.
      // Zeno) is ever added to the lineup.
      const charScale = RACE.runnerScale * CHAR_DISPLAY[charKey].scale;
      const y = spriteCenterYForFeet(adultFeetY, charKey, charScale) + yJitter;

      // Static frame 0 of the run animation acts as the "ready stance" until
      // beginRace() kicks off the running animation.
      const sprite = this.add
        .sprite(x, y, frameKey(charKey, Anim.Run, 0))
        .setScale(charScale);

      const runner: Runner = {
        sprite,
        charKey,
        baseY: y,
        lane: 0,
        velocity: 0,
        isMom,
        isJumping: false,
        animMode: null,
        nextObstacleIdx: 0,
        upcomingDecided: false,
        hitOnCurrent: false,
      };

      if (!isMom) {
        // Per-character personality lookup. RACER_STATS is the single place
        // to tune individual AI difficulty — see sprites.ts.
        const stats = RACER_STATS[charKey];
        if (!stats) {
          throw new Error(`No RACER_STATS entry for character "${charKey}"`);
        }
        runner.tapInterval = stats.tapIntervalMs;
        runner.nextTapAt = this.time.now + stats.tapIntervalMs;
        runner.jumpSkill = stats.jumpSkill;
      }

      this.runners.push(runner);
      if (isMom) this.mom = runner;
    }
  }

  /**
   * Place `obstaclesPerLane` obstacles in EACH lane. We bin the available
   * track length into N equal slots and pick a random x within each slot,
   * which guarantees:
   *   - exactly `obstaclesPerLane` obstacles per lane (equal counts),
   *   - a minimum spacing between consecutive obstacles in the same lane
   *     (= 2 * obstacleWidth padding inside each bin -> min gap >= 2 *
   *     obstacleWidth between obstacles in adjacent bins),
   *   - randomness within each bin so layouts differ between runs.
   * Each lane is independent so two lanes can have an obstacle at similar x.
   */
  private spawnObstacles() {
    const span =
      RACE.finishX - RACE.obstacleStartBuffer - RACE.obstacleEndBuffer;
    const binSize = span / RACE.obstaclesPerLane;
    const padding = RACE.obstacleWidth * 2;

    // Pre-flatten the available (kind, variant) pairs so each spawn is just
    // one Phaser.Math.Between roll. Each kind has its own on-screen height
    // (shoe < newborn < teddy < car < bike) so a shoe doesn't read as the
    // same size as a bicycle. Width follows the texture's aspect ratio.
    const variants: Array<{ kind: ObstacleKind; idx: number }> = [];
    for (const [kind, count] of Object.entries(OBSTACLE_VARIANTS)) {
      for (let i = 0; i < count; i++) {
        variants.push({ kind: kind as ObstacleKind, idx: i });
      }
    }

    for (let lane = 0; lane < RACE.laneCount; lane++) {
      const laneObstacles: Obstacle[] = [];
      for (let i = 0; i < RACE.obstaclesPerLane; i++) {
        const binStart = RACE.obstacleStartBuffer + i * binSize;
        const lo = Math.floor(binStart + padding);
        const hi = Math.floor(binStart + binSize - padding);
        const x = Phaser.Math.Between(lo, hi);
        const v = variants[Phaser.Math.Between(0, variants.length - 1)];
        const tex = obstacleTextureKey(v.kind, v.idx);
        const src = this.textures.get(tex).getSourceImage() as
          | HTMLImageElement
          | HTMLCanvasElement;
        const aspect = src.width / src.height;
        const displayH = OBSTACLE_HEIGHTS[v.kind];
        const image = this.add
          .image(x, RACE.floorY, tex)
          .setOrigin(0.5, 1)
          .setDisplaySize(displayH * aspect, displayH);
        laneObstacles.push({ image, x, lane });
      }
      this.obstaclesByLane.push(laneObstacles);
    }
  }

  private buildHud() {
    // The HUD is camera-fixed: scrollFactor 0 means it stays in the viewport.
    // Pin the buttons to the visible safe-area edges so they aren't clipped
    // off ultra-wide phone screens that crop the 16:9 canvas.
    const safe = getSafeArea(this);
    const padding = 24;
    const buttonW = 200;
    const buttonH = 100;
    const buttonY = safe.bottom - buttonH / 2 - padding;

    createButton(
      this,
      safe.right - buttonW / 2 - padding,
      buttonY,
      "CORRI",
      {
        width: buttonW,
        height: buttonH,
        fontSize: 32,
        onClick: () => this.handleRunTap(),
      },
    ).setDepth(1000);

    createButton(this, safe.left + buttonW / 2 + padding, buttonY, "SALTA", {
      width: buttonW,
      height: buttonH,
      fontSize: 28,
      // Soft mint, complementary to the default rose RUN button.
      fillColor: 0x34d399,
      hoverColor: 0x6ee7b7,
      onClick: () => this.handleJump(),
    }).setDepth(1000);

    // (No persistent caption strip on top: the pre-race "How to play" overlay
    // already covers the controls — duplicating them across the top of the
    // screen wastes vertical space and clashes with the scene art.)
  }

  // ---------------- Player input ------------------------------------------

  private handleRunTap() {
    if (!this.started || this.finished) return;
    this.mom.velocity = Math.min(
      this.mom.velocity + RACE.tapImpulse,
      RACE.maxSpeed,
    );
  }

  private handleJump() {
    if (!this.started || this.finished) return;
    if (this.mom.isJumping) return;
    this.startJump(this.mom);
  }

  private pollKeyboard() {
    if (!this.keys) return;
    for (const k of this.keys.run) {
      if (Phaser.Input.Keyboard.JustDown(k)) {
        this.handleRunTap();
        break;
      }
    }
    for (const k of this.keys.jump) {
      if (Phaser.Input.Keyboard.JustDown(k)) {
        this.handleJump();
        break;
      }
    }
  }

  /**
   * Pick the appropriate looping animation for a runner based on whether
   * they're currently moving:
   *
   * - velocity above `RACE.idleVelocityThreshold` → loop the Run animation
   * - below the threshold → loop the Idle animation if the character has
   *   one (mom does), otherwise freeze on Run frame 0 — a neutral
   *   right-facing pose that reads as "standing still" for parents that
   *   lack an idle anim.
   *
   * The threshold is intentionally a small positive number (rather than
   * zero) so the run anim's leg cycle stops "treadmilling" while the
   * character is barely drifting on residual friction.
   *
   * Skips entirely while a jump is in flight: `startJump` plays the Jump
   * animation directly and resets `animMode` to `null` once the jump tween
   * completes, which lets this method take over again on the next tick.
   *
   * The `animMode` field is the change-detection key — Phaser restarts the
   * current animation if you call `play()` with the same key, so we only
   * issue `play()` when the desired mode actually changes.
   */
  private updateRunnerAnim(runner: Runner) {
    if (runner.isJumping) return;

    const isMoving = runner.velocity > RACE.idleVelocityThreshold;
    if (isMoving) {
      if (runner.animMode !== "running") {
        runner.sprite.play({
          key: animKey(runner.charKey, Anim.Run),
          repeat: -1,
        });
        runner.animMode = "running";
      }
      return;
    }

    const idleKey = animKey(runner.charKey, Anim.Idle);
    if (this.anims.exists(idleKey)) {
      if (runner.animMode !== "idle") {
        runner.sprite.play({ key: idleKey, repeat: -1 });
        runner.animMode = "idle";
      }
    } else if (runner.animMode !== "still") {
      runner.sprite.anims.stop();
      runner.sprite.setTexture(frameKey(runner.charKey, Anim.Run, 0));
      runner.animMode = "still";
    }
  }

  private startJump(runner: Runner) {
    runner.isJumping = true;
    runner.sprite.play({ key: animKey(runner.charKey, Anim.Jump), repeat: 0 });
    runner.animMode = "jump";
    this.tweens.add({
      targets: runner.sprite,
      y: runner.baseY - RACE.jumpHeight,
      duration: RACE.jumpDurationMs / 2,
      ease: "Sine.easeOut",
      yoyo: true,
      onComplete: () => {
        runner.sprite.y = runner.baseY;
        runner.isJumping = false;
        // Hand control back to the per-frame anim updater — it picks run
        // or idle next tick based on the runner's actual velocity at the
        // moment the jump finished.
        runner.animMode = null;
      },
    });
  }

  // ---------------- Per-frame loop ----------------------------------------

  update(_time: number, deltaMs: number) {
    if (!this.started || this.finished) return;
    this.pollKeyboard();
    const dt = deltaMs / 1000;
    const now = this.time.now;
    const decay = Math.pow(RACE.friction, deltaMs / (1000 / 60));

    for (const runner of this.runners) {
      // AI: advance their velocity at their tap rhythm.
      if (!runner.isMom && runner.nextTapAt !== undefined && now >= runner.nextTapAt) {
        runner.velocity = Math.min(
          runner.velocity + RACE.tapImpulse,
          RACE.maxSpeed,
        );
        runner.nextTapAt = now + (runner.tapInterval ?? 200);
      }

      // Friction (frame-rate-independent per-second decay).
      runner.velocity *= decay;
      if (runner.velocity < 1) runner.velocity = 0;

      runner.sprite.x += runner.velocity * dt;

      // The running animation already has its own up/down stride motion, so
      // we no longer add a manual sin-wave bob on top.

      this.updateRunnerAnim(runner);
      this.handleObstaclesFor(runner);

      if (runner.sprite.x >= RACE.finishX) {
        this.endRace(runner.isMom);
        return;
      }
    }
  }

  private handleObstaclesFor(runner: Runner) {
    const lane = this.obstaclesByLane[runner.lane];
    if (!lane) return;

    const obs = lane[runner.nextObstacleIdx];
    if (!obs) return;

    // AI: decide whether to jump as soon as the obstacle enters their planning
    // window. The roll is committed (one decision per obstacle).
    //
    // The window scales with current velocity so each runner triggers their
    // jump exactly far enough out that they peak over the obstacle. With a
    // fixed window slow runners would jump way too early and land before
    // reaching the obstacle (= always trip).
    //
    //   time-to-peak = jumpDurationMs / 2 / 1000  seconds
    //   ideal jump-from-distance = velocity * time-to-peak
    //   + a small forward-look buffer so the AI commits a hair early
    const peakSeconds = RACE.jumpDurationMs / 2 / 1000;
    const decisionWindow = runner.velocity * peakSeconds + 10;
    if (
      !runner.isMom &&
      !runner.upcomingDecided &&
      !runner.isJumping &&
      obs.x - runner.sprite.x > 0 &&
      obs.x - runner.sprite.x <= decisionWindow
    ) {
      runner.upcomingDecided = true;
      if (Math.random() < (runner.jumpSkill ?? 0.5)) {
        this.startJump(runner);
      }
    }

    // Resolve the obstacle as the runner sweeps across its hitbox width.
    // We poll every frame the runner is inside [enterX, exitX]; if their
    // sprite is ever below the clearance threshold, they nick the obstacle.
    // `hitOnCurrent` flags the obstacle as resolved so a single graze counts
    // exactly once even when the runner spends multiple frames inside it.
    const halfW = RACE.obstacleWidth / 2;
    const enterX = obs.x - halfW;
    const exitX = obs.x + halfW;
    if (runner.sprite.x >= enterX && runner.sprite.x <= exitX) {
      const aboveObstacle =
        runner.sprite.y < runner.baseY - RACE.obstacleHeight + 4;
      if (!aboveObstacle && !runner.hitOnCurrent) {
        this.applyHit(runner, obs);
        runner.hitOnCurrent = true;
      }
    } else if (runner.sprite.x > exitX) {
      runner.nextObstacleIdx += 1;
      runner.upcomingDecided = false;
      runner.hitOnCurrent = false;
    }
  }

  private applyHit(runner: Runner, obs: Obstacle) {
    // Velocity penalty only; input is never blocked. Mom can always mash RUN
    // to recover; AI keeps tapping at their normal cadence.
    runner.velocity *= RACE.hitSlowdown;

    if (runner.isMom) {
      this.cameras.main.shake(150, 0.005);
    }
    const flashSteps = 3;
    this.tweens.add({
      targets: runner.sprite,
      alpha: 0.3,
      duration: RACE.hitFlashMs / (flashSteps * 2),
      yoyo: true,
      repeat: flashSteps - 1,
      onComplete: () => runner.sprite.setAlpha(1),
    });
    // Darken the obstacle only when *mom* trips on it: it acts as a
    // breadcrumb of where the player has already lost time. AI trips don't
    // need that feedback (and would otherwise leave a confusing trail of
    // dark sprites the player never bumped into).
    if (runner.isMom) {
      obs.image.setTint(0x666666);
    }
  }

  private endRace(momWon: boolean) {
    if (this.finished) return;
    this.finished = true;

    const elapsed = ((this.time.now - this.startedAt) / 1000).toFixed(1);

    if (momWon) {
      const banner = this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, `Ce l'hai fatta!\n${elapsed}s`, {
          fontFamily: FONT_FAMILY,
          fontSize: "56px",
          color: COLORS.textLight,
          align: "center",
          stroke: "#000000",
          strokeThickness: 6,
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(2000);
      this.tweens.add({
        targets: banner,
        scale: 1.1,
        duration: 400,
        yoyo: true,
        repeat: 1,
      });
      this.time.delayedCall(1500, () =>
        this.scene.start("KindergartenCutsceneScene"),
      );
    } else {
      this.time.delayedCall(600, () => this.scene.start("GameOverScene"));
    }
  }
}
