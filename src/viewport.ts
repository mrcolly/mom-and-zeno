import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "./constants";

/**
 * Rectangle, in **logical canvas coordinates** (i.e. inside the 1280×720
 * world Phaser scenes draw into), that is guaranteed to be visible on
 * screen given the current viewport and scale mode.
 *
 * UI that must never be clipped (dialogue panel, HUD buttons, prompts) should
 * pin its edges to this rect rather than to `GAME_WIDTH` / `GAME_HEIGHT`.
 */
export type SafeArea = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
};

const FULL_AREA: SafeArea = {
  left: 0,
  right: GAME_WIDTH,
  top: 0,
  bottom: GAME_HEIGHT,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
};

/**
 * Compute the safe area for a scene.
 *
 * Phaser is configured with `Scale.ENVELOP` on touch devices, which scales
 * the canvas to *cover* the viewport — meaning a phone whose landscape
 * aspect ratio is wider than 16:9 (most are; ~19.5:9 is typical) will have
 * the top and bottom of the 16:9 canvas clipped off the visible area. The
 * inverse holds for portrait. This helper returns the slice that's actually
 * on screen so callers can position content inside it.
 *
 * On `Scale.FIT` (desktop or any non-touch context) the whole canvas is
 * always visible, so this returns the full 1280×720 rect.
 */
export function getSafeArea(scene: Phaser.Scene): SafeArea {
  const sm = scene.scale;
  if (sm.scaleMode !== Phaser.Scale.ENVELOP) return FULL_AREA;

  // Use the live viewport (not Phaser's parentSize cache) so we stay in
  // sync if this gets called between a `resize` event and Phaser's own
  // bookkeeping pass.
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (w <= 0 || h <= 0) return FULL_AREA;

  // ENVELOP scale = max of the two axis ratios so the canvas covers the
  // smaller dimension. The other dimension overshoots and the overshoot is
  // exactly what gets clipped on each side.
  const scale = Math.max(w / GAME_WIDTH, h / GAME_HEIGHT);
  const visibleW = w / scale;
  const visibleH = h / scale;

  const left = (GAME_WIDTH - visibleW) / 2;
  const top = (GAME_HEIGHT - visibleH) / 2;
  return {
    left,
    right: left + visibleW,
    top,
    bottom: top + visibleH,
    width: visibleW,
    height: visibleH,
  };
}
