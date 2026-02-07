# Story 2.6: Enemy Speed & Facing Tuning

Status: ready-for-dev

## Story

As a player,
I want enemies to approach at a slower, more readable pace and always visually face my ship,
So that combat feels fair and enemies appear to be "looking at" me as they chase.

## Acceptance Criteria

1. **Given** enemies are chasing the player **When** FODDER_BASIC (Drone) moves **Then** its speed is approximately 3x slower than the current value (speed ~17 instead of 50) **And** FODDER_FAST (Scout) speed is approximately 3x slower (speed ~30 instead of 90)

2. **Given** enemies are rendered with GLB models **When** the EnemyRenderer renders each frame **Then** each enemy's model visually faces toward the player ship (the robot's "face"/eye side points at the player) **And** the facing updates every frame as the player moves

## Tasks / Subtasks

- [ ] Task 1: Reduce enemy speeds in enemyDefs.js (AC: #1)
  - [ ] 1.1: Change FODDER_BASIC speed from 50 to 17
  - [ ] 1.2: Change FODDER_FAST speed from 90 to 30

- [ ] Task 2: Verify and fix enemy facing rotation in EnemyRenderer.jsx (AC: #2)
  - [ ] 2.1: Launch the game, visually inspect that the robot's face/eye is pointing toward the player ship from multiple angles. The Eye bone is at +Z relative to the Head — confirm whether the current `Math.atan2(dx, -dz) + Math.PI` offset correctly makes the face point at the player
  - [ ] 2.2: If facing is incorrect, adjust the rotation offset until the robot's eye/face visually points at the player. Try removing `+ Math.PI` or changing to `+ Math.PI/2` etc.
  - [ ] 2.3: Verify facing works from all directions (enemy approaching from left, right, top, bottom)

- [ ] Task 3: Verification (AC: #1, #2)
  - [ ] 3.1: Verify enemies approach at a noticeably slower pace — gameplay feels fair
  - [ ] 3.2: Verify enemies visually face the player at all times
  - [ ] 3.3: Verify existing tests still pass — no regressions

## Dev Notes

### Scope

**Config-only + rotation offset change.** No architectural changes.

**Files to modify:**
- `src/entities/enemyDefs.js` — speed values only
- `src/renderers/EnemyRenderer.jsx` — rotation offset on line 60 (if facing is wrong)

**Files NOT to modify:**
- Everything else — no store, system, or game logic changes

### Current Values

| Type | Current Speed | Target Speed |
|------|:---:|:---:|
| FODDER_BASIC (Drone) | 50 | ~17 |
| FODDER_FAST (Scout) | 90 | ~30 |

### Facing Rotation Context

Current rotation code in EnemyRenderer.jsx line 60:
```javascript
dummy.rotation.set(0, Math.atan2(dx, -dz) + Math.PI, 0)
```

The `+ Math.PI` was added in Story 2.5 assuming GLB models face +Z. This needs visual verification — the Eye bone is at +Z from Head, suggesting the face IS at +Z, but the baked world transforms may have altered the effective orientation. Test and adjust the offset empirically.

### References

- [Source: src/entities/enemyDefs.js] — Enemy speed values
- [Source: src/renderers/EnemyRenderer.jsx:60] — Facing rotation calculation

## Change Log

- 2026-02-07: Story created — speed tuning requested by user (enemies too fast), facing verification needed after Story 2.5 GLB integration.

## Dev Agent Record

### File List

**Modified files:**
- src/entities/enemyDefs.js
- src/renderers/EnemyRenderer.jsx (if rotation offset needs adjustment)
