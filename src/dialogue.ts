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
    speaker: "right",
    portraitKey: "dad_portrait",
    text: "Ciao amore! Dove sei? Hai preso Zeno?",
  },
  {
    speaker: "left",
    portraitKey: "mom_portrait",
    text: "No, sono ancora in macchina, sono in ritardissimo! Spero non ci sia la coda come al solito.",
  },
  {
    speaker: "right",
    portraitKey: "dad_portrait",
    text: "Ci sarà sicuramente... Dai, fai in fretta. Vi aspetto!",
  },
  {
    speaker: "left",
    portraitKey: "mom_portrait",
    text: "Ci provo, devo correre!!!",
  },
];

// KindergartenCutsceneScene: la maestra (Ilaria) fa il riassunto
// (lunghissimo) della giornata, mamma in ritardo che la prega di andare a
// prendere Zeno. Ilaria la chiama sempre "mamma" e la ignora finché non
// sbotta.
//
// Convenzioni interne:
//   - ogni riferimento al cibo si chiude con "ha mangiato tutto... come
//     al solito" — running gag del personaggio. Per il pranzo ogni
//     portata sta in una riga separata, seguita dalla sua battuta, così
//     il ritmo è "portata → tutto → portata → tutto" e si sente la
//     ripetizione meccanica;
//   - la mamma chiama la maestra per nome ("Ilaria") perché si conoscono;
//   - le interiezioni della mamma vanno dal pacato "...buongiorno" al
//     gemito esasperato, per dare ritmo alla scena.
export const kindergartenTeacherDialogue: DialogueLine[] = [
  {
    speaker: "right",
    portraitKey: "teacher_portrait",
    text: "Buongiorno mamma! Accomodati, ti racconto la giornata di Zeno...",
  },
  {
    speaker: "left",
    portraitKey: "mom_portrait",
    text: "...buongiorno.",
  },
  {
    speaker: "right",
    portraitKey: "teacher_portrait",
    text: "Stamattina abbiamo cantato una canzoncina sulla primavera. Te la canto, eh:",
  },
  {
    speaker: "right",
    portraitKey: "teacher_portrait",
    text: "♪ È primavera, primavera, sbocciano i fiori, cantano gli uccellini... ♪",
  },
  {
    speaker: "left",
    portraitKey: "mom_portrait",
    text: "Ilaria, ti prego, sono in ritardo. Possiamo fare veloce?",
  },
  {
    speaker: "right",
    portraitKey: "teacher_portrait",
    text: "Poi disegni della primavera: ha usato sette pennarelli diversi. Sette!",
  },
  {
    speaker: "left",
    portraitKey: "mom_portrait",
    text: "Puoi chiamarlo? Sono in ritardo.",
  },
  {
    speaker: "right",
    portraitKey: "teacher_portrait",
    text: "Un attimo mamma, devo finire. A pranzo: pasta con i piselli.",
  },
  {
    speaker: "right",
    portraitKey: "teacher_portrait",
    text: "Ha mangiato tutto... come al solito.",
  },
  {
    speaker: "right",
    portraitKey: "teacher_portrait",
    text: "Poi finocchi.",
  },
  {
    speaker: "right",
    portraitKey: "teacher_portrait",
    text: "Ha mangiato tutto... come al solito.",
  },
  {
    speaker: "right",
    portraitKey: "teacher_portrait",
    text: "E per finire formaggino.",
  },
  {
    speaker: "right",
    portraitKey: "teacher_portrait",
    text: "Ha mangiato tutto... come al solito.",
  },
  {
    speaker: "left",
    portraitKey: "mom_portrait",
    text: "Sto invecchiando...",
  },
  {
    speaker: "right",
    portraitKey: "teacher_portrait",
    text: "Poi inglese con Stella: 'apple', 'orange', 'banana'...",
  },
  {
    speaker: "left",
    portraitKey: "mom_portrait",
    text: "Ilaria, ti prego!",
  },
  {
    speaker: "right",
    portraitKey: "teacher_portrait",
    text: "Aspetta mamma. Zeno ha imparato 'banana' in un secondo. Bravissimo!",
  },
  {
    speaker: "left",
    portraitKey: "mom_portrait",
    text: "Mamma mia...",
  },
  {
    speaker: "right",
    portraitKey: "teacher_portrait",
    text: "A merenda pane e marmellata. Ha mangiato tutto... come al solito.",
  },
  {
    speaker: "left",
    portraitKey: "mom_portrait",
    text: "Aaaaah...",
  },
  {
    speaker: "right",
    portraitKey: "teacher_portrait",
    text: "Nel pomeriggio musica con Gabri.",
  },
  {
    speaker: "right",
    portraitKey: "teacher_portrait",
    text: "Zeno ha suonato la tromba così: ppprrrr prrrr pppppppprrrrrrr",
  },
  {
    speaker: "left",
    portraitKey: "mom_portrait",
    text: "VAI A PRENDERE MIO FIGLIO!!!",
  },
  {
    speaker: "right",
    portraitKey: "teacher_portrait",
    text: "Oh! Va bene mamma... vado subito.",
  },
];

// KindergartenCutsceneScene: la maestra torna senza Zeno con un dettaglio
// imbarazzante. I tre puntini su righe separate sono volutamente split
// per ottenere la "lunga pausa" — ogni riga richiede un tap.
export const kindergartenTeacherForgotDialogue: DialogueLine[] = [
  {
    speaker: "right",
    portraitKey: "teacher_portrait",
    text: "Ah mamma, dimenticavo...",
  },
  {
    speaker: "right",
    portraitKey: "teacher_portrait",
    text: "Non si è scaricato...",
  },
  {
    speaker: "right",
    portraitKey: "teacher_portrait",
    text: "...ma non è una novità.",
  },
  {
    speaker: "left",
    portraitKey: "mom_portrait",
    text: "Aaaaah...",
  },
];

// KindergartenCutsceneScene: mamma + Zeno dopo l'abbraccio. Lo scambio
// affettuoso che chiude la fuga "andiamo a casa da papà"; lascia in
// sospeso prima della battuta finale (vedi `kindergartenZenoPuzzettaDialogue`).
export const kindergartenZenoDialogue: DialogueLine[] = [
  {
    speaker: "left",
    portraitKey: "mom_portrait",
    text: "Ciao amore!",
  },
  {
    speaker: "right",
    portraitKey: "zeno_portrait",
    text: "Ciao mamma! Mi sei mancata tanto.",
  },
  {
    speaker: "left",
    portraitKey: "mom_portrait",
    text: "Anche tu mi sei mancato tanto, cucciolo! Dai, andiamo a casa da papà.",
  },
];

// KindergartenCutsceneScene: la battuta finale dopo una pausa di silenzio
// dall'overlay precedente — Zeno rovina il momento dolce con la verità,
// la mamma fa la faccia che fa una mamma. Vive in un overlay separato
// così la pausa fra "andiamo a casa" e "ho fatto una puzzetta" si legge
// chiaramente come un beat comico, non come un cambio di battuta.
export const kindergartenZenoPuzzettaDialogue: DialogueLine[] = [
  {
    speaker: "right",
    portraitKey: "zeno_portrait",
    text: "Ho fatto una puzzetta.",
  },
  {
    speaker: "left",
    portraitKey: "mom_portrait",
    text: "Bleeeeah!",
  },
];
