# Story 45.1: Enemy Hitbox Enlargement (+30%)

Status: done

## Story

As a player,
I want enemy hitboxes to be larger,
So that I can hit enemies reliably and feel powerful from the start of the run.

## Acceptance Criteria

1. **Given** `src/entities/enemyDefs.js` **When** the enemy definitions are opened **Then** the `radius` fields of all non-boss enemies are multiplied by 1.3 and rounded to 2 decimal places:

   | typeId | radius before | radius after |
   |---|---|---|
   | `FODDER_BASIC` | 1.5 | 2.0 |
   | `FODDER_TANK` | 2.0 | 2.6 |
   | `FODDER_SWARM` | 0.75 | 1.0 |
   | `SHOCKWAVE_BLOB` | 2.5 | 3.25 |
   | `SNIPER_MOBILE` | 1.5 | 2.0 |
   | `SNIPER_FIXED` | 1.5 | 2.0 |
   | `TELEPORTER` | 1.25 | 1.6 |

2. **Given** `BOSS_SENTINEL` and `BOSS_SPACESHIP` in `enemyDefs.js` **When** the bosses are defined **Then** their `radius` values are **not** modified — `BOSS_SENTINEL` uses `GAME_CONFIG.BOSS_COLLISION_RADIUS` (5.0) and `BOSS_SPACESHIP` uses `3.0`, both unchanged.

3. **Given** the collision system in `GameLoop.jsx` **When** projectiles test enemy collisions **Then** they use the `radius` field from `ENEMIES[typeId]` (or `e.radius` in the enemy pool) — confirm this field is read directly from `enemyDefs.js` so the change propagates automatically without modifying any other file.

4. **Given** `vitest run` **When** the story is implemented **Then** all existing tests pass — check whether any tests hardcode `radius: 1.5`, `radius: 0.75`, `radius: 2.5`, `radius: 1.25` etc. and update them if needed.

## Tasks / Subtasks

