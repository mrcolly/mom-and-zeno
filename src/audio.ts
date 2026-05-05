import Phaser from "phaser";

/**
 * Single source of truth for SFX texture keys + their on-disk paths.
 * Mirrors `sprites.ts` for the audio layer: BootScene's preload + every
 * scene's `sound.add(...)` both reference the same `Sfx.*` constants so
 * a typo surfaces as a TypeScript error rather than a silent missing
 * sound at runtime.
 *
 * Files live under `public/assets/audio/sfx/`. Filenames are stable —
 * matching the `prompts/sfx/<name>.md` source-of-truth filenames — so
 * dropping in a regenerated clip is just an overwrite.
 */
export const Sfx = {
  Footsteps: "sfx_footsteps",
  Jump: "sfx_jump",
  Bonk: "sfx_bonk",
  Phone: "sfx_phone_ring",
  CarEngine: "sfx_car_engine",
  Fart: "sfx_fart",
} as const;
export type Sfx = (typeof Sfx)[keyof typeof Sfx];

export const SFX_FILES: Readonly<Record<Sfx, string>> = {
  [Sfx.Footsteps]: "assets/audio/sfx/footsteps-running.wav",
  [Sfx.Jump]: "assets/audio/sfx/jump.wav",
  [Sfx.Bonk]: "assets/audio/sfx/hit-bonk.wav",
  [Sfx.Phone]: "assets/audio/sfx/phone-ring.mp3",
  [Sfx.CarEngine]: "assets/audio/sfx/car-engine.wav",
  [Sfx.Fart]: "assets/audio/sfx/fart-puzzetta.wav",
};

/**
 * Tween a sound's `volume` to `to` over `duration` ms. Centralises the
 * fade-in / fade-out boilerplate (Phaser exposes `volume` as a tweenable
 * property on `BaseSound`, but the typed `targets` array needs a cast).
 *
 * Returns the tween so callers can hook `onComplete` if they want to
 * chain another action after the fade completes.
 */
export function fadeVolume(
  scene: Phaser.Scene,
  sound: Phaser.Sound.BaseSound,
  to: number,
  duration: number,
): Phaser.Tweens.Tween {
  return scene.tweens.add({
    targets: sound as unknown as object,
    volume: to,
    duration,
  });
}

/**
 * Fade a sound out and `stop()` it once the fade completes. Convenience
 * wrapper for the common "kill this loop cleanly" pattern. The sound is
 * fully released (frees the underlying Web Audio node), so callers must
 * `scene.sound.add(...)` again if they want to play it back.
 */
export function fadeOutAndStop(
  scene: Phaser.Scene,
  sound: Phaser.Sound.BaseSound,
  duration: number,
): void {
  scene.tweens.add({
    targets: sound as unknown as object,
    volume: 0,
    duration,
    onComplete: () => sound.stop(),
  });
}
