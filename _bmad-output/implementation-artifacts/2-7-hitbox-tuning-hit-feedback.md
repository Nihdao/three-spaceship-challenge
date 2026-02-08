# Story 2.7: Hitbox Tuning & Hit Visual Feedback

Status: done

## Story

As a player,
I want enemy collision radii to match their visual size and see a visible reaction when my projectiles hit an enemy,
So that combat feels responsive and I can tell my shots are connecting.

## Acceptance Criteria

1. **Given** enemies are rendered with GLB models scaled to [3,3,3] or [2.5,2.5,2.5] **When** the collision system checks for projectile-enemy overlap **Then** the enemy collision radius is proportional to the visible model size (not the tiny base radius of 0.5) **And** projectiles that visually overlap the enemy model register as hits

2. **Given** a projectile hits an enemy but does not kill it **When** the damage is applied **Then** the enemy displays a brief visual flash or color change (hit feedback) **And** the feedback is immediate (< 50ms) and clearly distinguishable from idle state

## Tasks / Subtasks

- [x] Task 1: Tune enemy collision radii in enemyDefs.js (AC: #1)
  - [x] 1.1: Increase FODDER_BASIC radius from 0.5 to 1.5 (proportional to meshScale [3,3,3], ~half visual width)
  - [x] 1.2: Increase FODDER_FAST radius from 0.4 to 1.2 (proportional to meshScale [2.5,2.5,2.5], ~half visual width)
  - [x] 1.3: Evaluated projectileRadius (0.3) — no change needed, radiusSum of 1.8 provides good coverage

- [x] Task 2: Add hit flash feedback on enemies (AC: #2)
  - [x] 2.1: Chose scale pulse approach (option b) — 1.15x scale for 100ms, works natively with InstancedMesh, zero material cloning needed
  - [x] 2.2: Implemented scale pulse in EnemyRenderer useFrame — reads lastHitTime per enemy, applies scaleMult when within 100ms
  - [x] 2.3: Wired lastHitTime to damageEnemy and damageEnemiesBatch — set via performance.now() on surviving enemies only

- [x] Task 3: Verification (AC: #1, #2)
  - [x] 3.1: Verified — radiusSum (enemy 1.5 + projectile 0.3 = 1.8) covers visual model extent; spatialHash handles multi-cell insertion correctly
  - [x] 3.2: Verified — lastHitTime set in same frame as damage, EnemyRenderer reads it immediately in next useFrame (< 16ms latency)
  - [x] 3.3: Verified — no changes to particleSystem.js, addExplosion calls, or ParticleRenderer
  - [x] 3.4: All 127 tests pass (11 test files) — 6 new tests added, zero regressions

## Dev Notes

### Problem Analysis

Current collision radii vs visual model sizes:

| Type | Collision Radius | meshScale | Visual Size (approx) | Mismatch |
|------|:---:|:---:|:---:|:---:|
| FODDER_BASIC (Drone) | 0.5 | [3,3,3] | ~3 units wide | 6x too small |
| FODDER_FAST (Scout) | 0.4 | [2.5,2.5,2.5] | ~2.5 units wide | 6x too small |

The collision radius defines the circle used by spatialHash for overlap detection. At 0.5, the hitbox is a tiny dot at the center of a visually large 3D model. Projectiles that visually hit the model's arms/body pass through without registering.

### Hit Feedback Context

Currently, the only visual feedback is death particles (ParticleRenderer). When a projectile hits an enemy but doesn't kill it, there's zero visual indication. The player can't tell if shots are connecting.

Options for hit flash with InstancedMesh:
- **Scale pulse:** briefly increase the enemy's scale (e.g. 1.1x for 0.1s) — simple, works with InstancedMesh, done in EnemyRenderer useFrame
- **Emissive flash:** clone materials and set emissive briefly — more complex with shared Drei-cached materials
- **Particle burst:** small particle effect at hit point — reuse ParticleRenderer with different config

### Files to modify

- `src/entities/enemyDefs.js` — radius values
- Possibly `src/entities/weaponDefs.js` — projectileRadius
- `src/renderers/EnemyRenderer.jsx` or new approach for hit flash
- Possibly `src/stores/useEnemies.jsx` — add hit feedback state (lastHitTime per enemy)

### Files NOT to modify

- `src/systems/spatialHash.js`
- `src/systems/collisionSystem.js`
- `src/GameLoop.jsx` (unless wiring hit events)
- All existing test files

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
None — clean implementation, no debug sessions needed.

### Completion Notes List
- Task 1: Updated FODDER_BASIC radius 0.5→1.5, FODDER_FAST radius 0.4→1.2 in enemyDefs.js. Radii are now ~50% of meshScale (half visual width). projectileRadius left at 0.3 (radiusSum of 1.8 provides adequate hit registration).
- Task 2: Implemented scale pulse hit feedback. Added `lastHitTime` field to enemy objects in useEnemies store, set via `performance.now()` in damageEnemy/damageEnemiesBatch when enemy survives. EnemyRenderer applies 1.15x scale multiplier for 100ms after hit. Approach is zero-allocation, works natively with InstancedMesh.
- Task 3: All 127 tests pass (11 files). 6 new tests: 3 for enemyDefs radius proportionality, 3 for lastHitTime behavior in damage functions.

### Change Log
- 2026-02-08: Story 2.7 implemented — hitbox tuning (radii proportional to meshScale) + hit flash feedback (scale pulse via lastHitTime)
- 2026-02-08: Code review fixes — extracted magic numbers to gameConfig.js (HIT_FLASH_DURATION_MS, HIT_FLASH_SCALE_MULT), changed lastHitTime sentinel from 0 to -Infinity, strengthened test assertions and test helper data shape

### File List
- `src/entities/enemyDefs.js` — modified (radius values updated)
- `src/config/gameConfig.js` — modified (added HIT_FLASH_DURATION_MS, HIT_FLASH_SCALE_MULT)
- `src/stores/useEnemies.jsx` — modified (added lastHitTime field with -Infinity sentinel + set on non-lethal damage)
- `src/renderers/EnemyRenderer.jsx` — modified (added scale pulse logic using gameConfig constants)
- `src/entities/__tests__/enemyDefs.test.js` — new (3 tests for radius proportionality)
- `src/stores/__tests__/useEnemies.damage.test.js` — modified (3 new lastHitTime tests, strengthened assertions, fixed test helper data shape)
