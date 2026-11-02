# Chute Rhythm — pending items for the next build

Bundle these into the next build and tell the user each one is included. After a build, move items to "Shipped" with what changed and how it was verified.

## Pending
(none)

## Shipped
- **After v6.7 (2026-11-02), version number unchanged:** result screen: Next level, Retry and Levels are now icon-only (triangle, circle arrow, 3×3 grid), and the main action is the wider button. (Fixed right after: the icons were missing on the fail screen, because their `big` class clashed with `.result.lost .big`; renamed to `lg`.) The World N button keeps its text, lock and star count. Every rewarded-ad button now starts with a TV icon instead of ▶. Not run; user to playtest.
- **After v6.7 (2026-11-02), version number unchanged:** level grid: every open level now shows three stars, with unearned ones grey (were earned stars only, centred), so anything short of 3★ is easy to spot. Locked levels show none. `tests/run.mjs` section 9 updated. Not run; user to playtest.
- **After v6.7 (2026-11-02), version number unchanged:** result screen: "or press Space" hint removed (Space still works); panel is now centred vertically and still scrolls when taller than the screen. Not run; user to playtest.
- **After v6.7 (2026-11-02), version number unchanged:** cards shrink to fit short screens (`fitCards()`), for Poki's inspector sizes and landscape phones; found in the inspector, where the how-to card's Start was off screen at its default size. The store and result screens still scroll. New `tests/run.mjs` section 12 checks cards at the Poki sizes. User to check how-to readability on Poki and play one level at the default size.
- **After v6.7 (2026-11-02), version number unchanged:** reward claim: a claimed item is still equipped straight away, with a new "Keep old" button that puts back the previous item; the new one stays owned in the Store. The card now stays up 4 s instead of 1.9 s. Not run; user to playtest.
- **After v6.7 (2026-11-02), version number unchanged:** radar intro card title is now "Skip radar zone" (was "Radar ahead!"). Not run; user to playtest.
- **After v6.7 (2026-11-02), version number unchanged:** radar intro card: left to right now reads free-falling diver, caught diver, safe diver, with a diagonal arrow from the falling diver to the safe one, passing under the caught diver. Not run; user to playtest.
- **After v6.7 (2026-11-02), version number unchanged:** level screen: the next-world row pulses gold once that world is open, until the player earns a star there; tapping an open row now goes to that world. Also fixed the locked-row shake replaying when the screen redraws. Not run; user to playtest.
- **After v6.7 (2026-11-02), version number unchanged:** radar zone marker: yellow danger triangle above the "RADAR ZONE" label, in the levels and on the radar intro card (same drawing). Not run; user to playtest.
- **After v6.7 (2026-11-02), version number unchanged:** level screen: tapping the locked next-world row now shakes the lock, flashes the star count gold and plays a clonk (it did nothing before). Not run; user to playtest.
- **After v6.7 (2026-11-02), version number unchanged:** how-to card: too early and too late now show a red X, perfect a green tick (were 💔 and ★); all three sit just left of the diver. Not run; user to playtest.
- **After v6.7 (2026-11-02), version number unchanged:** level screen trimmed: tagline and "Every miss costs…" hint removed; locked next world shows only "25/50★"; "Unlocked! Tap ›" text removed. Reset progress, Unlock all levels and +1000 coins moved into the dev ⚙ bar. Not run; user to playtest.
- **After v6.7 (2026-11-02), version number unchanged:** worlds now open on the running star total (25★, 50★, 75★, 100★) instead of 25★ per world, so extra stars carry. Gate ad is offered within 5★ of the gate. Added two checks; tests not run; user to playtest.
- **After v6.7 (2026-11-02), version number unchanged:** diver strip on the result screens: perfect is now a white tick instead of a small open chute. Not run; user to playtest.
- **After v6.7 (2026-11-02), version number unchanged:** world-end result: the long next-world row is replaced by a "World N" button in the "Next level" spot, with stars shown while locked. Locked tap opens a popup: "25★ needed", Levels (that world), Close, and the gate ad at 20–24★. Space follows the same button. Tests updated but not run; user to playtest.
- **After v6.7 (2026-11-02), version number unchanged:** levels are numbered globally across worlds (World 2 starts at Level 11) in the game, level grid, result screen and reward track. In play, the top-left text (stars, diver count, perfect streak) is gone; "Level N" sits top centre with the hearts below it, and training shows no label. Not run through the tests; user to playtest.
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
