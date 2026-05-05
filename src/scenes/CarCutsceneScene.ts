import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../constants";
import { DialogueOverlay } from "../ui/DialogueOverlay";
import { carCallDialogue } from "../dialogue";
import { Sfx, fadeOutAndStop, fadeVolume } from "../audio";

const CAR_Y = GAME_HEIGHT - 220;
const CAR_START_X = -200;
const CAR_PAUSE_X = GAME_WIDTH / 2;
const CAR_END_X = GAME_WIDTH + 300;

// Volume targets: the engine sits *under* the dialogue (so it never fights
// for attention), the phone ring is loud enough to read as the cause of the
// stop. Adjust here, not at every play-site.
const ENGINE_VOL_DRIVING = 0.5;
const ENGINE_VOL_PARKED = 0.18;
const PHONE_VOL = 0.85;

export class CarCutsceneScene extends Phaser.Scene {
  private engine?: Phaser.Sound.BaseSound;
  private phone?: Phaser.Sound.BaseSound;

  constructor() {
    super("CarCutsceneScene");
  }

  create() {
    this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "bg_street")
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    // Simple road slab so the car visually sits on something.
    this.add.rectangle(
      GAME_WIDTH / 2,
      CAR_Y + 50,
      GAME_WIDTH,
      120,
      0x1a1a1a,
    );
    for (let x = 0; x < GAME_WIDTH; x += 80) {
      this.add.rectangle(x + 20, CAR_Y + 50, 40, 6, 0xffeb3b);
    }

    const car = this.add.image(CAR_START_X, CAR_Y, "car");
    car.setScale(1);

    // Engine bed comes up as the car drives in. Phone ringing waits until
    // the car has parked (`startDialogue`) so the cause-and-effect reads:
    // car arrives → phone rings → mom answers. Both sounds are looped and
    // torn down on scene shutdown by Phaser's sound manager.
    this.engine = this.sound.add(Sfx.CarEngine, { loop: true, volume: 0 });
    this.engine.play();
    fadeVolume(this, this.engine, ENGINE_VOL_DRIVING, 500);

    // Drive in, pause for dialogue, drive out.
    this.tweens.add({
      targets: car,
      x: CAR_PAUSE_X,
      duration: 1700,
      ease: "Sine.easeOut",
      onComplete: () => this.startDialogue(car),
    });
  }

  private startDialogue(car: Phaser.GameObjects.Image) {
    // Tiny idle wobble while parked, so the car doesn't look frozen.
    const wobble = this.tweens.add({
      targets: car,
      y: CAR_Y - 4,
      duration: 220,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Phone starts ringing now (car is parked). The hold below is sized
    // so the player hears at least one audible ring pattern before mom
    // "answers" — the source clip's first ring lands ~150 ms in, and a
    // 1.4 s wait covers it comfortably.
    this.phone = this.sound.add(Sfx.Phone, { loop: true, volume: 0 });
    this.phone.play();
    fadeVolume(this, this.phone, PHONE_VOL, 200);

    this.time.delayedCall(1400, () => {
      // Mom answers: phone ring fades out, engine drops to a quieter idle
      // so the dialogue can sit clearly above it.
      if (this.phone) fadeOutAndStop(this, this.phone, 350);
      if (this.engine) fadeVolume(this, this.engine, ENGINE_VOL_PARKED, 500);

      const dialogue = new DialogueOverlay(this, carCallDialogue);
      dialogue.once("complete", () => this.endDialogue(car, wobble));
    });
  }

  private endDialogue(
    car: Phaser.GameObjects.Image,
    wobble: Phaser.Tweens.Tween,
  ) {
    // Post-talk beat: a beat after the last tap so the conversation can
    // sit for a moment instead of cutting straight into the drive-off.
    this.time.delayedCall(900, () => {
      wobble.stop();
      car.y = CAR_Y;
      // Engine ramps back up as she puts it in gear. Sells the "she's
      // pulling away" beat without needing extra art.
      if (this.engine) fadeVolume(this, this.engine, ENGINE_VOL_DRIVING, 400);
      this.tweens.add({
        targets: car,
        x: CAR_END_X,
        duration: 1400,
        ease: "Sine.easeIn",
        onComplete: () => {
          // Fade engine out *before* scene transition so the next scene
          // (RaceScene) doesn't get a hard cut from the car's audio bed.
          if (this.engine) fadeOutAndStop(this, this.engine, 400);
          this.time.delayedCall(420, () => this.scene.start("RaceScene"));
        },
      });
    });
  }
}
