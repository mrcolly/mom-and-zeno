# Asset prompts

Each file in this folder is a **fully self-contained prompt** for an AI image
generator (Midjourney, DALL-E, Stable Diffusion, Nano Banana, etc.) to
produce one asset for the game. The shared style rules are inlined into every
prompt — you can copy any single file's prompt block and paste it without
needing context from any other file.

## Workflow

1. Open the prompt file for the asset you want.
2. Copy the prompt block (everything inside the `> ...` quotes), paste into
   your image tool.
3. Save the resulting PNG to the destination listed at the top of the file.
4. Refresh `npm run dev` — the asset is picked up automatically.

## In-scene text vs. UI buttons

Every prompt explicitly allows the AI to render **in-scene text** where it
would naturally appear (door signs like "ZENO'S CLASS", classroom alphabet
posters, shop signs, book titles, etc.) and asks it to **avoid game-engine UI
text** like "PLAY", "START", "RUN", "JUMP" — those labels are drawn
separately by the game on top of the assets.

## Folders

- `backgrounds/` — full-scene backdrops, scrolling corridor, finish-door element.
- `characters/` — mom, three rival parents, teacher, Zeno, the car.
- `obstacles/` — the five things to jump over during the race.
- `portraits/` — bust shots used in the visual-novel dialogue overlay.

## After dropping new assets in

Some assets need a one-line code adjustment when their source dimensions
differ from the placeholders (mostly `.setScale(...)` tweaks in the scene
files, and switching obstacles from rectangles to sprites). When you finish a
batch of new images, ask me to "wire up the new assets" and I'll update the
scenes accordingly.

## Index

| Asset                     | Prompt file                                                          | Saves to                                                |
| ------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------- |
| Car cutscene background   | [backgrounds/street.md](backgrounds/street.md)                       | `public/assets/backgrounds/street.png`                  |
| Race corridor (tiles)     | [backgrounds/race-corridor.md](backgrounds/race-corridor.md)         | `public/assets/backgrounds/school_interior.png`         |
| Race finish-line door     | [backgrounds/race-finish-door.md](backgrounds/race-finish-door.md)   | `public/assets/backgrounds/finish_door.png` (new)       |
| Kindergarten classroom    | [backgrounds/classroom.md](backgrounds/classroom.md)                 | `public/assets/backgrounds/classroom.png`               |
| Mother's Day splash       | [backgrounds/splash.md](backgrounds/splash.md)                       | `public/assets/backgrounds/splash.png`                  |
| Mom (player)              | [characters/mom.md](characters/mom.md)                               | `public/assets/characters/mom.png`                      |
| Parent 1 — old lady       | [characters/parent1-old-lady.md](characters/parent1-old-lady.md)     | `public/assets/characters/parent1.png`                  |
| Parent 2 — Latina mom     | [characters/parent2-latina-mom.md](characters/parent2-latina-mom.md) | `public/assets/characters/parent2.png`                  |
| Parent 3 — ugly smoker    | [characters/parent3-ugly-guy.md](characters/parent3-ugly-guy.md)     | `public/assets/characters/parent3.png`                  |
| Teacher                   | [characters/teacher.md](characters/teacher.md)                       | `public/assets/characters/teacher.png`                  |
| Zeno                      | [characters/zeno.md](characters/zeno.md)                             | `public/assets/characters/zeno.png`                     |
| Zeno — waving             | [characters/zeno-wave.md](characters/zeno-wave.md)                   | `public/assets/characters/zeno_wave.png` (new)          |
| Zeno — jumping & laughing | [characters/zeno-jump.md](characters/zeno-jump.md)                   | `public/assets/characters/zeno_jump.png` (new)          |
| Ford Puma (grey)          | [characters/car-ford-puma.md](characters/car-ford-puma.md)           | `public/assets/characters/car.png`                      |
| Obstacle: teddy bear      | [obstacles/teddy-bear.md](obstacles/teddy-bear.md)                   | `public/assets/obstacles/teddy_bear.png` (new)          |
| Obstacle: newborn         | [obstacles/newborn.md](obstacles/newborn.md)                         | `public/assets/obstacles/newborn.png` (new)             |
| Obstacle: shoe            | [obstacles/shoe.md](obstacles/shoe.md)                               | `public/assets/obstacles/shoe.png` (new)                |
| Obstacle: toy car         | [obstacles/toy-car.md](obstacles/toy-car.md)                         | `public/assets/obstacles/toy_car.png` (new)             |
| Obstacle: small bicycle   | [obstacles/small-bicycle.md](obstacles/small-bicycle.md)             | `public/assets/obstacles/small_bicycle.png` (new)       |
| Mom portrait              | [portraits/mom.md](portraits/mom.md)                                 | `public/assets/portraits/mom_portrait.png`              |
| Dad portrait              | [portraits/dad.md](portraits/dad.md)                                 | `public/assets/portraits/dad_portrait.png`              |
| Teacher portrait          | [portraits/teacher.md](portraits/teacher.md)                         | `public/assets/portraits/teacher_portrait.png`          |
| Zeno portrait             | [portraits/zeno.md](portraits/zeno.md)                               | `public/assets/portraits/zeno_portrait.png`             |
