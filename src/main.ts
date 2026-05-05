import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, COLORS } from "./constants";
import { BootScene } from "./scenes/BootScene";
import { MenuScene } from "./scenes/MenuScene";
import { CarCutsceneScene } from "./scenes/CarCutsceneScene";
import { RaceScene } from "./scenes/RaceScene";
import { GameOverScene } from "./scenes/GameOverScene";
import { KindergartenCutsceneScene } from "./scenes/KindergartenCutsceneScene";
import { HappyMothersDayScene } from "./scenes/HappyMothersDayScene";

/**
 * Make sure the UI font (loaded via the Google Fonts <link> in index.html)
 * is actually available *before* Phaser ever paints text. Phaser's TextStyle
 * uses canvas font metrics, and a Text rendered while the font is still
 * loading gets baked with the fallback font — it doesn't re-render itself
 * once the real font arrives.
 *
 * `document.fonts.load(...)` returns a Promise that resolves once the
 * specified font face is ready (or fails). We ask for one weight we use most
 * (semi-bold) and trust the cache for the rest. There's a `Promise.race` on
 * a generous timeout so a flaky CDN never bricks the game launch.
 */
async function ensureUiFontReady(): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  try {
    await Promise.race([
      document.fonts.load("600 32px Fredoka"),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
  } catch {
    // Non-fatal: fall back to the next family in the FONT_FAMILY chain.
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: COLORS.bgDark,
  scale: {
    // FIT preserves the 16:9 ratio inside the parent and never crops game
    // content. The body splash background fills any letterbox / pillarbox
    // bars on viewports that don't match 16:9 exactly. We only ever boot
    // the game in landscape (see `syncGameWithOrientation` below), so on
    // a phone the canvas is generally close to filling the screen.
    mode: Phaser.Scale.FIT,
    // Centering is handled by the `#game` flex container in `index.html`.
    // CENTER_BOTH writes pixel margins onto the canvas which, combined
    // with flex centering, double-centers and visibly offsets the canvas.
    autoCenter: Phaser.Scale.NO_CENTER,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  input: {
    // Plenty of headroom for two-finger thumb mashing on RUN/JUMP
    // simultaneously even if the OS occasionally fails to release a touch
    // slot.
    activePointers: 6,
  },
  render: {
    pixelArt: true,
    antialias: false,
  },
  scene: [
    BootScene,
    MenuScene,
    CarCutsceneScene,
    RaceScene,
    GameOverScene,
    KindergartenCutsceneScene,
    HappyMothersDayScene,
  ],
};

/**
 * Single source of truth for "is the device currently in a state where the
 * game should be running?" — true on desktops/non-touch devices, and on
 * touch devices held in landscape; false on touch devices in portrait
 * (rotate-prompt territory). Uses `matchMedia` because it reflects the OS
 * orientation synchronously, while `window.innerWidth/Height` lag behind
 * for several hundred milliseconds on iOS during a rotation.
 */
const portraitQuery =
  typeof window !== "undefined"
    ? window.matchMedia("(orientation: portrait)")
    : null;

function shouldRunGame(): boolean {
  const isPortrait = portraitQuery?.matches ?? false;
  const isTouch =
    typeof window !== "undefined" &&
    ("ontouchstart" in window || navigator.maxTouchPoints > 0);
  return !(isPortrait && isTouch);
}

void ensureUiFontReady().then(() => {
  let game: Phaser.Game | null = null;

  /**
   * Stand the Phaser game up if (and only if) the device is currently in a
   * state that should run it. Tearing the game down + recreating on every
   * orientation change is heavy-handed, but it sidesteps the entire class
   * of bugs around live `scaleMode` swaps in Phaser 3 — the canvas always
   * boots fresh into the orientation we want it for, with no leftover
   * layout state from a previous mode.
   */
  const syncGameWithOrientation = () => {
    if (shouldRunGame()) {
      if (game) return;
      game = new Phaser.Game(config);
    } else {
      if (!game) return;
      // `destroy(true)` removes the canvas DOM node. Without that, a fresh
      // `new Phaser.Game(config)` on the next rotation would mount a second
      // canvas inside `#game` and we'd see two games stacked on top of
      // each other.
      game.destroy(true);
      game = null;
    }
  };

  syncGameWithOrientation();
  portraitQuery?.addEventListener("change", syncGameWithOrientation);
});
