import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, RACE } from "../constants";
import { DialogueOverlay } from "../ui/DialogueOverlay";
import {
  kindergartenTeacherDialogue,
  kindergartenZenoDialogue,
} from "../dialogue";
import {
  Anim,
  Char,
  CHAR_DISPLAY,
  animKey,
  frameKey,
  spriteCenterYForFeet,
} from "../sprites";

// Adults match the race scene so identity stays consistent across scenes.
const ADULT_SCALE = RACE.runnerScale;
// Adults' sprite-center y. The classroom backdrop's floor extends to the
// bottom edge, so we can push the feet line a bit further down than in the
// race scene without losing the toes off the screen.
const FLOOR_Y = RACE.laneTop + 40;

// Where the *feet* of every character should plant on screen — derived from
// the adults' sprite-center + per-character feet offset. Scenes use this
// single line as the visual floor; smaller characters back-solve their
// sprite-center y from it (see `spriteCenterYForFeet`).
const ADULT_FEET_Y = FLOOR_Y + CHAR_DISPLAY[Char.Mom].feetOffsetPx * ADULT_SCALE;

// Zeno is a toddler, so he renders at his own (smaller) display scale and
// his sprite center is back-solved from the shared feet line.
const ZENO_SCALE = ADULT_SCALE * CHAR_DISPLAY[Char.Zeno].scale;
const ZENO_FLOOR_Y = spriteCenterYForFeet(ADULT_FEET_Y, Char.Zeno, ZENO_SCALE);

const MOM_X = 280;
const TEACHER_START_X = GAME_WIDTH - 380; // 900
// Sprites are wide at this scale (~500 px). Push the off-screen target far
// enough right that the body fully clears the right edge.
const OFFSCREEN_RIGHT = GAME_WIDTH + 320; // 1600
// Distance Zeno trails behind the teacher when she's leading him in. He's
// smaller now, so this can be tighter than the adult-to-adult spacing.
const ZENO_TRAIL_OFFSET = 200;

/**
 * Kindergarten cutscene played after the player wins the race.
 *
 * Choreography (slow + readable, with explicit beats — see also the
 * `RACE.runnerScale` / `RACE.laneTop` import: every character renders at the
 * same scale and standing height as in the race scene):
 *
 *   1. Mom (left) and teacher (right) idle while the teacher dialogue plays.
 *   2. Teacher walks east off-screen to fetch Zeno.
 *   3. Teacher walks west back into shot, leading Zeno who waves at mom
 *      across the room the whole time.
 *   4. Wave exchange: Zeno settles in place still waving; mom waves back;
 *      mom returns to idle; brief beat.
 *   5. Zeno breaks loose and sprints over to mom.
 *   6. Hug + final dialogue + transition.
 */
export class KindergartenCutsceneScene extends Phaser.Scene {
  private mom!: Phaser.GameObjects.Sprite;
  private teacher!: Phaser.GameObjects.Sprite;
  private zeno!: Phaser.GameObjects.Sprite;

  constructor() {
    super("KindergartenCutsceneScene");
  }

  create() {
    this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "bg_classroom")
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    this.mom = this.add
      .sprite(MOM_X, FLOOR_Y, frameKey(Char.Mom, Anim.Idle, 0))
      .setScale(ADULT_SCALE)
      .play({ key: animKey(Char.Mom, Anim.Idle), repeat: -1 });

    this.teacher = this.add
      .sprite(TEACHER_START_X, FLOOR_Y, frameKey(Char.Teacher, Anim.Idle, 0))
      .setScale(ADULT_SCALE)
      .play({ key: animKey(Char.Teacher, Anim.Idle), repeat: -1 });

    this.zeno = this.add
      .sprite(
        OFFSCREEN_RIGHT + ZENO_TRAIL_OFFSET,
        ZENO_FLOOR_Y,
        frameKey(Char.Zeno, Anim.Idle, 0),
      )
      .setScale(ZENO_SCALE)
      .setVisible(false);

