import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, COLORS, FONT_FAMILY } from "../constants";
import { createButton } from "../ui/Button";

export class HappyMothersDayScene extends Phaser.Scene {
  constructor() {
    super("HappyMothersDayScene");
  }

  create() {
    this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "bg_splash")
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.2,
    );

    const title = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, "Buona Festa\ndella Mamma", {
        fontFamily: FONT_FAMILY,
        fontSize: "84px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 8,
        align: "center",
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80, "Con amore, Zeno", {
        fontFamily: FONT_FAMILY,
        fontSize: "36px",
        color: COLORS.textLight,
        stroke: "#000000",
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: title,
      scale: 1.06,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.spawnHearts();

    createButton(this, GAME_WIDTH / 2, GAME_HEIGHT - 110, "GIOCA ANCORA", {
      width: 360,
      height: 90,
      fontSize: 32,
      onClick: () => this.scene.start("MenuScene"),
    });
  }

  private spawnHearts() {
    // Periodic floating hearts; each heart removes itself when it leaves the
    // top of the screen.
    this.time.addEvent({
      delay: 350,
      loop: true,
      callback: () => this.spawnHeart(),
    });
  }

  private spawnHeart() {
    const x = Phaser.Math.Between(40, GAME_WIDTH - 40);
    const heart = this.add
      .text(x, GAME_HEIGHT + 40, "<3", {
        fontFamily: FONT_FAMILY,
        fontSize: `${Phaser.Math.Between(28, 56)}px`,
        color: "#ff5675",
        stroke: "#ffffff",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: heart,
      y: -60,
      x: x + Phaser.Math.Between(-80, 80),
      angle: Phaser.Math.Between(-25, 25),
      alpha: { from: 1, to: 0.2 },
      duration: Phaser.Math.Between(3500, 5500),
      ease: "Sine.easeOut",
      onComplete: () => heart.destroy(),
    });
  }
}
