import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, FONT_FAMILY, COLORS } from "../constants";
import type { DialogueLine } from "../dialogue";
import { getSafeArea } from "../viewport";

// The overlay is intentionally a "soft" wrap around the scene rather than an
// opaque cover, so the player can still see what's happening behind the
// dialogue (waving, walking, hugging, ...).
const PORTRAIT_BOX_SIZE = 200;
const PANEL_HEIGHT = 160;
const PANEL_MARGIN = 24;
const BACKDROP_ALPHA = 0.4;
// Portraits hug the far left and right edges (just inside the screen), and
// sit just above the text panel — leaving the entire central column of the
// scene unobstructed during dialogue.
const PORTRAIT_EDGE_GAP = 30;
const PORTRAIT_PANEL_GAP = 12;

// Typewriter pacing: ms-per-character. ~22 ms ≈ 45 chars/sec, which feels
// like natural casual speech rather than slow narration. Tap-to-skip while
// typing flushes the rest of the line instantly.
const TYPE_SPEED_MS = 22;

/**
 * Reusable visual-novel-style dialogue overlay. Two portraits sit on top
 * (each side pre-bound to whoever speaks on that side first); the active
 * speaker is fully opaque, the other side is dimmed. A text panel at the
 * bottom shows the current line with a small `next` indicator. Tap anywhere
 * on the overlay to advance; emits the `complete` event when the last line
 * is dismissed.
 *
 * Usage:
 *   const dlg = new DialogueOverlay(this, lines);
 *   dlg.once('complete', () => { ... });
 */
export class DialogueOverlay extends Phaser.Events.EventEmitter {
  private readonly scene: Phaser.Scene;
  private readonly lines: DialogueLine[];
  private index = 0;

  private readonly container: Phaser.GameObjects.Container;
  private readonly leftPortrait: Phaser.GameObjects.Image;
  private readonly rightPortrait: Phaser.GameObjects.Image;
  private readonly text: Phaser.GameObjects.Text;
  private readonly nextIndicator: Phaser.GameObjects.Text;
  private readonly hitArea: Phaser.GameObjects.Rectangle;

  // Typewriter state.
  private fullText = "";
  private typingTimer?: Phaser.Time.TimerEvent;
  private isTyping = false;

  constructor(scene: Phaser.Scene, lines: DialogueLine[]) {
    super();
    this.scene = scene;
    this.lines = lines;

    this.container = scene.add.container(0, 0).setDepth(5000);
    this.container.setScrollFactor(0);

    const backdrop = scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      BACKDROP_ALPHA,
    );

    // Anchor everything to the visible safe area, not the raw 1280×720
    // canvas — on touch devices Phaser runs in ENVELOP mode and clips a
    // band off the top and bottom (or sides), and we need the panel +
    // portraits to stay fully on-screen.
    const safe = getSafeArea(scene);

    // Portraits — pinned to the far left/right of the safe area and
    // stacked just above the text panel.
    const leftX = safe.left + PORTRAIT_BOX_SIZE / 2 + PORTRAIT_EDGE_GAP;
    const rightX = safe.right - PORTRAIT_BOX_SIZE / 2 - PORTRAIT_EDGE_GAP;
    const panelTopY = safe.bottom - PANEL_HEIGHT - PANEL_MARGIN;
    const portraitY = panelTopY - PORTRAIT_BOX_SIZE / 2 - PORTRAIT_PANEL_GAP;

    // Pre-pick each side's portrait from the first line that speaks on that
    // side, so both sides never show the same character at once. If a side
    // never speaks in this dialogue, that portrait stays hidden.
    const leftKey = lines.find((l) => l.speaker === "left")?.portraitKey;
    const rightKey = lines.find((l) => l.speaker === "right")?.portraitKey;

    this.leftPortrait = scene.add
      .image(leftX, portraitY, leftKey ?? "")
      .setDisplaySize(PORTRAIT_BOX_SIZE, PORTRAIT_BOX_SIZE)
      .setVisible(!!leftKey);

    this.rightPortrait = scene.add
      .image(rightX, portraitY, rightKey ?? "")
      .setDisplaySize(PORTRAIT_BOX_SIZE, PORTRAIT_BOX_SIZE)
      .setVisible(!!rightKey);

