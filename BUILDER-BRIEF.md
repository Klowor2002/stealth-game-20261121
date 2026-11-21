# best-stealth-game-20261121-1759 — BUILDER BRIEF (dispatch 2026-11-22 ~01:10 WIB, $0, no quota spent yet)

## ⛔ THIS IS A FRESH POST-OPEN SESSION — YOU ARE THE BUILDER
- Competition **opened 2026-11-21T17:59:00Z (00:59 WIB 22 Nov)** — your session starts AFTER the opening, which is exactly what `thinking_in_window` needs: EVERY transcript timestamp must be ≥ opening (60s skew). **Do not use or import any pre-open session, file, or transcript.**
- Deadline **2026-11-22T05:59:00Z (12:59 WIB 22 Nov)** — ~11.5h left. Result due 2026-12-06T17:59Z.
- `repo_created_after_open`: the GitHub repo must be created AFTER the opening (create it now, in this session).
- Quota (fresh, parent-checked 01:0x WIB): per-comp day cap **5, taken 0, left 5**; hard limit 40, left 40; can_submit true. The parent submits; a refusal for a repo/readme/about fix costs NO quota, a refused entry costs 1 — so get the repo + README + About right BEFORE the parent submits.

## THE COMPETITION (verified from kit RULES.txt + requirements)
- **$50, top 10 share: 1st $12, 2nd $8, 3rd $6, 4th $5, 5th $4, 6th–10th $3.** Escrow funded ($50 USDC on Solana). program/v1.
- **Judging: an AI judge compares entries pairwise, mostly by SCREENSHOTS** (one contact sheet: your cover screenshot large on top, the rest small beneath) **plus a short outline of your source** (file paths, sizes, first declarations — the judge never reads the whole code). Win rate by Bradley-Terry over the final heat; top 40 dev-board entrants go to the final.
- Judge criteria, most important first:
  1. **A complete stealth game, shown in its screenshots**: a level seen from above or the side, **guards with vision cones, cover to hide behind, and an exit to reach unseen**. Not a playable game = loses.
  2. **Fun and depth**: patrols you can learn, routes that reward patience, a detection system that gives you a chance to recover.
  3. **Feel and polish**: a cone that reacts as you expect, a near miss that raises the alarm, footsteps that tell you where a guard is.
  4. **Look and originality**: cover you can read at a glance, guards visible against the floor, lighting that shows what is safe. Original names/art/music — copying a commercial game loses.
  5. **Structure**: source split into files with one clear job each, named for what they do.
- Dev heat: every valid entry is judged against 4 fixed house games as it arrives; provisional rate shows at once.

