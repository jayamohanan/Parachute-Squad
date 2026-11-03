# Parachute Squad — design brief and prototype log

**Name:** "Parachute Squad" (chosen 2026-11-03; was the working title "Chute Rhythm").

Current build: **v6.7** (`index.html`, `style.css`, `js/`). Training jump + graduation card, **5 worlds × 10 levels**, 3 lives → stars, how-to-play card, intro cards for radar/steam/lifts/clouds/broken chutes, radar from Level 1-5 (caught = "house of cards" collapse), coins + store + cosmetics + reward track (see `docs/economy.md`), dev controls as a collapsible overlay, sandbox.
Pending items for the next build live in `docs/next-build.md`.
(Until the move to Claude Code, the build was also published as a claude.ai artifact: https://claude.ai/artifact/XBTtpqGo5TF4gBfCdSg3MM)

## The idea (user's, 2026-10-30)
A plane flies left to right across the top of the screen and drops skydivers over their landing spots. The player taps to open the parachute of the current diver. Open as late as possible. The goal is to hit the perfect band on every diver, like a bullseye, in rhythm. Inspired by the tap rhythm of Speed Stars.

## Core outcome rule (v5.4 + v5.15)
- **Inside the radar region** (from Level 5): **CAUGHT!** — collapse ending, all lives gone, level fails.
- **Above the band, under the radar** (too early): lands safely, costs ❤.
- **In the band**: PERFECT.
- **Below the band**, chute opened: **CRASH!** — costs ❤. **No chute**: **SPLAT** — costs ❤.
- Lose all 3 → **"NO MORE LIVES"** (user prefers "lives" over "hearts" in text). After the last life is lost, nothing else counts (v6.7). Cartoony only; Poki-safe.

## Result screen (v6.7)
- Diver strip: tick = perfect; 💔 = any landing that cost a life; grey dot = didn't count. ★ means level rating only.
- Pass: hearts flip into stars; the star chimes are the win jingle. All perfect: tiles ripple away into "ALL PERFECT!" with one warm chord.
- Fail: red "LEVEL FAILED", three 💔, red outline, Retry is the big button. In game the "NO MORE LIVES" / "CAUGHT!" banners are red and a falling "wah-wah" plays, so the player knows before the card.
- Last level of a world (passed): the "World N" button sits where "Next level" normally does, so it is never mistaken for Retry (open → "World N ▶"; opened by this run → unlock animation on the button after the result animations; locked → 🔒 and stars, tap for a popup with the stars needed, Levels, Close, and the gate ad within 5★ of the gate).

## Training & onboarding (v5.6 → v6.5)
- First time: how-to card → training jump (no hearts, can't fail; freeze on diver 1 with a tapping hand — touch: bottom-right on the grass + "Tap anywhere"; keyboard: SPACE key + "Press Space") → confetti + "TRAINING COMPLETE!" → graduation card (agent badge; 3–6 perfect = READY! → Start; 0–2 = ALMOST! → Practice again / Start; 6 result tiles; +100 starter coins first time only) → level grid with tapping hand on Level 1.
- Training is always marked done. **? → Practice** replays training with the banner only (no card, no coins).
- How-to card: 1. Too early (red X) → 2. Perfect (green tick, tall green band holding the whole diver) → 3. Too late (red X, low near the ground). Each mark sits just left of its diver. Hands sit in a left column, level with each diver (say when, not where).

## Dev controls (user request)
- Mode / Sound / Restart / Levels / Sandbox settings are a floating overlay, collapsed by default behind a ⚙ button (top-right). Remove before release.

## Economy & store — details in `docs/economy.md`
- Coins from play; ads only speed up. 20 chutes, 10 divers, 5 planes. Reward track tied to fixed levels (5th and 10th of each world). World gate "▶ Unlock now" ad within 5★ of the gate. Unlock all levels, +1000 coins and Reset progress live in the dev ⚙ controls — remove before release.

## Audio
- iPhone Safari lost sound after a phone lock (AudioContext 'interrupted'). Fix: resume any non-running state on every tap/key (capture listeners) and on tab visible; rebuild the context if a resume never worked; sounds requested while waking are queued (dropped if >150 ms late). **User to verify on iPhone.**

## Worlds & levels (built v6.0)
- 5 worlds × 10 levels (HUD "Level N", counted across worlds: World 2 starts at Level 11). Unlock: next level after ≥1★; new world on the running star total: 25★, 50★, 75★, 100★ (or gate ad). ‹ › world switcher.
- Recipe format: number = height (0, Lo .06, Mi .12, Ta .18, Hi .24); `V(h)` steam vent, `P(h)` moving lift, `F(h)` faulty chute; options `band`, `clouds`. All 50 bot-cleared ★★★; not yet human-tested.
- W1 Training ground: Find the beat · Picking up speed · Hold your nerve · First rooftop · Rooftops (radar card) · Stairs · Double tap · Don't rush · Skyline · Grand finale.
- W2 City rooftops: Rush hour · Fast lane · High rise · Steam (steam card) · Hot air · Wait for it · Thin air · Steam stairs · Smog · Rooftop finale.
- W3 Base elevators: Going up (lift card) · Lifts · Elevator music · Up and down · Double lift · Steam lift · Thin lift · Fast floors · Shaft · Base elevators.
- W4 Cloud cover: Fog (clouds card) · Cloud cover · Blind beat · Peekaboo · Steam in the fog · Lifts in the fog · Thin fog · Storm · Pea soup · Whiteout.
- W5 Sabotage: Sabotage (broken-chute card) · Second chute · Pop! · Trust nothing · Faulty lifts · Faulty fog · Thin threads · Rapid fire · Everything · Final mission.
- Full recipes live in the `LEVELS` array in the code.

## New-feature intro cards (user rule)
- Every new feature gets a card in the how-to style, shown once before its first level. Cards only teach what the player has met.

## Caught → "house of cards" collapse (v5.20–v5.21)
- Taps locked, slow-mo spotlight, shot line + ring bursts the canopy, plane found and shot, explodes on impact and disappears, everyone on board falls out spinning; "CAUGHT!"; ~5.8 s. User will shorten later (`COL` constants).

## Hearts/lives and stars
- 3 lives per level; stars = lives left; result shows hearts flipping into stars. Level grid shows three stars on every open level, unearned ones grey.

## Radar
- Mainly a theme enhancer. Flat height per level (0.10 above the highest band top, lifts' highest reach); flat light red fill below the plane; drop guard 0.3 s.
- v6.7: "RADAR ZONE" marker (red double arrow spanning the zone) on the radar intro card and in the world at the start of radar levels; it scrolls off before the first band.

## Other UI decisions
- Only the green band is drawn. Restart = current level; two-tap Reset progress (wipes coins/cosmetics too). Next playable level = white tile. Minimal words; icons over text. Only PERFECT gets a word; misses = breaking heart; "CRASH!", "SPLAT", "CAUGHT!".

## Theme direction (leaning)
- HALO / spy, cartoon. Clouds = cover; lifts = base elevators; steam = exhaust stacks; faulty chutes = sabotage. Don't say "HALO".

## Name ideas (undecided)
- Agent Drop, Drop Zone: Undetected (best fit so far), Daredevil Drop, Daredevil Divers, Chicken Chute, Wait For It!, Pop the Chute, Perfect Drop. Avoid: Ripcord Rush, "Last Second …", Parachute Panic.

## Roles
- User: design and ideas; plays, judges, curates. Claude drafts levels and polish. User batches small changes into the next build (`docs/next-build.md`).

## Core feel rules
- Eyes on the green band; decoration must never pull the eye off it. Rush tap after a tense one = core tension. Every level must allow all-perfect (bands ≥ 0.15 s apart). Tempo Slow 1.1 / Med 0.85 / Fast 0.65 s; band ~120 / ~90 / ~65 ms.

## Tech / Poki
- Plain HTML, CSS and script files, no build tool (user hosts on Cloudflare Pages; see "Code layout" in `CLAUDE.md`). Later: Poki SDK (rewardedBreak replaces the fake ad), remove sandbox and testing links.

## Feel test log
- v1–v5.8 core → World 1; v5.9–5.24 radar, collapse, cards; v6.0 Worlds 2–5; v6.1 economy/store.
- v6.2–v6.6: NO MORE LIVES; graduation card; iPhone audio recovery; dev controls overlay; ALL PERFECT!; input-type hints; result skip fix. Details in `docs/next-build.md`.
- **v6.7:** reward track by level; radar zone marker; fewer end sounds; one icon per meaning; clear fail screen; only 3 lives count; world-end next-world row + unlock animation; grid earned stars only.

## Parking lot
- Human play-test of Worlds 2–5. Per-world visual themes. HALO/spy art pass. Shareable result image. Shorten collapse. Maybe "?" replays seen feature cards. Heavy divers later. Pick a final name.
