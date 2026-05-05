import Phaser from "phaser";
import { COLORS, FONT_FAMILY } from "../constants";

export type ButtonOptions = {
  width?: number;
  height?: number;
  /** Corner-radius of the rounded body. Default 18 px. */
  radius?: number;
  fontSize?: number;
  fillColor?: number;
  hoverColor?: number;
  textColor?: string;
  /** Font weight passed through to the canvas font shorthand. */
  fontWeight?: number | string;
  onClick: () => void;
};

/**
 * Opaque handle returned by `createButton` — exposes only the operations
 * callers actually need. The internal layout (graphics body + label + hit
 * rectangle, all top-level scene children) is intentionally not part of the
 * public surface.
 */
export type Button = {
  setDepth(depth: number): Button;
  setVisible(visible: boolean): Button;
  destroy(): void;
};

/**
 * Friendly rounded-rectangle button.
 *
 * Layout: a soft drop-shadow sits a few pixels below a rounded body, with a
 * centered text label on top. Hover lightens the body, press scales the
 * visuals down to ~96% for tactile feedback. `onClick` fires on pointerdown
 * so rapid mashing on touch screens (think: RUN button) registers reliably
 * even when fingers don't cleanly release.
 *
 * IMPORTANT: the body, label and hit rectangle are added directly to the
 * scene (NOT wrapped in a Phaser Container). In Phaser 3, an interactive
 * child inside a Container drifts away from its visual when the camera
 * scrolls — even if both have scrollFactor 0 — because the input system's
 * hit transform doesn't compose container scrollFactor with child position
 * the way the renderer does. The race scene's camera follows mom, which is
 * exactly the situation that triggers the drift, so all three parts live at
 * scene-root level with their own `scrollFactor(0)`.
 *
 * Usage:
 *
 *   createButton(scene, x, y, "GO", { onClick: () => ... }).setDepth(1000);
 */
export function createButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  options: ButtonOptions,
): Button {
  const {
    width = 280,
    height = 84,
    radius = 18,
    fontSize = 28,
    fillColor = COLORS.buttonFill,
    hoverColor = COLORS.buttonHover,
    textColor = COLORS.textLight,
    fontWeight = 600,
    onClick,
  } = options;

  const halfW = width / 2;
  const halfH = height / 2;
  // Tiny vertical offset for the drop shadow — grounds the button on
  // whatever surface it sits on, especially over busy backgrounds.
  const shadowOffset = 5;

  // The Graphics object is positioned at (x, y); all draw coordinates are
  // local (centered on its origin) so the press-scale tween rotates around
  // the visual center, not the top-left.
  const body = scene.add.graphics({ x, y }).setScrollFactor(0);

  const draw = (fill: number) => {
    body.clear();
    body.fillStyle(COLORS.buttonShadow, 0.35);
    body.fillRoundedRect(
      -halfW,
      -halfH + shadowOffset,
      width,
      height,
      radius,
    );
    body.fillStyle(fill, 1);
    body.fillRoundedRect(-halfW, -halfH, width, height, radius);
  };
  draw(fillColor);

  const text = scene.add
    .text(x, y, label, {
      fontFamily: FONT_FAMILY,
      fontSize: `${fontSize}px`,
      color: textColor,
      align: "center",
      // Phaser TextStyle composes the canvas font shorthand from `fontStyle`,
      // so passing the weight here puts it in the right slot.
      fontStyle: String(fontWeight),
    })
    .setOrigin(0.5)
    .setScrollFactor(0);

  const hit = scene.add
    .rectangle(x, y, width, height)
    .setFillStyle(0x000000, 0.001)
    .setScrollFactor(0)
    .setInteractive({ useHandCursor: true });

  // Hit rectangle stays full-size; only the visuals shrink on press, so the
  // click target the player aims at never moves under their finger.
  const setVisualScale = (s: number) => {
    body.setScale(s);
    text.setScale(s);
  };

  hit.on("pointerover", () => draw(hoverColor));
  hit.on("pointerout", () => {
    draw(fillColor);
    setVisualScale(1);
  });
  hit.on("pointerdown", () => {
    setVisualScale(0.96);
    onClick();
  });
  hit.on("pointerup", () => setVisualScale(1));
  hit.on("pointerupoutside", () => setVisualScale(1));

  const button: Button = {
    setDepth(depth) {
      body.setDepth(depth);
      // Label one above the body so it never gets hidden; hit one above the
      // label so taps always reach the listener even when the label sits
      // exactly on top of the press target.
      text.setDepth(depth + 1);
      hit.setDepth(depth + 2);
      return button;
    },
    setVisible(visible) {
      body.setVisible(visible);
      text.setVisible(visible);
      hit.setVisible(visible);
      return button;
    },
    destroy() {
      body.destroy();
      text.destroy();
      hit.destroy();
    },
  };

  return button;
}
