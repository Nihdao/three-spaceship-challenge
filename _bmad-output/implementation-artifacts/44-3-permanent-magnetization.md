# Story 44.3: Permanent Magnetization (Sticky Once Activated)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want collectibles to follow me indefinitely once they enter my magnet radius,
so that I never lose a collectible that I've attracted, even if I move away from it.

## Acceptance Criteria

1. **Given** `src/systems/xpOrbSystem.js` — `updateMagnetization()`
   **When** an orb enters the magnetic radius (`distSq <= magnetRadiusSq`)
   **Then** `orb.isMagnetized` is set to `true`
   **And** once `isMagnetized = true`, it is NEVER reset to `false` (no `else { orb.isMagnetized = false }`)
   **And** the orb continues moving toward the player as long as `isMagnetized`, regardless of current distance

2. **Given** `src/systems/healGemSystem.js` — `updateHealGemMagnetization()`
   **When** a heal gem enters the magnetic radius
   **Then** same sticky behavior as AC #1 (remove the `else { gem.isMagnetized = false }` branch)

3. **Given** `src/systems/fragmentGemSystem.js` — `updateMagnetization()`
   **When** a fragment gem enters the magnetic radius
   **Then** same sticky behavior as AC #1 (remove the `else { gem.isMagnetized = false }` branch)

4. **Given** `src/config/gameConfig.js`
   **When** a collectible is magnetized but currently outside the magnet radius (player moved away)
   **Then** the collectible moves with a guaranteed minimum speed: `XP_MAGNET_MIN_SPEED: 20` (units/sec)
   **And** the speed calculation in all three systems becomes: `const speed = Math.max(GAME_CONFIG.XP_MAGNET_MIN_SPEED, magnetSpeed * speedFactor)`
   **And** `speedFactor` is protected against negative values: `const speedFactor = Math.max(0, Math.pow(Math.max(0, 1 - normalizedDist), accelCurve))`

5. **Given** system resets
   **When** `resetOrbs()` / `resetHealGems()` / `reset()` (fragmentGemSystem) is called
   **Then** `isMagnetized` is properly reset to `false` for all pool entries (existing behavior preserved)

6. **Given** `vitest run`
   **When** the story is implemented
   **Then** all existing tests pass — with ONE exception: `xpOrbSystem.test.js` line 164 test `'de-magnetizes orbs that leave MAGNET_RADIUS'` must be REPLACED with a new test asserting the sticky behavior

## Tasks / Subtasks

