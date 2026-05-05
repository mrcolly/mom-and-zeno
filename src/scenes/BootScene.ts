import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, COLORS, FONT_FAMILY } from "../constants";
import { SPRITE_ANIMS, animKey, frameKey } from "../sprites";

/**
 * Loads every asset in one place; later scenes assume the texture keys here
 * are available. Texture keys match the placeholder filenames so swapping art
 * is a drag-and-drop affair (see public/assets/**).
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    const loadingText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "Caricamento...", {
        fontFamily: FONT_FAMILY,
        fontSize: "32px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    const barBg = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, 480, 24, COLORS.bgPanel)
      .setStrokeStyle(2, 0xffffff);
    const bar = this.add
      .rectangle(
        GAME_WIDTH / 2 - 240,
        GAME_HEIGHT / 2 + 60,
        0,
        20,
        COLORS.accent,
      )
      .setOrigin(0, 0.5);

    this.load.on("progress", (p: number) => {
      bar.width = 476 * p;
    });
    this.load.on("complete", () => {
      loadingText.destroy();
      barBg.destroy();
      bar.destroy();
    });

    // Static character textures (still used as fallbacks in scenes that
    // haven't been ported to sprite animations).
    this.load.image("mom", "assets/characters/mom.png");
    this.load.image("parent1", "assets/characters/parent1.png");
    this.load.image("parent2", "assets/characters/parent2.png");
    this.load.image("parent3", "assets/characters/parent3.png");
    this.load.image("zeno", "assets/characters/zeno.png");
    this.load.image("teacher", "assets/characters/teacher.png");
    this.load.image("car", "assets/characters/car.png");

    // Animation frames. Each frame becomes its own texture under
    // `frameKey(char, anim, i)`; the matching animation is registered in
    // `create()` once loading is done.
    for (const a of SPRITE_ANIMS) {
      for (let i = 0; i < a.frames; i++) {
        const idx = i.toString().padStart(3, "0");
        this.load.image(
          frameKey(a.char, a.anim, i),
          `assets/sprites/${a.char}/${a.anim}/frame_${idx}.png`,
        );
      }
    }

    // Portraits.
    this.load.image("mom_portrait", "assets/portraits/mom_portrait.png");
    this.load.image("dad_portrait", "assets/portraits/dad_portrait.png");
    this.load.image(
      "teacher_portrait",
      "assets/portraits/teacher_portrait.png",
    );
    this.load.image("zeno_portrait", "assets/portraits/zeno_portrait.png");

    // Backgrounds.
    this.load.image("bg_street", "assets/backgrounds/street.png");
    this.load.image("bg_school", "assets/backgrounds/school_interior.png");
    this.load.image(
      "bg_finish_door",
      "assets/backgrounds/finish_door.png",
    );
    this.load.image("bg_classroom", "assets/backgrounds/classroom.png");
    this.load.image("bg_splash", "assets/backgrounds/splash.png");
  }

  create() {
    // Register every animation against the global anim manager. Doing this
    // here once means every later scene can just call
    // sprite.play(animKey(Char.Mom, Anim.Run)) without rebuilding frame lists.
    for (const a of SPRITE_ANIMS) {
      const key = animKey(a.char, a.anim);
      if (this.anims.exists(key)) continue;
      const frames: Phaser.Types.Animations.AnimationFrame[] = [];
      for (let i = 0; i < a.frames; i++) {
        frames.push({ key: frameKey(a.char, a.anim, i) });
      }
      this.anims.create({
        key,
        frames,
        frameRate: a.fps,
        repeat: a.repeat,
      });
    }

    this.scene.start("MenuScene");
  }
}
