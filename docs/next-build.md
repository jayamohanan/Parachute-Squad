# Chute Rhythm — pending items for the next build

Bundle these into the next build and tell the user each one is included. After a build, move items to "Shipped" with what changed and how it was verified.

## Pending
(none)

## Shipped
- **After v6.7 (2026-11-02), version number unchanged:**
  1. Split `index.html` into `style.css` and `js/` (see "Code layout" in `CLAUDE.md`). No gameplay change. `npm test -- quick` gave the same 29 results before and after; the full run passed on the split, before the fix below.
  2. Fixed a v6.7 crash: the graduation card and sandbox result screen still used the removed `SYM` icon table, so finishing training showed no buttons. Non-perfect tiles on both now show 💔. Added checks for both screens; `npm test -- quick` passes 42 of 42. User to playtest.
- **v6.7 (2026-11-02):**
  1. Reward track tied to fixed levels: `REWARD_LV=[4,9,…,49]` (5th and 10th of each world); text "Unlocks at Level W-N"; bar = first wins since the previous reward level. `prog.rlv` = reward levels used (claimed or skipped); `trackDone` still points at the next TRACK item and skips owned ones. `trackProg` / `TRACK_STEP` removed.
  2. Radar intro card: "RADAR / ZONE" label + red double arrow spanning the zone on the right side (`zoneMarker()`).
  3. Same marker in the game world on radar levels, at screen x≈0.42W at the start; scrolls off before the first band.
  4. End sounds: the star chimes (C, E, G) are the win jingle; ALL PERFECT! = one warm chord (`SFX.chord`). All-perfect result went from ~22 tones to 14 (4 sounds).
  5. Diver strip: perfect = small open chute; any landing that cost a life = 💔; didn't count = grey dot.
  6. Fail: red "LEVEL FAILED", three 💔, red outline, Retry big. In game: red NO MORE LIVES / CAUGHT! banners; `SFX.fail()` with NO MORE LIVES (banner 1.5 s).
  7. After the last life nothing counts (`d.lost` set only while not failed) → fail strip shows exactly 3 💔. Caught shows 1 💔.
  8. World-end result: next-world row always shown; unlock animation after result animations when this run opens the world; Space works during it; gate ad at 20–24★.
  9. Level grid shows earned stars only.
  Verified with `tests/run.mjs quick` (29 checks pass).
- **v6.6 (2026-11-01):** leaving the result screen instantly ends everything from it (`rt()` / `leaveResult()` / `SFX.cutAll()`). Rule: all progress is saved the moment the result opens or a button is pressed — never at the end of an animation.
- v6.5: sun removed; training hint by input type; SPACE key on cards; Up arrow and W also jump.
- v6.4: ALL PERFECT! moment; gift-claim celebration. (Optional extras not built: gold mark on flawless levels in the grid; +25 coins first flawless run.)
- v6.3: how-to card polish.
- v6.2: NO MORE LIVES; reward-track carry-over; card band + hand column; training finish + graduation card; iPhone audio recovery (needs check on a real iPhone); dev controls ⚙ overlay.
