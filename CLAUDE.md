# Chute Rhythm — instructions for Claude

A rhythm-timing web game for Poki. A plane drops skydivers at a steady beat; the player taps to open each diver's chute as late as possible, inside the green band. Working title "Chute Rhythm" (name not final).

Read these before changing anything:
- `docs/design-brief.md` — the idea, rules, levels, decisions and their reasons
- `docs/economy.md` — coins, store, cosmetics, reward track, world gate
- `docs/next-build.md` — what's pending and what each version shipped

Current version: **v6.7** (2026-11-02). Game code: `index.html`, `style.css`, `js/` (see "Code layout").

## Roles
- The user designs, plays, judges and decides. Claude builds, polishes and verifies.
- The user batches small changes into a build. Before a build, agree the list in `docs/next-build.md`; after it, move items to "Shipped" with a short note of what changed and how it was verified.
- Discuss before building when a change affects feel, rules or economy. Don't add features that weren't asked for; suggest them instead.

## Core rules (don't break these)
- **Eyes on the green band.** Nothing on screen may pull the eye off the band during play.
- **Every level must allow all-perfect** (band windows ≥ 0.15 s apart). Tempo Slow 1.1 / Med 0.85 / Fast 0.65 s; band ~120 / ~90 / ~65 ms.
- **A level plays the same every time.** Lift positions, chute pops and clouds come from the level's seed (`seed` option, default = level number), so a playtest holds for every player.
- **Every non-perfect landing costs one life**; 3 lives per level; lives left = stars. After the last life is lost, nothing else counts.
- **Progress is saved the moment the result opens or a button is pressed — never at the end of an animation.** Skipping an animation must never lose anything.
- **Leaving the result screen ends everything from it** (delayed effects via `rt()`, cancelled by `leaveResult()`; sounds cut by `SFX.cutAll()`).
- **Icons have one meaning each:** ★ = level rating only; 💔 = a life lost; tick = perfect landing; ▶ = go on; circle arrow = retry; grid = levels; TV = watch a rewarded ad (always with the word AD); moon = Night helper; band with up arrow = Wide green helper.
- **New features get an intro card** in the how-to style, shown once before their first level. Cards only teach what the player has met.
- **Minimal words, icons over text.** Only PERFECT gets a word; misses are a breaking heart; "CRASH!", "SPLAT", "CAUGHT BY RADAR!", "NO MORE LIVES".
- **Cartoony, Poki-safe.** No gore.
- **Economy:** coins come from play; every store item is buyable without ads; stars are never sold, only earned by landing. Helpers are ad-only and only make landing easier, so every level must stay passable without one. Rewarded ads are optional and pay only when the ad finishes.
- **Sound:** never rely on sound for gameplay (many play muted). Keep result sounds few and not shrill.
- **Phone first:** works at phone width, touch and keyboard (Space / Up / W).

## How to verify a change
1. Run `npm test` (needs `npm install` and `npx playwright install chromium` once). `npm test -- quick` skips the 50-level perfect run, which takes a while. Fix anything that fails.
2. Add a check to `tests/run.mjs` for any new rule.
3. Tell the user what to playtest for feel. Tests guard the rules; the user judges the fun.
- Keep the test hook `window.__chute` (read-only view of a run) working; the tests depend on it.

## Code layout
Plain `<script>` files, no build tool. They share one global scope and load in this order (set in `index.html`):
`core` ($, store, settings) → `sfx` → `dev` (dev controls) → `levels` (tuning, levels, progress, economy data) → `world` (terrain, building a jump, radar, clouds) → `input` → `sim` (collapse, simulation) → `render` (drawing, cosmetics) → `cards` (how-to, intro, graduation) → `loop` (game loop, start, level screen) → `result` (result screen, coins, reward track) → `store` (fake ad, store) → `main` (test hook, boot).
- Code that runs while a file loads can only use what earlier files define. Code inside functions and event handlers can use anything, because it runs after boot.
- Start-up calls go in `js/main.js`, which loads last.

## Before Poki release
- Swap the fake ad (`watchAd`) for `PokiSDK.rewardedBreak`; add `gameplayStart/Stop`, mute during ads.
- Remove the dev ⚙ controls / sandbox (they hold Unlock all levels, +1000 coins and Reset progress).
- Pick the final name.

## Hosting
`sh build.sh` writes the minified game to `build/` and a zip of it (`--test` runs the quick tests first). Cloudflare Pages runs it on every push (build command `sh build.sh`, output directory `build`); the user tests on a phone. Saves live in `localStorage` key `chuteRhythm.v5.progress`.
