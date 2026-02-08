# Story 2.6: Enemy Speed & Facing Tuning

Status: done

## Story

As a player,
I want enemies to approach at a slower, more readable pace and always visually face my ship,
So that combat feels fair and enemies appear to be "looking at" me as they chase.

## Acceptance Criteria

1. **Given** enemies are chasing the player **When** FODDER_BASIC (Drone) moves **Then** its speed is approximately 3x slower than the current value (speed ~17 instead of 50) **And** FODDER_FAST (Scout) speed is approximately 3x slower (speed ~30 instead of 90)

2. **Given** enemies are rendered with GLB models **When** the EnemyRenderer renders each frame **Then** each enemy's model visually faces toward the player ship (the robot's "face"/eye side points at the player) **And** the facing updates every frame as the player moves

## Tasks / Subtasks

- [x] Task 1: Reduce enemy speeds in enemyDefs.js (AC: #1)
  - [x] 1.1: Change FODDER_BASIC speed from 50 to 17
  - [x] 1.2: Change FODDER_FAST speed from 90 to 30

- [x] Task 2: Verify and fix enemy facing rotation in EnemyRenderer.jsx (AC: #2)
  - [x] 2.1: Launch the game, visually inspect that the robot's face/eye is pointing toward the player ship from multiple angles. The Eye bone is at +Z relative to the Head — confirm whether the current `Math.atan2(dx, -dz) + Math.PI` offset correctly makes the face point at the player
  - [x] 2.2: If facing is incorrect, adjust the rotation offset until the robot's eye/face visually points at the player. Try removing `+ Math.PI` or changing to `+ Math.PI/2` etc.
  - [x] 2.3: Verify facing works from all directions (enemy approaching from left, right, top, bottom)

- [x] Task 3: Verification (AC: #1, #2)
  - [x] 3.1: Verify enemies approach at a noticeably slower pace — gameplay feels fair
  - [x] 3.2: Verify enemies visually face the player at all times
  - [x] 3.3: Verify existing tests still pass — no regressions

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

## Senior Developer Review (AI)

**Reviewed:** 2026-02-08
**Reviewer:** Adam (via adversarial code review workflow)

**AC Verification:**
- AC #1 (speed reduction): PASS — FODDER_BASIC 50→17, FODDER_FAST 90→30 confirmed in code
- AC #2 (enemy facing): PASS — rotation formula corrected to `Math.atan2(dx, dz)`, visually verified

**Issues Found & Resolved (6 fixed):**
- H1: Out-of-scope `modelKey` removal and `modelPath` rename in enemyDefs.js → Attributed to Story 2-5 File List
- H2: Out-of-scope `EnemyMeshErrorBoundary` in EnemyRenderer.jsx → Attributed to Story 2-5 File List
- H3: Mixed uncommitted changes from multiple stories → Documented; recommend separate commits (Story 2-5 fixes first, then Story 2-6)
- M1: Architecture drift (`modelKey` removed from enemy def pattern) → Updated architecture.md to use `modelPath` pattern
- M2: assetManifest.js modified but undocumented → Added to Story 2-5 File List
- M3: Broken `planet.glb` reference after Planet.glb deletion → Updated assetManifest.js to reference PlanetA/B/C.glb

**Commit Recommendation:**
The working tree contains uncommitted Story 2-5 code review fixes mixed with Story 2-6 changes. Commit in two stages:
1. Story 2-5 code review fixes: error boundary, GLB renames, modelKey removal, assetManifest paths
2. Story 2-6: speed values + rotation formula only

## Change Log

- 2026-02-07: Story created — speed tuning requested by user (enemies too fast), facing verification needed after Story 2.5 GLB integration.
- 2026-02-08: Implementation complete — enemy speeds reduced ~3x, facing rotation fixed by removing `-dz` negation and `+ Math.PI` offset. All 89 tests pass.
- 2026-02-08: Code review complete — 6 issues fixed (3 HIGH, 3 MEDIUM). Out-of-scope changes attributed to Story 2-5, architecture doc updated, broken asset reference fixed. Story approved.

## Dev Agent Record

### Implementation Notes

- **Speed tuning:** FODDER_BASIC 50→17, FODDER_FAST 90→30 (approx 3x reduction as specified)
- **Facing fix:** The original `Math.atan2(dx, -dz) + Math.PI` had two issues: the `-dz` negation inverted top/bottom facing, and `+ Math.PI` inverted left/right facing. The correct formula is `Math.atan2(dx, dz)` — the baked world transforms from `applyMatrix4(child.matrixWorld)` normalized the model orientation so no offset is needed.
- **Visual verification:** User confirmed correct facing from all 4 directions after fix.

### File List

**Modified files:**
- src/entities/enemyDefs.js — speed values reduced (FODDER_BASIC: 50→17, FODDER_FAST: 90→30)
- src/renderers/EnemyRenderer.jsx — facing rotation formula corrected (line 60)
