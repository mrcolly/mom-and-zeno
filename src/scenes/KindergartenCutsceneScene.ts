import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, RACE } from "../constants";
import { DialogueOverlay } from "../ui/DialogueOverlay";
import {
  kindergartenTeacherDialogue,
  kindergartenTeacherForgotDialogue,
  kindergartenZenoDialogue,
  kindergartenZenoPuzzettaDialogue,
} from "../dialogue";
import { Sfx } from "../audio";
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
 *   1. Mom (left) and teacher (right) idle while the (long, boring)
 *      teacher dialogue plays. Mom interjects asking her to fetch Zeno;
 *      teacher dismisses her until mom finally shouts.
 *   2. Teacher walks east off-screen — but comes back alone with a
 *      sheepish "ah dimenticavo, non si è scaricato... come al solito",
 *      then mom sighs and the teacher walks east again for real.
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
    // and swallows the screen. 3 s is long enough to register the scene
    // and the characters' identities before any text starts.
    this.time.delayedCall(3000, () => this.startTeacherDialogue());
  }

  private startTeacherDialogue() {
    const dlg = new DialogueOverlay(this, kindergartenTeacherDialogue);
    dlg.once("complete", () => {
      // Post-talk beat: ~900 ms before the teacher heads off, so mom's
      // shouted last line ("VAI A PRENDERE MIO FIGLIO!!!") can land
      // instead of cutting straight to the teacher walking away.
      this.time.delayedCall(900, () => this.teacherFirstAttempt());
    });
  }

  /** First trip out: teacher walks east off-screen — but won't come back
   * with Zeno. She'll re-enter alone for the "I forgot" gag. */
  private teacherFirstAttempt() {
    this.walkTeacherEastOffscreen(() =>
      this.time.delayedCall(700, () => this.teacherReturnsForgot()),
    );
  }

  /** The setup for the gag: teacher walks back into shot alone, returns
   * to her starting position and goes idle so she can deliver the line. */
  private teacherReturnsForgot() {
    // Walking back leftward: mirror the east-facing walk frames to face west.
    this.teacher.setFlipX(true);
    this.teacher.play({ key: animKey(Char.Teacher, Anim.Walk), repeat: -1 });

    this.tweens.add({
      targets: this.teacher,
      x: TEACHER_START_X,
      duration: 2400,
      ease: "Sine.easeOut",
      onComplete: () => {
        this.teacher.setFlipX(false);
        this.teacher.play({ key: animKey(Char.Teacher, Anim.Idle), repeat: -1 });
        // Tiny beat so the player registers "wait, why is she back without
        // Zeno?" before the dialogue pops in.
        this.time.delayedCall(600, () => this.teacherForgotDialogue());
      },
    });
  }

  /** The punchline + mom's sigh. After the dialogue closes the teacher
   * heads off again, this time actually fetching Zeno. */
  private teacherForgotDialogue() {
    const dlg = new DialogueOverlay(this, kindergartenTeacherForgotDialogue);
    dlg.once("complete", () => {
      this.time.delayedCall(900, () => this.teacherSecondAttempt());
    });
  }

  /** Second trip out: same east walk as the first, but this time the
   * onComplete actually leads into the Zeno-leading return walk. */
  private teacherSecondAttempt() {
    this.walkTeacherEastOffscreen(() =>
      this.time.delayedCall(700, () => this.teacherReturnsWithZeno()),
    );
  }

  /** Shared "teacher exits stage right while walking" tween used for both
   * the forgot trip and the actual fetch. */
  private walkTeacherEastOffscreen(onArrived: () => void) {
    this.teacher.setFlipX(false);
    this.teacher.play({ key: animKey(Char.Teacher, Anim.Walk), repeat: -1 });
    this.tweens.add({
      targets: this.teacher,
      x: OFFSCREEN_RIGHT,
      duration: 2800,
      ease: "Sine.easeIn",
      onComplete: onArrived,
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
    this.time.delayedCall(2200, () => this.runReunionDialogue());
  }

  /** First overlay: the sweet "andiamo a casa da papà" exchange.
   * On complete, hold a silent beat (the kids-still-jumping post-hug shot)
   * before the punchline overlay opens — that pause IS the comedy. */
  private runReunionDialogue() {
    const dlg = new DialogueOverlay(this, kindergartenZenoDialogue);
    dlg.once("complete", () => {
      this.time.delayedCall(1500, () => this.runPuzzettaDialogue());
    });
  }

  /** Second overlay: Zeno's confession + mom's reaction. After it closes
   * we let the hug + jump animation breathe one more cycle before cutting
   * to the credits-style "Buona Festa della Mamma" scene.
   *
   * Comedic timing: silence → fart → dialogue ("Ho fatto una puzzetta").
   * The fart plays first IN the silence, ends, and only THEN does Zeno
   * "explain" what just happened. Showing the line on top of the fart
   * sound would soften the punchline.
   *
   * Audible portion of the source clip ends ~1.0 s in (the file is 1.7 s
   * total but trails off into near-silence after the burst). We hold a
   * full 1.6 s before the dialogue lands, so the player gets ~600 ms of
   * silence after the fart for the punchline beat to register before
   * Zeno's confession types in. */
  private runPuzzettaDialogue() {
    this.sound.play(Sfx.Fart, { volume: 0.9 });
    this.time.delayedCall(1600, () => {
      const dlg = new DialogueOverlay(this, kindergartenZenoPuzzettaDialogue);
      dlg.once("complete", () => {
        this.time.delayedCall(1800, () =>
          this.scene.start("HappyMothersDayScene"),
        );
      });
    });
  }
}