    // Text panel — pinned to the safe-area bottom and width so it stays
    // fully visible on phones that crop the canvas.
    const panelY = safe.bottom - PANEL_HEIGHT / 2 - PANEL_MARGIN;
    const panelWidth = safe.width - PANEL_MARGIN * 2;
    const panel = scene.add
      .rectangle(
        (safe.left + safe.right) / 2,
        panelY,
        panelWidth,
        PANEL_HEIGHT,
        COLORS.bgPanel,
        0.95,
      )
      .setStrokeStyle(4, 0xffffff);

    this.text = scene.add
      .text(safe.left + PANEL_MARGIN * 2, panelY - PANEL_HEIGHT / 2 + 32, "", {
        fontFamily: FONT_FAMILY,
        fontSize: "28px",
        color: COLORS.textLight,
        wordWrap: { width: panelWidth - PANEL_MARGIN * 2 },
        lineSpacing: 8,
      })
      .setOrigin(0, 0);

    this.nextIndicator = scene.add
      .text(safe.right - PANEL_MARGIN * 2, panelY + PANEL_HEIGHT / 2 - 24, "v", {
        fontFamily: FONT_FAMILY,
        fontSize: "32px",
        color: COLORS.textLight,
      })
      .setOrigin(1, 1)
      .setVisible(false);

    scene.tweens.add({
      targets: this.nextIndicator,
      y: this.nextIndicator.y - 6,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Full-screen click target for advancing dialogue.
    this.hitArea = scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT)
      .setFillStyle(0x000000, 0.001)
      .setInteractive();

    this.hitArea.on("pointerdown", () => this.advance());

    this.container.add([
      backdrop,
      this.leftPortrait,
      this.rightPortrait,
      panel,
      this.text,
      this.nextIndicator,
      this.hitArea,
    ]);

    // Auto-cleanup if scene shuts down mid-dialogue.
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());

    this.render();
  }

  private render() {
    const line = this.lines[this.index];
    if (!line) return;

    // Active speaker is fully opaque; the other side is dimmed so the player
    // gets a clear "who's talking" cue without needing a frame highlight.
    if (line.speaker === "left") {
      this.leftPortrait.setTexture(line.portraitKey);
      this.leftPortrait.setAlpha(1);
      this.rightPortrait.setAlpha(0.35);
    } else {
      this.rightPortrait.setTexture(line.portraitKey);
      this.rightPortrait.setAlpha(1);
      this.leftPortrait.setAlpha(0.35);
    }

    this.startTyping(line.text);
  }

  /**
   * Typewriter effect: reveal the line one character at a time. The "next"
   * indicator stays hidden until the typing finishes. A tap mid-typing flushes
   * the remaining characters so impatient readers (or anyone re-reading) can
   * skip past it.
   *
   * Implemented with a single repeating Phaser TimerEvent rather than a tween
   * so we can cancel it cleanly in `flushTyping()` and reuse the same panel
   * for the next line without re-creating any objects.
   */
  private startTyping(fullText: string) {
    this.cancelTyping();
    this.fullText = fullText;
    this.text.setText("");
    this.nextIndicator.setVisible(false);
    this.isTyping = true;

    if (fullText.length === 0) {
      this.finishTyping();
      return;
    }

    let i = 0;
    this.typingTimer = this.scene.time.addEvent({
      delay: TYPE_SPEED_MS,
      repeat: fullText.length - 1,
      callback: () => {
        i += 1;
        this.text.setText(fullText.slice(0, i));
        if (i >= fullText.length) this.finishTyping();
      },
    });
  }

  private cancelTyping() {
    if (this.typingTimer) {
      this.typingTimer.remove(false);
      this.typingTimer = undefined;
    }
  }

  private finishTyping() {
    this.cancelTyping();
    this.text.setText(this.fullText);
    this.isTyping = false;
    this.nextIndicator.setVisible(true);
  }

  private advance() {
    // Mid-typing: a tap flushes the rest of the current line instead of
    // advancing — the standard visual-novel UX expectation.
    if (this.isTyping) {
      this.finishTyping();
      return;
    }
    this.index += 1;
    if (this.index >= this.lines.length) {
      this.emit("complete");
      this.destroy();
      return;
    }
    this.render();
  }

  destroy() {
    this.cancelTyping();
    if (this.container?.scene) {
      this.container.destroy();
    }
    this.removeAllListeners();
  }
}
