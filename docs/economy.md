# Chute Rhythm — economy, store & cosmetics (v6.1, 2026-11-01; reward track and world gate updated v6.7, 2026-11-02)

Companion to `docs/design-brief.md`.

## Principles (agreed with user)
- **Coins come from play; ads only speed things up.** Everything is buyable with coins alone (Poki players may have ad blockers).
- **Cosmetics are visual only** — same size, same timing, must stay readable against sky and band.
- **No single ad buys anything big:** commons 1 ad, rares 3 ads (progress kept: "📺 1/3"), epic/legendary coins only.
- **Stars stay earned-only.** World gate ad unlocks the next world instead of adding stars (user picked this over "+3 stars").
- Rewarded ads follow Poki's rules: optional, clearly announced, reward only when the ad finishes. Prototype uses a fake 2 s ad overlay ("Close (no reward)" cancels) standing in for `PokiSDK.rewardedBreak`.

## Earning
| Source | Coins |
|---|---|
| Each **new** star (first time earned) | 20 (150★ total ≈ 3,000) |
| Finishing any level (replays too) | 10 |
| Perfect streak ≥ 5 in the level | +10 |
| Failed level | 0 |
| Result screen "📺 ×2" ad | doubles that level's coins |
| Store "📺 +100" ad | 100, cooldown 2 min |
- Skilled full run ≈ 4,000 coins without ads, ≈ 7,000 with doubles. Whole collection ≈ 2–3 runs. First buy (100) after ~2–3 levels.

## Prices
| | Common | Rare | Epic | Legendary |
|---|---|---|---|---|
| Chutes | 100 | 250 | 600 | 1,200 |
| Divers | 200 | 450 | 900 | 2,000 |
| Planes | — | 900 | 1,600 | 2,500 |
| Ad option | 1 ad | 3 ads | coins only | coins only |

## Items
- **Chutes (20):** Classic (starter, uses each diver's suit colour) · Common: Stripes, Polka dots, Checker, Two-tone, Sunset, Sky · Rare: Watermelon, Pizza, Camo, Flower, Leaf, Bubble · Epic: Jellyfish (tentacles instead of lines), Mushroom, Umbrella, Rainbow · Legendary: Hot-air balloon, Gold (sparkle), Diamond (facets + sparkle).
- **Divers (10):** Agent (starter) · Common: Ninja, Chef, Tourist · Rare: Robot, Granny, Astronaut · Epic: Chicken, Dino · Legendary: Gold agent.
- **Planes (5):** Classic (starter) · Rare: Biplane · Epic: Cargo jet, Blimp · Legendary: Stealth jet.
- Selected items apply everywhere: gameplay, collapse ending, intro cards. Dummies keep their yellow look.

## Reward track (silhouette) — v6.7
- Result screen (levels mode, passed only) shows the next reward as a dark silhouette that fills from the bottom, with **"Unlocks at Level N"** and a bar.
- Each reward belongs to a **fixed level**: the 5th and 10th level of every world (1-5, 1-10, 2-5 … 5-10; `REWARD_LV`). The bar fills with first wins since the previous reward level. The first time that level is won → reveal: "New plane: Biplane!" → **Claim** (1st reward free, then "📺 Claim" = 1 ad) or **No thanks** (item stays buyable in the Store; never lost).
- Order: Biplane, Watermelon chute, Robot, Cargo jet, Camo chute, Astronaut, Blimp, Jellyfish chute, Chicken, Stealth jet. If the next item is already owned (e.g. bought in the Store), that reward level gives the next unowned item instead. Claimed items are auto-selected.
- Why fixed levels (user, 2026-11-02): a level is a concrete goal; a count drifted from level numbers when a level was left unbeaten.
- Kept light for web: one small card, one tap to dismiss, no "lose it forever".

## World gate
- No automatic unlock: worlds open on the **running star total**: World 2 at 25★, World 3 at 50★, World 4 at 75★, World 5 at 100★, or by the gate ad. Stars are never spent, so extra stars count towards the next gate (user's choice, 2026-11-02; was 25★ per world).
- When the next world is locked and the player is **within 5★** of the gate, the world bar (level screen) and the popup from the world-end "World N" button show **"📺 Unlock now"** → one ad opens the next world (`prog.gate[w]`). Not offered further away.
- **World-end result screen (v6.7):** the last level of a world, when passed, always shows a "World N" button where "Next level" normally sits. If this run opens the world, the button first shows the old star count, then after the result animations the lock opens (UNLOCKED! stamp, confetti, sound) and it becomes "World N ▶". Locked, it opens a popup with the stars needed, Levels and Close. The unlock is saved immediately; the animation only shows it.

## UI
- Level screen: coin pill + **Store** button under the title. Store: Chutes / Divers / Planes tabs, 3-column cards (live thumbnail, name, tier colour, buy / ad-progress / Use / ✓ Using), "📺 +100" and Back.
- Testing links on the level screen: "Unlock all levels (testing)", "+1000 coins (testing)" — remove before release. Reset progress also wipes coins and cosmetics.

## Save data (in `chuteRhythm.v5.progress`)
`coins, own{chute,diver,plane}, sel{…}, adp{kind:id → ads watched}, wins, trackDone, rlv, gate{world}, adCoinsT`. (`trackProg` removed in v6.7.)

## Open / later
- Swap the fake ad for `PokiSDK.rewardedBreak` (+ `gameplayStop/Start`, mute during ads).
- Watch whether 20 chutes all read as distinct at small size; launch-with-12 fallback if not.
- Tune prices after real play data (time to first buy, % who buy a legendary).
