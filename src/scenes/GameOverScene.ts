import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, COLORS, FONT_FAMILY } from "../constants";
import { createButton } from "../ui/Button";

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOverScene");
  }

  create() {
    this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      COLORS.bgDark,
    );

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 140, "Troppo lenta!", {
        fontFamily: FONT_FAMILY,
        fontSize: "84px",
        color: "#ff6b81",
        stroke: "#000000",
        strokeThickness: 8,
      })
      .setOrigin(0.5);

    this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2 - 40,
        "Un altro genitore è entrato prima di te a prendere suo figlio.",
        {
          fontFamily: FONT_FAMILY,
          fontSize: "26px",
          color: COLORS.textMuted,
        },
      )
      .setOrigin(0.5);

    createButton(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80, "RIPROVA", {
      width: 320,
      height: 100,
      fontSize: 40,
      onClick: () => this.scene.start("RaceScene"),
    });

    createButton(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 210, "MENU", {
      width: 240,
      height: 70,
      fontSize: 26,
      fillColor: 0x4a4a6a,
      hoverColor: 0x6a6a8a,
      onClick: () => this.scene.start("MenuScene"),
    });
  }
}
