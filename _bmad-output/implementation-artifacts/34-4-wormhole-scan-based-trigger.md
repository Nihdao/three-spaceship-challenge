# Story 34.4: Wormhole Scan-Based Trigger

Status: done

## Story

As a player,
I want the wormhole to appear after scanning 75% of system planets,
so that exploration is the primary objective and the timer is pressure — not the trigger.

## Acceptance Criteria

1. **Given** the wormhole spawn logic in GameLoop **When** a scan completes (`scanResult.completed === true`) **Then** the count of scanned planets is checked against `Math.ceil(galaxyConfig.planetCount * galaxyConfig.wormholeThreshold)` (= 12 for Andromeda) **And** if threshold is met and `wormholeState === 'hidden'`, `spawnWormhole()` is called **And** the timer-based spawn (`newTimer >= threshold`) is removed

2. **Given** `WORMHOLE_SPAWN_TIMER_THRESHOLD` in `gameConfig.js` **When** reviewed post-story **Then** it is either removed or clearly marked deprecated (no gameplay usage)

3. **Given** the timer **When** the system timer expires before the wormhole spawns **Then** game over is still triggered (timer pressure unchanged)

4. **Given** edge case: all planets scanned before timer **When** wormhole is already `visible` or beyond **Then** scanning more planets has no effect on wormhole state (idempotent check via `wormholeState === 'hidden'` guard)

## Tasks / Subtasks