- [x] Task 1 — Update 7 radius values in enemyDefs.js (AC: #1)
  - [x] FODDER_BASIC: 1.5 → 2.0
  - [x] FODDER_TANK: 2.0 → 2.6
  - [x] FODDER_SWARM: 0.75 → 1.0
  - [x] SHOCKWAVE_BLOB: 2.5 → 3.25
  - [x] SNIPER_MOBILE: 1.5 → 2.0
  - [x] SNIPER_FIXED: 1.5 → 2.0
  - [x] TELEPORTER: 1.25 → 1.6
- [x] Task 2 — Verify boss radii are untouched (AC: #2)
  - [x] BOSS_SENTINEL.radius still references `GAME_CONFIG.BOSS_COLLISION_RADIUS`
  - [x] BOSS_SPACESHIP.radius still `3.0`
- [x] Task 3 — Verify propagation path (AC: #3)
  - [x] In `useEnemies.jsx`, confirm `enemy.radius = def.radius` (or equivalent) is set at spawn — if yes, no other file needs editing
  - [x] In `GameLoop.jsx`, confirm collision uses `e.radius` from the pool object, not a hardcoded constant
- [x] Task 4 — Run vitest and fix any test breakage (AC: #4)
  - [x] `grep -r "radius: 1.5\|radius: 0.75\|radius: 2.5\|radius: 1.25" src/` to find hardcoded test values
  - [x] Update any test that hardcodes old radius values to use new values

## Dev Notes

### Architecture Context

This is a pure **Config/Data layer** change. The 6-layer architecture of this project is:

```
Config/Data (enemyDefs.js, gameConfig.js)  ← THIS STORY IS HERE
  → Systems (collision, spawn)
    → Stores (useEnemies, useGame)
      → GameLoop (GameLoop.jsx)
        → Rendering (EnemyRenderer)
          → UI (HUD)
```

The `radius` field in `enemyDefs.js` propagates to the enemy pool at spawn time via `useEnemies.jsx`. The GameLoop then reads `e.radius` from the pool for projectile collision. **No other layer needs to change.**

### File to Modify

**Only one file should need editing**: `src/entities/enemyDefs.js`

Current confirmed values in `enemyDefs.js` (verified by reading the file):

```
FODDER_BASIC:   radius: 1.5  (line ~24)
FODDER_TANK:    radius: 2.0  (line ~42)
FODDER_SWARM:   radius: 0.75 (line ~60)
SHOCKWAVE_BLOB: radius: 2.5  (line ~78)
SNIPER_MOBILE:  radius: 1.5  (line ~99)
SNIPER_FIXED:   radius: 1.5  (line ~123)
TELEPORTER:     radius: 1.25 (line ~146)
```

Boss entries do NOT need touching:
- `BOSS_SENTINEL.radius: GAME_CONFIG.BOSS_COLLISION_RADIUS` — dynamic reference, unchanged
- `BOSS_SPACESHIP.radius: 3.0` — hardcoded, unchanged

### Propagation Chain to Verify

Before editing, confirm these two things by reading the source:

1. In `src/stores/useEnemies.jsx` (or wherever enemies are spawned): look for `enemy.radius = def.radius` or similar — this is the spawn-time copy from def to pool object.

2. In `src/game/GameLoop.jsx`: look for the projectile collision section — it should use `e.radius` from the pool enemy object, not a constant. The collision test is likely a distance check: `dist < projectile.radius + e.radius`.

If both confirmations pass, only `enemyDefs.js` needs editing. If `useEnemies.jsx` does NOT copy `radius` from def, then it may also need patching to add `enemy.radius = def.radius` — but this is unlikely given the current architecture.

### Test Risk Assessment

Run before implementing:
```sh
grep -rn "radius: 1.5\|radius: 0.75\|radius: 2.5\|radius: 1.25\|radius: 2.0" src/
```

Tests that assert on specific enemy stats (HP, radius) directly from `ENEMIES[typeId]` will auto-update since they import from `enemyDefs.js`. Tests that hardcode expected radius values as literals in assertions will break and need updating.

From the Epic 45 context: "les tests de collision utilisent des valeurs hardcodées ou les valeurs de enemyDefs.js" — if they import from `enemyDefs.js`, no test update needed. If any test has `expect(enemy.radius).toBe(1.5)` with a literal, update it to `2.0`.

### Project Structure Notes

- Enemy definitions live in `src/entities/enemyDefs.js` — pure JS object export, no framework dependencies
- This file is imported by `useEnemies.jsx` (spawn) and possibly `EnemyRenderer.jsx` (display)
- The `ENEMIES` export is the single source of truth for all enemy stat values
- `BOSS_SENTINEL` and `BOSS_SPACESHIP` are in the same file but use `GAME_CONFIG` references for their key combat values — they should remain untouched

### References

- Epic 45 definition: `_bmad-output/planning-artifacts/epic-45-player-experience-polish.md#Story 45.1`
- Enemy definitions source: `src/entities/enemyDefs.js` (read and confirmed current values)
- Architecture pattern: [Source: project-context.md — 6-layer architecture, Config/Data layer]
- Collision system context from epic: "la résolution de collision projectile→ennemi utilise ces valeurs directement"

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- Pure Config/Data layer change — only `src/entities/enemyDefs.js` modified.
- Propagation confirmed: `useEnemies.jsx` lines 81 & 150 copy `radius: def.radius` at spawn; `GameLoop.jsx` line 558 uses `proj.radius + en.radius` for collision — no other file needed.
- Boss radii untouched: `BOSS_SENTINEL` uses `GAME_CONFIG.BOSS_COLLISION_RADIUS`, `BOSS_SPACESHIP` keeps `3.0`.
- 7 hardcoded test assertions in `enemyDefs.test.js` updated to new values — 25 tests pass in `enemyDefs.test.js` (includes 2 new boss radii assertions added during code review).
- `BOSS_SPACESHIP` added to `expectedTypes` array (pre-existing gap since story 22.4); AC#2 boss radii coverage added: `BOSS_SENTINEL.radius === 5.0` and `BOSS_SPACESHIP.radius === 3.0`.
- Pre-existing test failures (13 files) confirmed unrelated to this story; `usePlayer.shipIntegration` flaky in full-suite due to Zustand store isolation issue (passes standalone).

### File List

- `src/entities/enemyDefs.js` — updated 7 non-boss radius values (+30%)
- `src/entities/__tests__/enemyDefs.test.js` — updated 7 test assertions to match new radius values; added BOSS_SPACESHIP to expectedTypes (9 types); added AC#2 boss radii describe with 2 explicit assertions

## Change Log

- 2026-02-27: Story 45.1 implemented — enemy non-boss hitbox radii enlarged by ×1.3 (Config/Data layer only)
- 2026-02-27: Code review — 2 Medium fixed: BOSS_SPACESHIP.radius test added, BOSS_SPACESHIP added to expectedTypes; story status → done
