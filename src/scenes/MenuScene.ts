import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, COLORS, FONT_FAMILY } from "../constants";
import { createButton } from "../ui/Button";

/**
 * Title screen.
 *
 * The Phaser game itself is gated to landscape by the host page (see
 * `index.html` rotate prompt + `main.ts` `syncGameWithOrientation`), so this
 * scene can assume the canvas is always 1280×720 in a landscape viewport
 * and lay out at full nominal sizes. No portrait-aware shrinking, no
 * rotate-prompt — those concerns live outside Phaser.
 */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "bg_splash")
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    // Soft dark vignette so the title pops.
    this.add
      .rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        GAME_WIDTH,
        GAME_HEIGHT,
        0x000000,
        0.35,
      )
      .setScrollFactor(0);

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const title = this.add
      .text(cx, cy - 140, "Mamma & Zeno", {
        fontFamily: FONT_FAMILY,
        fontSize: "96px",
        color: COLORS.textLight,
        stroke: "#000000",
        strokeThickness: 8,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy - 50, "Un'avventura per la Festa della Mamma", {
        fontFamily: FONT_FAMILY,
        fontSize: "26px",
        color: COLORS.textMuted,
        align: "center",
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: title,
      scale: 1.05,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    createButton(this, cx, cy + 80, "INIZIA", {
      width: 360,
      height: 110,
      fontSize: 44,
      onClick: () => this.scene.start("CarCutsceneScene"),
    });

    this.add
      .text(cx, GAME_HEIGHT - 60, "Festa della Mamma 2026", {
        fontFamily: FONT_FAMILY,
        fontSize: "20px",
        color: COLORS.textMuted,
        align: "center",
      })
      .setOrigin(0.5);
  }
}
