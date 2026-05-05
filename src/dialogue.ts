// All in-game dialogue lives here. Edit freely; scenes pick the right array
// by name. `speaker` controls which portrait gets highlighted.
//
// Game language: Italian.

export type DialogueLine = {
  speaker: "left" | "right";
  /** Texture key registered in BootScene. */
  portraitKey: string;
  /** The actual text to display. */
  text: string;
};

// CarCutsceneScene: mamma (sinistra) al telefono con papà (destra).
export const carCallDialogue: DialogueLine[] = [
  {
    speaker: "left",
    portraitKey: "mom_portrait",
    text: "Sono in ritardissimo! Zeno è ancora all'asilo...",
  },
  {
    speaker: "right",
    portraitKey: "dad_portrait",
    text: "Stai tranquilla, guida con prudenza. Ce la fai!",
  },
  {
    speaker: "left",
    portraitKey: "mom_portrait",
    text: "Devo arrivare alla porta prima degli altri genitori!",
  },
];

// KindergartenCutsceneScene: mamma + maestra all'arrivo.
export const kindergartenTeacherDialogue: DialogueLine[] = [
  {
    speaker: "left",
    portraitKey: "mom_portrait",
    text: "Buongiorno! Sono qui per Zeno.",
  },
  {
    speaker: "right",
    portraitKey: "teacher_portrait",
    text: "Un attimo, vado subito a chiamarlo.",
  },
];

// KindergartenCutsceneScene: mamma + Zeno dopo l'abbraccio.
export const kindergartenZenoDialogue: DialogueLine[] = [
  {
    speaker: "right",
    portraitKey: "zeno_portrait",
    text: "Mamma! Mi sei mancata tantissimo!",
  },
  {
    speaker: "left",
    portraitKey: "mom_portrait",
    text: "Ti voglio tanto bene, amore mio.",
  },
];
