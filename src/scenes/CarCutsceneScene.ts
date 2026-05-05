import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../constants";
import { DialogueOverlay } from "../ui/DialogueOverlay";
import { carCallDialogue } from "../dialogue";

const CAR_Y = GAME_HEIGHT - 220;
const CAR_START_X = -200;
const CAR_PAUSE_X = GAME_WIDTH / 2;
const CAR_END_X = GAME_WIDTH + 300;

export class CarCutsceneScene extends Phaser.Scene {
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

    const dialogue = new DialogueOverlay(this, carCallDialogue);
    dialogue.once("complete", () => {
      wobble.stop();
      car.y = CAR_Y;
      this.tweens.add({
        targets: car,
        x: CAR_END_X,
        duration: 1400,
        ease: "Sine.easeIn",
        onComplete: () => this.scene.start("RaceScene"),
      });
    });
  }
}