## WHAT TO BUILD — WIN MODE (Rendi's order: build TO WIN, not to participate)
A **top-down 2D canvas stealth game, fully original** (own name, art, sounds, level). Suggested concept (make it your own, or a better one you design): a night courier slipping through a guarded archive/museum — collect the intel, reach the exit unseen.
- **Must show in screenshots**: top-down level, guards with **visible vision cones** (cone colour shifts with alert state), **cover** (crates, bushes/shadow patches, walls), **exit** (marked door/zone).
- **Must play**: WASD/arrows to move, Shift to sneak (slower, quieter), mouse or keys to interact; guards patrol waypoints, cones sweep; **detection meter** that fills when seen and drains when hidden (recovery chance); alert states patrol → suspicious → alerted → search; being caught = lose a life / restart from checkpoint, not instant unfair death; win by reaching the exit (optionally after collecting 2–3 intel items); HUD (objective, alert level, lives/time); title screen, pause, win/lose screens, restart.
- **Feel**: guard footsteps (synthesised WebAudio blips, louder when near), cone edge glow, near-miss "!" flash, light/darkness — a light radius around the player, shadow zones that hide you; smooth movement, no jank.
- **Look**: dark floor with readable contrast, guards clearly visible against it, cover readable at a glance, a cover screenshot that sells the game at thumbnail size.
- **Sound**: synthesised in-browser only (WebAudio, no files, no network). No external assets at all — everything procedural, every file under game/.
- **Structure for the judge's outline**: split source into files with one clear job each, named for what they do, e.g. `game/src/world.js` (level/tiles), `game/src/guard.js` (patrol + vision cones + alert states), `game/src/player.js` (movement/sneak), `game/src/render.js` (canvas + lighting), `game/src/audio.js` (synthesised footsteps/alarms), `game/src/main.js` (loop + states), `game/src/shots.js` (deterministic screenshot states), `game/src/config.js`, `game/src/input.js`, `game/src/random.js` (seeded). Keep each file focused; name functions for what they do.
- **Deterministic screenshots**: implement `?shot=<name>&seed=<n>` states in the game (like the kit starter's `shots.json`: `1-start`, `2-play`, `3-end`) so screenshots are reproducible renders of the game's own code. Take **4 screenshots, 1280×720**: (1) COVER — full level overview: player at start, guards + cones, cover, exit all readable; (2) mid-play sneak — player behind cover with a cone sweeping close; (3) near-miss/alert — guard alerted (red cone, "!" ), player escaping into shadow; (4) win — player at the exit / exit reached. First by name is the cover: name them `1-start.jpg`, `2-sneak.jpg`, `3-alert.jpg`, `4-exit.jpg`.
- **Variants (WIN MODE)**: build at least 2 variants or iterate against the local checks until the result stops improving — e.g. V1: full game, play-test it yourself in headless Chrome (move, get spotted, recover, win); V2: improve what play-testing shows is weakest (cone readability, cover placement, difficulty, screenshot composition). Ship the strongest. Do NOT ship the starter unchanged — the starter's dossier is byte-for-byte house game #2 and plays as that game.

## LAYOUT (repo = this entry dir; the kit starter shows the shape — READ it for layout only)
- Kit (already downloaded by parent): `~/workspace/makefun/kit-best-stealth-game-20261121-1759/best-stealth-game-20261121-1759-kit/best-stealth-game-20261121-1759-kit/` — read `RULES.txt`, `starter/main.ts`, `starter/game/index.html`, `starter/game/src/*.js`, `starter/serve.ts`, `starter/shots.json`, `starter/vendor/makefun-game.ts`.
- Repo layout (work in `~/workspace/makefun/entries/best-stealth-game-20261121-1759/`, git init HERE):
  - `main.ts` (root, Node 22, stdlib only — copies `game/` + `screenshots/` to `/output`, writes `/output/dossier.json` via `buildDossier` from `./vendor/makefun-game.ts`; follow the starter's main.ts shape but **write it fresh in this session**)
  - `vendor/makefun-game.ts` — copy from the kit **unchanged** (the gate rebuilds the dossier with the same library and compares byte for byte)
  - `game/` — `index.html` + all files it loads under `game/` (ES modules, no network, no external URLs; `data:` URIs allowed; a vendored library, if any, as `*.min.js` under `game/vendor/`)
  - `screenshots/` — 3 or 4 PNG/JPEG, real renders of the game's own code in a browser, never edited/composited/borrowed; each ≤256 KiB
  - `LICENSE` — MIT (copy the kit starter's LICENSE byte-identical)
  - `serve.ts` — copy the starter's serve script (or write your own tiny static server; it only serves locally)
  - `shots.json` — the 4 screenshot states
  - `README.md` — from the requirements template, with the THREE live badges and owner/repo filled (see below)
  - `.makefun/owner.json` — `{"wallet":"3eEPeXfgtDnXkdnbVfNNZuMkBe3p5yuKCd4AU9vMjKSu"}`
- **README template** (fill `{repo}` = `stealth-game-20261121`, `{owner}` = `Klowor2002`):
  ```
  # stealth-game-20261121

  [![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
  [![rank](https://make.fun/badge/best-stealth-game-20261121-1759/Klowor2002/stealth-game-20261121/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
  [![reward](https://make.fun/badge/best-stealth-game-20261121-1759/Klowor2002/stealth-game-20261121/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

  {description of the game — own words}

  ## Run it

  ```sh
  node serve.ts
  ```

  ---

  <sub>Entered on [make.fun](https://make.fun/?ref={referral_code}&utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759) · AI agents build software for cash rewards</sub>
  ```
  (If the referral code is unknown, omit the `?ref=` part — never invent one. The `{description}` and `{run}` placeholders must be replaced with real text; no `{...}` may remain.)
- **Repo About** (set BEFORE the parent submits — do it right after creating the repo):
  `gh repo edit Klowor2002/stealth-game-20261121 --description '<one-line summary> Built by an AI agent for make.fun'"'"'s “Make the best stealth game” bounty, $50 in USDC.' --homepage 'https://make.fun/bounty/best-stealth-game-20261121-1759' --add-topic 'makefun,ai-agents,bounties,games'`
  (watch the quoting — the `'` in `make.fun's` must survive; test with `gh repo view` afterwards.)

## PROCEDURE
1. Create the GitHub repo **Klowor2002/stealth-game-20261121** (public, MIT) with `gh` (already logged in as Klowor2002) — created AFTER the opening, in this session. Set the About line above. Verify with `gh repo view`.
2. Read the kit starter for layout. Write the game **fresh in this session** — every counted line authored by your own Write/Edit calls. **NEVER copy files from `entries/best-game-01/` or any other entry, and never copy the starter's game files in** (the starter's lines are excluded from the authored count, and copying another entry's files fails `thinking_own_work` Tier 1). Reading the starter/best-game-01 for layout reference is fine; the code you ship must be typed by you here.
3. Write → run → revise: **thinking_revised REQUIRES some counted file (main.ts or the code it runs) to take its final content from ≥2 assistant messages that write/edit it** — write the files, run the game, then make a GENUINE Edit improvement (fix something real you found by playing it), re-verify, and only then commit. A file written once and never revised = rejected.
4. Play-test in a real browser: serve with `node serve.ts` (or a static server), open in headless Chrome, screenshot the 4 states, and actually PLAY it (move, sneak, get spotted, recover, reach the exit). Check the console for errors. Screenshots must be 1280×720 real renders, each ≤256 KiB (use JPEG quality ~80 if needed).
5. Local gate BEFORE commit: `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts` — must exit 0 and write `out/dossier.json` + `out/game/` + `out/screenshots/`. Run it TWICE into two dirs and diff — outputs must be byte-identical (determinism). Caps: game/ ≤993 files / 48 MiB total, index.html ≤1 MiB, screenshots ≤4 files.
6. Commit + push from inside this session. Record the 40-char commit SHA.
7. **DO NOT bundle, DO NOT submit** — the parent does that (usage rows + bundle + kit check + submit). Your job ends at a committed, pushed, locally-verified repo.

## REPORT BACK (to the parent, when done)
Repo URL, commit SHA, entry title (public name — name what the game does, ≤200 chars, no handle/repo/secret), one-line description, the 4 screenshot names, which variant shipped and what play-testing changed, local verification results (main.ts runs ×2 byte-identical? screenshots real renders? console errors?), and your session id + session file path.

## HARD LIMITS
$0 spend · never read or print `~/workspace/makefun/api-key.json` or `~/workspace/makefun/makefun-keypair.json` (parent-only, scripts read them in-process) · no Google sign-in · no competition comments · no external helpers writing entry code · no network requests from the game · the wallet address above is the ONLY credential-adjacent value you need, and it is a public payout address, not a secret.
