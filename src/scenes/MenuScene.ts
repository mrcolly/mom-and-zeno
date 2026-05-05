import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, COLORS, FONT_FAMILY } from "../constants";
import { createButton } from "../ui/Button";

/** Same touch check we use in main.ts: any finger-input capable device. */
function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

/**
 * Best-effort enter-fullscreen for mobile. No-ops (silently) on:
 *   - desktops (we don't want fullscreen there),
 *   - already-fullscreen documents,
 *   - browsers that disable fullscreen for non-video elements (iPhone
 *     Safari) — `document.fullscreenEnabled` is false there.
 *
 * Where the request *is* attempted we attach `.catch()` so a denied
 * permission (e.g. Chrome's devtools mobile emulator) doesn't print an
 * unhandled-rejection warning in the console.
 */
function requestMobileFullscreen(scene: Phaser.Scene): void {
  if (!isTouchDevice()) return;
  if (typeof document === "undefined" || !document.fullscreenEnabled) return;
  if (document.fullscreenElement) return;
  const parent = scene.scale.parent as HTMLElement | null;
  const target = parent ?? scene.game.canvas;
  // requestFullscreen returns a Promise in modern browsers; legacy ones may
  // return undefined. Optional chaining handles both shapes.
  void target?.requestFullscreen?.()?.catch(() => {});
}

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
      onClick: () => {
        // Mobile-only fullscreen: a user gesture is required, and this
        // button click is one. We bypass `this.scale.startFullscreen()`
        // because Phaser swallows the underlying `requestFullscreen()`
        // promise — its rejection (e.g. iPhone Safari, which only allows
        // fullscreen on <video>; or Chrome's devtools mobile emulator)
        // would otherwise surface as "Uncaught (in promise) TypeError:
        // Permissions check failed". We feature-detect first and attach
        // .catch() so the game starts cleanly either way.
        requestMobileFullscreen(this);
        this.scene.start("CarCutsceneScene");
      },
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