- [x] Task 1: Add `XP_MAGNET_MIN_SPEED` to gameConfig.js (AC: #4)
  - [x] 1.1 Add `XP_MAGNET_MIN_SPEED: 20` near existing `XP_MAGNET_SPEED` (line ~54)
- [x] Task 2: Make xpOrbSystem magnetization sticky (AC: #1, #4)
  - [x] 2.1 Remove `else { orb.isMagnetized = false }` block (lines 70-72)
  - [x] 2.2 Protect `speedFactor` against negative: `Math.max(0, Math.pow(Math.max(0, 1 - normalizedDist), accelCurve))`
  - [x] 2.3 Apply min speed floor: `Math.max(GAME_CONFIG.XP_MAGNET_MIN_SPEED, magnetSpeed * speedFactor)`
- [x] Task 3: Make healGemSystem magnetization sticky (AC: #2, #4)
  - [x] 3.1 Remove `else { gem.isMagnetized = false }` block (lines 51-53)
  - [x] 3.2 Same `speedFactor` protection + min speed floor as Task 2
- [x] Task 4: Make fragmentGemSystem magnetization sticky (AC: #3, #4)
  - [x] 4.1 Remove `else { gem.isMagnetized = false }` block (lines 61-63)
  - [x] 4.2 Same `speedFactor` protection + min speed floor as Task 2
- [x] Task 5: Update tests (AC: #6)
  - [x] 5.1 Replace `xpOrbSystem.test.js` line 164 test with sticky magnetization test
  - [x] 5.2 Verify no other test asserts de-magnetization in heal/fragment test files
  - [x] 5.3 Run `vitest run` — all green

## Dev Notes

### Exact Code Changes — xpOrbSystem.js (lines 56-87)

Current `updateMagnetization()` has this pattern (identical in all 3 files):
```js
if (distSq <= magnetRadiusSq) {
  orb.isMagnetized = true
} else {
  orb.isMagnetized = false  // ← DELETE THIS BRANCH
}

if (orb.isMagnetized) {
  const dist = Math.sqrt(distSq)
  if (dist > 0.01) {
    const dirX = dx / dist
    const dirZ = dz / dist
    const normalizedDist = dist / magnetRadius
    const speedFactor = Math.pow(1 - normalizedDist, accelCurve)  // ← PROTECT
    const speed = magnetSpeed * speedFactor  // ← ADD MIN FLOOR
    ...
  }
}
```

Target pattern:
```js
if (distSq <= magnetRadiusSq) {
  orb.isMagnetized = true
}
// No else — once magnetized, stays magnetized until collected or reset

if (orb.isMagnetized) {
  const dist = Math.sqrt(distSq)
  if (dist > 0.01) {
    const dirX = dx / dist
    const dirZ = dz / dist
    const normalizedDist = dist / magnetRadius
    const speedFactor = Math.max(0, Math.pow(Math.max(0, 1 - normalizedDist), accelCurve))
    const speed = Math.max(GAME_CONFIG.XP_MAGNET_MIN_SPEED, magnetSpeed * speedFactor)
    orb.x += dirX * speed * delta
    orb.z += dirZ * speed * delta
  }
}
```

### Why speedFactor Protection Is Needed

When `normalizedDist > 1` (orb outside magnet radius but still magnetized):
- `1 - normalizedDist` becomes negative
- `Math.pow(negative, 2.0)` = positive (but wrong direction conceptually)
- `Math.max(0, ...)` on the inner term prevents this, making speedFactor = 0
- Then `Math.max(XP_MAGNET_MIN_SPEED, 0)` = 20, providing steady chase speed

### File-by-File Reference

| File | Line Range | Change |
|------|-----------|--------|
| `src/config/gameConfig.js` | ~54 | Add `XP_MAGNET_MIN_SPEED: 20` |
| `src/systems/xpOrbSystem.js` | 68-72, 80-81 | Remove else branch + protect speedFactor + min speed |
| `src/systems/healGemSystem.js` | 49-53, 60-61 | Same pattern |
| `src/systems/fragmentGemSystem.js` | 59-63, 70-71 | Same pattern |
| `src/systems/__tests__/xpOrbSystem.test.js` | 164-172 | Replace de-magnetization test |

### Critical Test Change

**MUST REPLACE** test at `src/systems/__tests__/xpOrbSystem.test.js:164`:
```js
// OLD — asserts de-magnetization (will fail)
it('de-magnetizes orbs that leave MAGNET_RADIUS', () => { ... })

// NEW — asserts sticky magnetization
it('keeps orbs magnetized after they leave MAGNET_RADIUS (sticky)', () => {
  spawnOrb(5, 0, 10)
  updateMagnetization(0, 0, 1/60) // magnetize
  expect(getOrbs()[0].isMagnetized).toBe(true)
  // Move orb far away manually
  getOrbs()[0].x = 100
  updateMagnetization(0, 0, 1/60)
  // Should STAY magnetized (sticky behavior)
  expect(getOrbs()[0].isMagnetized).toBe(true)
})
```

**No equivalent test exists** in `healGemSystem.test.js` or `fragmentGemSystem.test.js` — no test modifications needed there.

### Config Constants Reference

Existing (gameConfig.js lines 53-55):
```
XP_MAGNET_RADIUS: 15.0
XP_MAGNET_SPEED: 120
XP_MAGNET_ACCELERATION_CURVE: 2.0
```

New:
```
XP_MAGNET_MIN_SPEED: 20
```

### Architecture Compliance

- **Config/Data layer**: New constant in `gameConfig.js` — follows existing naming convention (`XP_MAGNET_*`)
- **Systems layer**: Changes in 3 system files — no store/GameLoop/UI changes needed
- **No allocation changes**: No new objects created, no pool modifications
- **Timer decay pattern**: Not applicable (no timers in this story)
- **Reset correctness**: `isMagnetized = false` in all three reset functions already exists and is preserved

### Project Structure Notes

- All three magnetization functions follow identical patterns — changes are mechanical and symmetric
- The `updateMagnetization` function in `fragmentGemSystem.js` is named the same as in `xpOrbSystem.js`, while `healGemSystem.js` uses `updateHealGemMagnetization` — respect these existing names
- `fragmentGemSystem.js` updates `gem.elapsedTime += delta` inside its magnetization loop (line 78), while `xpOrbSystem.js` does it in a separate `updateOrbs()` function — do not modify this difference

### References

- [Source: _bmad-output/planning-artifacts/epic-44-collectibles-overhaul.md#Story 44.3]
- [Source: src/systems/xpOrbSystem.js — updateMagnetization() lines 56-87]
- [Source: src/systems/healGemSystem.js — updateHealGemMagnetization() lines 37-68]
- [Source: src/systems/fragmentGemSystem.js — updateMagnetization() lines 47-80]
- [Source: src/config/gameConfig.js — XP_MAGNET_* lines 53-55]
- [Source: src/systems/__tests__/xpOrbSystem.test.js — de-magnetization test line 164]
- [Source: _bmad-output/planning-artifacts/project-context.md]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- Added `XP_MAGNET_MIN_SPEED: 20` to `gameConfig.js` following `XP_MAGNET_*` naming convention.
- Removed `else { *.isMagnetized = false }` branch from all three magnetization functions — once a collectible enters the magnet radius, it stays permanently magnetized until collected or reset.
- Protected `speedFactor` against negative values with `Math.max(0, Math.pow(Math.max(0, 1 - normalizedDist), accelCurve))` — prevents incorrect motion when collectible is outside radius while magnetized.
- Applied minimum speed floor `Math.max(GAME_CONFIG.XP_MAGNET_MIN_SPEED, magnetSpeed * speedFactor)` ensuring persistent chase at 20 units/sec even when `speedFactor` drops to 0 (far outside radius).
- Replaced `'de-magnetizes orbs that leave MAGNET_RADIUS'` test with `'keeps orbs magnetized after they leave MAGNET_RADIUS (sticky)'` in xpOrbSystem.test.js.
- Confirmed no de-magnetization tests exist in healGemSystem.test.js or fragmentGemSystem.test.js.
- Full test suite: 2696/2696 passed, 0 regressions.

### File List

- `src/config/gameConfig.js`
- `src/systems/xpOrbSystem.js`
- `src/systems/healGemSystem.js`
- `src/systems/fragmentGemSystem.js`
- `src/systems/__tests__/xpOrbSystem.test.js`

### Change Log

- Added `XP_MAGNET_MIN_SPEED: 20` config constant (2026-02-25)
- Made magnetization sticky in xpOrbSystem, healGemSystem, fragmentGemSystem with min-speed floor (2026-02-25)
- [Code Review Fix] Corrected `XP_MAGNET_MIN_SPEED` from 100 → 20 in gameConfig.js — value 100 violated AC #4 and broke ease-in acceleration test (2026-02-25)
- [Code Review Fix] Added movement assertion to sticky test (xpOrbSystem.test.js:164) — validates min-speed floor when orb is outside magnet radius (2026-02-25)
- [Code Review Fix] Added `XP_MAGNET_MIN_SPEED` config sanity test to XP Magnetization Config describe block (2026-02-25)