    // Let the player breathe in the classroom for a beat — see the idle
    // animations of mom + teacher — before the dialogue overlay pops in
    // and swallows the screen. 2.5 s is long enough to register the scene
    // and the characters' identities before any text starts.
    this.time.delayedCall(2500, () => this.startTeacherDialogue());
  }

  private startTeacherDialogue() {
    const dlg = new DialogueOverlay(this, kindergartenTeacherDialogue);
    dlg.once("complete", () => this.teacherFetchesZeno());
  }

  private teacherFetchesZeno() {
    // Walking east — frames already face east, no flip needed.
    this.teacher.setFlipX(false);
    this.teacher.play({ key: animKey(Char.Teacher, Anim.Walk), repeat: -1 });

    this.tweens.add({
      targets: this.teacher,
      x: OFFSCREEN_RIGHT,
      duration: 2800,
      ease: "Sine.easeIn",
      onComplete: () => {
        this.time.delayedCall(700, () => this.teacherReturnsWithZeno());
      },
    });
  }

  private teacherReturnsWithZeno() {
    this.teacher.x = OFFSCREEN_RIGHT;
    this.zeno.x = OFFSCREEN_RIGHT + ZENO_TRAIL_OFFSET;
    this.zeno.setVisible(true);
    // Excited kid: bursts onto the scene at a run, trailing the teacher.
    // (He'll switch to a wave once he stops next to her — see waveExchange.)
    this.zeno.play({ key: animKey(Char.Zeno, Anim.Run), repeat: -1 });

    // Walking back leftward: mirror the east-facing walk frames to face west.
    this.teacher.setFlipX(true);
    this.teacher.play({ key: animKey(Char.Teacher, Anim.Walk), repeat: -1 });

    this.tweens.add({
      targets: this.teacher,
      x: TEACHER_START_X,
      duration: 3000,
      ease: "Sine.easeOut",
      onComplete: () => {
        // Once she stops, return to the west-facing idle (frames already face
        // west, so unset the flip).
        this.teacher.setFlipX(false);
        this.teacher.play({ key: animKey(Char.Teacher, Anim.Idle), repeat: -1 });
      },
    });
    this.tweens.add({
      targets: this.zeno,
      x: TEACHER_START_X + ZENO_TRAIL_OFFSET,
      duration: 3000,
      ease: "Sine.easeOut",
      onComplete: () => this.waveExchange(),
    });
  }

  /**
   * The reunion beat the user wants to land clearly: Zeno has stopped and is
   * waving from across the room; mom waves back; both settle; then he sprints.
   * All transitions are time-based so the player can read each beat.
   */
  private waveExchange() {
    // Zeno arrived running; now that he's stopped, switch to the wave anim
    // so the "stop and wave at mom across the room" beat reads cleanly.
    this.zeno.play({ key: animKey(Char.Zeno, Anim.Wave), repeat: -1 });
    // Beat 1: hold ~500 ms with him visibly waving in place.
    this.time.delayedCall(500, () => {
      this.mom.play({ key: animKey(Char.Mom, Anim.Wave), repeat: -1 });
    });
    // Beat 2: mom waves for ~1500 ms.
    this.time.delayedCall(2000, () => {
      this.mom.play({ key: animKey(Char.Mom, Anim.Idle), repeat: -1 });
    });
    // Beat 3: short pause, then he runs.
    this.time.delayedCall(2500, () => this.zenoRunsToMom());
  }

  private zenoRunsToMom() {
    this.zeno.play({ key: animKey(Char.Zeno, Anim.Run), repeat: -1 });

    this.tweens.add({
      targets: this.zeno,
      // Stop a body-width to mom's right so they read as embracing rather
      // than overlapping at the centroid.
      x: this.mom.x + 200,
      duration: 2200,
      ease: "Sine.easeIn",
      onComplete: () => this.hugAndTalk(),
    });
  }

  private hugAndTalk() {
    // Mom bends down to hug; Zeno jumps with joy (looped). The hug + jump
    // animations carry the impact on their own — no scale pulse on top, so
    // the relative sizes of mom + zeno stay rock-steady through the beat.
    this.mom.play({ key: animKey(Char.Mom, Anim.Hug), repeat: 0 });
    this.zeno.play({ key: animKey(Char.Zeno, Anim.Jump), repeat: -1 });

    // Hold the silent hug for a beat before the final dialogue lands —
    // the moment of reunion is the emotional peak, so let it breathe
    // instead of cutting straight into text.
    this.time.delayedCall(1500, () => {
      const dlg = new DialogueOverlay(this, kindergartenZenoDialogue);
      dlg.once("complete", () => this.scene.start("HappyMothersDayScene"));
    });
  }
}