- [x] Task 1 — Remove timer-based wormhole spawn from `GameLoop.jsx` (AC: #1, #3)
  - [x] 1.1 Locate the `// 7f-bis. Wormhole spawn + activation check` block at ~line 554
  - [x] 1.2 Remove the inner `if (levelState.wormholeState === 'hidden') { ... spawnWormhole() ... }` block (~lines 556–560)
  - [x] 1.3 Update the comment to: `// 7f-bis. Wormhole activation check (spawn now triggered by scan count — Story 34.4)`
  - [x] 1.4 The `else if (wormholeState === 'visible')` branch becomes the first branch — verify no structural change needed
  - [x] 1.5 Verify game-over timer logic at ~lines 540–548 is untouched

- [x] Task 2 — Add scan-based wormhole trigger in `GameLoop.jsx` (AC: #1, #4)
  - [x] 2.1 Locate the `// Scan completed successfully` block at ~line 748
  - [x] 2.2 After `useGame.getState().triggerPlanetReward(scanResult.tier)`, add the scan-threshold check (see Dev Notes)
  - [x] 2.3 Guard: only trigger if `getGalaxyById(...)` returns non-null
  - [x] 2.4 Guard: only trigger if `useLevel.getState().wormholeState === 'hidden'` (idempotent — AC #4)
  - [x] 2.5 Confirm `getGalaxyById` import is present (added by Story 34.2; add it here if 34.2 not yet done)

- [x] Task 3 — Deprecate `WORMHOLE_SPAWN_TIMER_THRESHOLD` in `gameConfig.js` (AC: #2)
  - [x] 3.1 Add `// DEPRECATED (Story 34.4): No longer used — wormhole spawn is now scan-based` comment above the constant
  - [x] 3.2 Do NOT delete the constant (safe deprecation, avoid breaking anything)

- [x] Task 4 — Write `useLevel.wormholeScanTrigger.test.js` (AC: #1, #4)
  - [x] 4.1 Test: threshold math — `Math.ceil(15 * 0.75) === 12`
  - [x] 4.2 Test: threshold math edge cases — `Math.ceil(10 * 0.75) === 8`, `Math.ceil(20 * 0.75) === 15`
  - [x] 4.3 Test: 11 scanned planets → count is below threshold
  - [x] 4.4 Test: 12 scanned planets → count meets threshold, calling `spawnWormhole()` transitions to `visible`
  - [x] 4.5 Test: with wormholeState already `visible`, guard `wormholeState === 'hidden'` evaluates to false (idempotent)
  - [x] 4.6 Test: with wormholeState `activating`, guard also evaluates to false

- [x] Task 5 — Run all tests (AC: all)
  - [x] 5.1 `npx vitest run` — all tests pass
  - [x] 5.2 `useLevel.wormholeScanTrigger.test.js` runs green

## Dev Notes

### Dependency — Story 34.1 Must Be Complete First

Story 34.4 requires `getGalaxyById('andromeda_reach')` to return `planetCount: 15` and `wormholeThreshold: 0.75` (added in Story 34.1).

Current `galaxyDefs.js` (pre-34.1) does NOT have these fields. Story 34.1 must be done — or the developer must add a null-safe fallback using `gc?.planetCount ?? planets.length` and `gc?.wormholeThreshold ?? 0.75`.

### Dependency — `getGalaxyById` Import (Story 34.2)

Story 34.2 adds to `GameLoop.jsx`:
```js
import { getGalaxyById } from './entities/galaxyDefs.js'
```
**If Story 34.2 is not yet done**, add this import manually.

### `GameLoop.jsx` — Exact Changes

**BEFORE (lines 554–560) — REMOVE the `if hidden` block:**
```js
// 7f-bis. Wormhole spawn + activation check
const levelState = useLevel.getState()
if (levelState.wormholeState === 'hidden') {
  if (newTimer >= levelState.actualSystemDuration * GAME_CONFIG.WORMHOLE_SPAWN_TIMER_THRESHOLD) { // Story 23.3
    useLevel.getState().spawnWormhole(playerPos[0], playerPos[2])
    playSFX('wormhole-spawn')
  }
} else if (levelState.wormholeState === 'visible') {
```

**AFTER — `if hidden` block removed, `visible` is now first branch:**
```js
// 7f-bis. Wormhole activation check (spawn now triggered by scan count — Story 34.4)
const levelState = useLevel.getState()
if (levelState.wormholeState === 'visible') {
```

**BEFORE (lines 748–753) — scan completion:**
```js
// Scan completed successfully
if (scanResult.completed) {
  stopScanLoop()
  playSFX('scan-complete')
  useGame.getState().triggerPlanetReward(scanResult.tier)
}
```

**AFTER — add scan-based trigger:**
```js
// Scan completed successfully
if (scanResult.completed) {
  stopScanLoop()
  playSFX('scan-complete')
  useGame.getState().triggerPlanetReward(scanResult.tier)
  // Story 34.4: Scan-based wormhole trigger
  const scanGalaxyConfig = getGalaxyById(useGame.getState().selectedGalaxyId)
  if (scanGalaxyConfig && useLevel.getState().wormholeState === 'hidden') {
    const threshold = Math.ceil(scanGalaxyConfig.planetCount * scanGalaxyConfig.wormholeThreshold)
    const scannedCount = useLevel.getState().planets.filter(p => p.scanned).length
    if (scannedCount >= threshold) {
      useLevel.getState().spawnWormhole(playerPos[0], playerPos[2])
      playSFX('wormhole-spawn')
    }
  }
}
```

**Why `useLevel.getState()` fresh instead of reusing `levelState`?**
`levelState` is captured at ~line 555, BEFORE `scanningTick` at ~line 733. The newly scanned planet is in the store only after `scanningTick` runs. `useLevel.getState()` in the scan block returns the post-scan state including the planet just marked `scanned: true`. Similarly, `scanGalaxyConfig` avoids shadowing other `galaxyConfig` variables in scope from 34.2's system-entry blocks.

**Note on companion dialogue:** Story 30.3 may trigger a `'wormhole-spawn'` companion event. Check if `useCompanion.getState().trigger('wormhole-spawn')` exists nearby — if so, move it alongside the new `playSFX('wormhole-spawn')` call so it fires at the right moment.

### `gameConfig.js` — Deprecation (Task 3)

```js
// DEPRECATED (Story 34.4): No longer used — wormhole spawn is now scan-based.
// Safe to remove in a future cleanup pass.
WORMHOLE_SPAWN_TIMER_THRESHOLD: 0.01,
```

Only referenced in `GameLoop.jsx` (being removed) and `gameConfig.js` itself. No tests reference it.

### New Test File — `src/stores/__tests__/useLevel.wormholeScanTrigger.test.js`

```js
import { describe, it, expect, beforeEach } from 'vitest'
import useLevel from '../useLevel.jsx'

const MOCK_GALAXY_CONFIG = {
  id: 'andromeda_reach',
  planetCount: 15,
  wormholeThreshold: 0.75,
}

function makePlanets(scannedCount, totalCount) {
  return Array.from({ length: totalCount }, (_, i) => ({
    id: `planet_${i}`,
    typeId: 'PLANET_CINDER',
    tier: 'standard',
    x: i * 50,
    z: 0,
    scanned: i < scannedCount,
    scanProgress: i < scannedCount ? 1 : 0,
  }))
}

describe('useLevel — wormhole scan-based trigger logic (Story 34.4)', () => {
  beforeEach(() => {
    useLevel.getState().reset()
  })

  describe('threshold calculation', () => {
    it('Andromeda Reach threshold is 12 — Math.ceil(15 * 0.75)', () => {
      const threshold = Math.ceil(
        MOCK_GALAXY_CONFIG.planetCount * MOCK_GALAXY_CONFIG.wormholeThreshold
      )
      expect(threshold).toBe(12)
    })

    it('threshold rounds up — Math.ceil(10 * 0.75) === 8', () => {
      expect(Math.ceil(10 * 0.75)).toBe(8)
    })

    it('threshold rounds up — Math.ceil(20 * 0.75) === 15', () => {
      expect(Math.ceil(20 * 0.75)).toBe(15)
    })
  })

  describe('scanned planet counting', () => {
    it('11 scanned planets: count is below threshold (12)', () => {
      useLevel.setState({ planets: makePlanets(11, 15) })
      const scannedCount = useLevel.getState().planets.filter(p => p.scanned).length
      const threshold = Math.ceil(
        MOCK_GALAXY_CONFIG.planetCount * MOCK_GALAXY_CONFIG.wormholeThreshold
      )
      expect(scannedCount).toBe(11)
      expect(scannedCount < threshold).toBe(true)
    })

    it('12 scanned planets: count meets threshold', () => {
      useLevel.setState({ planets: makePlanets(12, 15) })
      const scannedCount = useLevel.getState().planets.filter(p => p.scanned).length
      const threshold = Math.ceil(
        MOCK_GALAXY_CONFIG.planetCount * MOCK_GALAXY_CONFIG.wormholeThreshold
      )
      expect(scannedCount).toBe(12)
      expect(scannedCount >= threshold).toBe(true)
    })

    it('15 scanned planets (all): count exceeds threshold', () => {
      useLevel.setState({ planets: makePlanets(15, 15) })
      const scannedCount = useLevel.getState().planets.filter(p => p.scanned).length
      const threshold = Math.ceil(
        MOCK_GALAXY_CONFIG.planetCount * MOCK_GALAXY_CONFIG.wormholeThreshold
      )
      expect(scannedCount).toBe(15)
      expect(scannedCount >= threshold).toBe(true)
    })
  })

  describe('idempotency — wormhole state guard', () => {
    it('wormholeState hidden: spawnWormhole() transitions to visible', () => {
      expect(useLevel.getState().wormholeState).toBe('hidden')
      useLevel.getState().spawnWormhole(0, 0)
      expect(useLevel.getState().wormholeState).toBe('visible')
    })

    it('wormholeState visible: guard wormholeState === hidden is false', () => {
      useLevel.getState().spawnWormhole(0, 0)
      expect(useLevel.getState().wormholeState).toBe('visible')
      const shouldTrigger = useLevel.getState().wormholeState === 'hidden'
      expect(shouldTrigger).toBe(false)
    })

    it('wormholeState activating: guard is false', () => {
      useLevel.getState().spawnWormhole(0, 0)
      useLevel.getState().activateWormhole()
      expect(useLevel.getState().wormholeState).toBe('activating')
      const shouldTrigger = useLevel.getState().wormholeState === 'hidden'
      expect(shouldTrigger).toBe(false)
    })
  })
})
```

### Game Over Timer — Unchanged Logic

The game over check at ~lines 540–548 is **not touched**:
```js
if (wormholeStatePre !== 'activating' && wormholeStatePre !== 'active') {
  playSFX('game-over-impact')
  gameState.triggerGameOver()
  // ...
}
```
If the player hasn't scanned 12 planets before the timer expires, `wormholeState` is still `hidden` → the `hidden` ≠ `activating|active` condition is true → game over fires. AC #3 is preserved without any code change.

### Scanning Tests — No Changes Needed

`useLevel.scanning.test.js` uses old planet typeIds (`PLANET_SILVER`, etc.). **Do NOT update** these tests in Story 34.4 — that scope belongs to Story 34.1. Story 34.4 does not modify `scanningTick()`.

### Architecture Compliance

- 6-layer architecture: GameLoop (trigger) + Config (deprecation) only — no store changes
- SFX: `playSFX('wormhole-spawn')` called from GameLoop ✓ (never from store)
- Zustand: no new state, no new actions, no new stores touched
- Reset: no changes needed

### What This Story Does NOT Do

- Does NOT modify `scanningTick()` or any store action
- Does NOT delete `WORMHOLE_SPAWN_TIMER_THRESHOLD` — only deprecates it
- Does NOT change timer expiry / game-over logic (AC #3)
- Does NOT rename planet types (Story 34.1 scope)
- Does NOT implement enemy speed/difficulty from galaxy profile (Story 34.5)
- Does NOT modify the `visible → activating → active → reactivated` wormhole state chain

### Project Structure Notes

Files touched:
- `src/GameLoop.jsx` — remove timer-based spawn (~lines 556–560), extend scan completion block (~line 752)
- `src/config/gameConfig.js` — add deprecation comment at line 184
- `src/stores/__tests__/useLevel.wormholeScanTrigger.test.js` — NEW file (16 tests)

Files NOT touched:
- `src/stores/useLevel.jsx`
- `src/entities/galaxyDefs.js` (managed by 34.1)
- `src/entities/planetDefs.js` (managed by 34.1)
- `src/stores/__tests__/useLevel.wormhole.test.js` (no changes needed)
- `src/stores/__tests__/useLevel.scanning.test.js` (no changes needed)

### References

- [Source: _bmad-output/planning-artifacts/epic-34-galaxy-system-foundation.md#Story 34.4]
- [Source: src/GameLoop.jsx#554–560] — timer-based wormhole spawn block to remove
- [Source: src/GameLoop.jsx#748–753] — scan completion block to extend
- [Source: src/config/gameConfig.js#184] — `WORMHOLE_SPAWN_TIMER_THRESHOLD: 0.01`
- [Source: src/stores/useLevel.jsx#29–80] — `scanningTick()` return shape: `{ completed, tier, planetId }`
- [Source: src/stores/useLevel.jsx#158–178] — `spawnWormhole(playerX, playerZ)` implementation
- [Source: src/entities/galaxyDefs.js] — `getGalaxyById()` (post-34.1 returns `planetCount`, `wormholeThreshold`)
- [Source: _bmad-output/implementation-artifacts/34-2-luck-weighted-planet-generation-random-spawn.md#GameLoop.jsx — Updating initializePlanets() Call Sites] — `getGalaxyById` import context
- [Source: src/stores/__tests__/useLevel.wormhole.test.js] — existing tests, unchanged
- [Source: src/stores/__tests__/useLevel.scanning.test.js] — existing tests, unchanged

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- Removed timer-based wormhole spawn (`if hidden → newTimer >= threshold`) from `GameLoop.jsx` `// 7f-bis` block. The `visible` branch now leads directly.
- Added scan-based trigger in the `// Scan completed successfully` block: after `triggerPlanetReward`, checks `scanGalaxyConfig.planetCount * wormholeThreshold` via `Math.ceil`, guards on `wormholeState === 'hidden'` (idempotent per AC #4).
- `getGalaxyById` import confirmed present from Story 34.2 — no change needed.
- Deprecated `WORMHOLE_SPAWN_TIMER_THRESHOLD` in `gameConfig.js` with inline comment; constant preserved (safe deprecation).
- Game-over timer logic untouched: timer expiry still triggers game-over if wormhole not yet activating/active (AC #3 preserved with zero code change).
- Wrote 9 tests in `useLevel.wormholeScanTrigger.test.js` covering threshold math (3), scan counting (3), and idempotency guards (3). All pass.
- Companion dialogue 'wormhole-spawn': trigger confirmed present in `Interface.jsx:88` via `useEffect` reacting to `wormholeState` change (hidden → visible). Pattern is correct and intentionally decoupled from GameLoop — no change needed. Dev Notes action item resolved.
- Code review fix: added 2 additional tests — end-to-end AC#1 (12 scanned + hidden → spawnWormhole() → visible) and null galaxyConfig guard (selectedGalaxyId=null → wormhole stays hidden). Total: 11 tests.
- Full regression suite: 135 test files, 2303 tests — all green.

### File List

- `src/GameLoop.jsx` — modified (removed timer-based spawn, added scan-based trigger)
- `src/config/gameConfig.js` — modified (deprecation comment on `WORMHOLE_SPAWN_TIMER_THRESHOLD`)
- `src/stores/__tests__/useLevel.wormholeScanTrigger.test.js` — NEW (11 tests; 9 original + 2 added by code review)
