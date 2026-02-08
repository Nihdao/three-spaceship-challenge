# Story 2.9: Projectile Size & Spawn Offset

Status: done

## Story

As a player,
I want my projectiles to be significantly larger and visually imposing, and to appear from below/in front of my ship rather than from its center,
So that my shots feel powerful and the firing looks natural regardless of which ship model is used.

## Acceptance Criteria

1. **Given** the player's ship is auto-firing **When** a projectile spawns **Then** the projectile is drastically larger than the current scale ([0.15, 0.15, 0.6]) while preserving its elongated beam shape **And** the collision radius is increased proportionally to match the new visual size

2. **Given** a projectile spawns **When** it appears on screen **Then** it originates from below the ship model (negative Y offset) rather than from the ship's center **And** the spawn offset is ship-model-agnostic (works for any ship size without reconfiguration) **And** it gives the visual impression that the projectile emerges from the front/underside of the ship

## Tasks / Subtasks

- [x] Task 1: Increase projectile visual size and hitbox (AC: #1)
  - [x] 1.1: Increase `projectileMeshScale` in `weaponDefs.js` for LASER_FRONT to [0.75, 0.75, 3.0] (5x original) while keeping the elongated beam proportions
  - [x] 1.2: Increase `projectileRadius` in `weaponDefs.js` to 1.5 (= beam half-length 3.0/2, maintaining original ratio) proportionally to new visual size

- [x] Task 2: Spawn projectile below/in front of ship (AC: #2)
  - [x] 2.1: Add `PROJECTILE_SPAWN_Y_OFFSET` to `gameConfig.js` (negative value, e.g., -0.5 to spawn below ship)
  - [x] 2.2: Add `PROJECTILE_SPAWN_FORWARD_OFFSET` to `gameConfig.js` (positive value to push spawn point forward in ship's facing direction, e.g., 2.0-3.0)
  - [x] 2.3: Update `useWeapons.jsx` tick() to apply forward offset along ship's facing direction when computing spawn x/z, and store the Y offset on the projectile
  - [x] 2.4: Update `ProjectileRenderer.jsx` to use projectile's Y value instead of hardcoded `0.5`

- [x] Task 3: Verification (AC: #1, #2)
  - [x] 3.1: Verify projectile is visually much larger but keeps beam shape
  - [x] 3.2: Verify projectile hitbox matches visual size (no "phantom hits" or "visual misses")
  - [x] 3.3: Verify projectile spawns below/in front of ship — no visible pop-in from center
  - [x] 3.4: All existing tests pass — no regressions

## Dev Notes

### Problem Analysis

Current projectile is nearly invisible at gameplay zoom level:
- `projectileMeshScale: [0.15, 0.15, 0.6]` on a `BoxGeometry(1,1,1)` — actual world size is 0.15 x 0.15 x 0.6 units
- `projectileRadius: 0.3` — tiny collision area
- Spawns at exact player center (`playerPosition[0], playerPosition[2]`) with Y hardcoded to `0.5` in renderer

The projectile appears to pop out of the middle of the ship model, which looks unnatural.

### Approach

1. **Scale**: Increase `projectileMeshScale` significantly (e.g., 3-5x) while keeping the elongated [narrow, narrow, long] ratio. Increase `projectileRadius` proportionally.

2. **Spawn offset**: Add two config values:
   - `PROJECTILE_SPAWN_Y_OFFSET`: Negative Y to place the projectile below the ship model plane. Ship-model-agnostic because it uses absolute Y, not relative to ship geometry.
   - `PROJECTILE_SPAWN_FORWARD_OFFSET`: Distance forward along ship's facing direction (`sin(rotation)` / `-cos(rotation)`) so the projectile appears to come from the nose, not center.

   In `useWeapons.jsx`, compute spawn position as:
   ```
   x: playerPosition[0] + Math.sin(playerRotation) * FORWARD_OFFSET
   z: playerPosition[2] - Math.cos(playerRotation) * FORWARD_OFFSET
   y: PROJECTILE_SPAWN_Y_OFFSET
   ```

   In `ProjectileRenderer.jsx`, use the projectile's stored Y instead of hardcoded `0.5`.

### Current Values

| Config | Current | Notes |
|--------|:---:|:---:|
| projectileMeshScale | [0.15, 0.15, 0.6] | in weaponDefs.js LASER_FRONT |
| projectileRadius | 0.3 | in weaponDefs.js LASER_FRONT |
| PROJECTILE_COLLISION_RADIUS | 0.3 | default in gameConfig.js |
| Projectile Y position | 0.5 (hardcoded) | in ProjectileRenderer.jsx:44 |
| Spawn position | player center | in useWeapons.jsx:42-43 |

### Files to modify

- `src/entities/weaponDefs.js` — projectileMeshScale, projectileRadius
- `src/config/gameConfig.js` — PROJECTILE_SPAWN_Y_OFFSET, PROJECTILE_SPAWN_FORWARD_OFFSET, possibly PROJECTILE_COLLISION_RADIUS
- `src/stores/useWeapons.jsx` — spawn position with forward offset and Y
- `src/renderers/ProjectileRenderer.jsx` — use projectile Y instead of hardcoded 0.5

### Files NOT to modify

- `src/stores/usePlayer.jsx` — no player changes
- `src/systems/collisionSystem.js` — already uses per-projectile radius, no changes needed

### References

- [Source: src/entities/weaponDefs.js:13] — projectileMeshScale: [0.15, 0.15, 0.6]
- [Source: src/entities/weaponDefs.js:10] — projectileRadius: 0.3
- [Source: src/stores/useWeapons.jsx:42-43] — Spawn at playerPosition center
- [Source: src/renderers/ProjectileRenderer.jsx:44] — Hardcoded Y=0.5

## Dev Agent Record

### Implementation Notes

- **Task 1 — Scale**: Increased `projectileMeshScale` from `[0.15, 0.15, 0.6]` to `[0.75, 0.75, 3.0]` (5x), preserving the elongated beam ratio. `projectileRadius` increased from `0.3` to `1.5` (= beam half-length 3.0/2, maintaining original ratio where radius = half-length). Removed unused `PROJECTILE_COLLISION_RADIUS` from `gameConfig.js` (dead config — collision system uses per-projectile radius from weaponDefs).
- **Task 2 — Spawn offset**: Added `PROJECTILE_SPAWN_Y_OFFSET: -0.5` and `PROJECTILE_SPAWN_FORWARD_OFFSET: 2.5` to `gameConfig.js`. Modified `useWeapons.jsx` to compute spawn x/z with forward offset along ship's facing direction (`dirX * fwd`, `dirZ * fwd`) and store `y` on the projectile. Updated `ProjectileRenderer.jsx` to use `p.y ?? 0.5` (fallback for backwards compat with any existing projectiles without y).
- **Tests**: Updated the existing position test to account for forward offset. Added 2 new tests: Y offset from config, forward offset with PI/2 rotation. All 137 tests pass (19 in useWeapons alone).

### Completion Notes

All 3 tasks and 10 subtasks completed. Both acceptance criteria satisfied:
- AC#1: Projectile is 5x larger visually (all axes) with proportional hitbox (radius 1.5 = beam half-length, matching original ratio)
- AC#2: Projectile spawns from below (Y=-0.5) and forward (2.5 units along facing direction) — ship-model-agnostic

## File List

- `src/entities/weaponDefs.js` — modified (projectileMeshScale, projectileRadius)
- `src/config/gameConfig.js` — modified (added PROJECTILE_SPAWN_Y_OFFSET, PROJECTILE_SPAWN_FORWARD_OFFSET; removed unused PROJECTILE_COLLISION_RADIUS)
- `src/stores/useWeapons.jsx` — modified (spawn position with forward offset and y property)
- `src/renderers/ProjectileRenderer.jsx` — modified (use p.y instead of hardcoded 0.5)
- `src/stores/__tests__/useWeapons.test.js` — modified (updated position test, added 2 new tests for spawn offsets)

## Change Log

- 2026-02-08: Implemented Story 2.9 — increased projectile visual size from [0.15, 0.15, 0.6] to [0.75, 0.75, 3.0] (5x), collision radius from 0.3 to 1.5 (proportional: beam half-length), and added configurable spawn Y offset (-0.5) and forward offset (2.5) for natural projectile emergence from ship front/underside
- 2026-02-08: Code review fixes — corrected projectileRadius to 1.5 (proportional to 5x scale), removed dead PROJECTILE_COLLISION_RADIUS config, fixed inaccurate "~3.3x" claim to "5x"
