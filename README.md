# Mom & Zeno

A tiny Mother's Day Phaser 3 game. A mom races other parents through a kindergarten to pick up her son Zeno.

## Stack

- Phaser 3 + TypeScript + Vite
- Landscape mobile-friendly (1280x720, scales with `Scale.FIT`)
- Placeholder PNGs you can replace any time without touching code

## Setup

```bash
npm install
npm run gen:assets   # one-time, generates placeholder PNGs in public/assets/**
npm run dev          # opens http://localhost:5173 (and your LAN IP for phones)
```

## Build

```bash
npm run build
npm run preview
```

The `dist/` folder is fully static — drop it on GitHub Pages, Netlify, etc.

## Replacing the placeholder art

Just overwrite the files in `public/assets/**` keeping the same filenames:

- `characters/`: `mom.png`, `parent1.png`, `parent2.png`, `parent3.png`, `zeno.png`, `teacher.png`, `car.png`
- `portraits/`: `mom_portrait.png`, `dad_portrait.png`, `teacher_portrait.png`, `zeno_portrait.png`
- `backgrounds/`: `street.png`, `school_interior.png`, `classroom.png`, `splash.png`

## Editing dialogue

All text lives in [`src/dialogue.ts`](src/dialogue.ts).

## Scenes

`BootScene -> MenuScene -> CarCutsceneScene -> RaceScene -> KindergartenCutsceneScene -> HappyMothersDayScene`

Lose the race and you go to `GameOverScene` -> retry `RaceScene`.
