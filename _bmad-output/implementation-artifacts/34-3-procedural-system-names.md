# Story 34.3: Procedural System Names

Status: done

## Story

As a player,
I want each system to display a unique randomly-generated name,
so that every run feels like a different expedition.

## Acceptance Criteria

1. **Given** `useLevel` state **When** the store is initialized **Then** it contains `currentSystemName: null` and `usedSystemNames: []`

2. **Given** system entry (new run or tunnel transition) **When** `initializeSystemName(pool)` is called with a non-empty pool **Then** a name is picked randomly from `pool` excluding names already in `usedSystemNames` for this run **And** `currentSystemName` is set to that name **And** the chosen name is added to `usedSystemNames`

3. **Given** `SystemNameBanner` **When** it renders during `systemEntry` phase **Then** it reads `currentSystemName` from `useLevel` (not from `GAME_CONFIG.SYSTEM_NAMES`) **And** displays that name as the primary system name text

4. **Given** pool exhaustion **When** `initializeSystemName(pool)` is called and all pool names are already used **Then** the used list constraint is ignored and a name is picked from the full pool (wrap-around — no run should be nameless)

5. **Given** reset **When** `useLevel.reset()` is called **Then** `currentSystemName: null` and `usedSystemNames: []` are both reset

6. **Given** `GameLoop.jsx` system-entry paths **When** a new system starts (new game or tunnel transition) **Then** `initializeSystemName(galaxyConfig.systemNamePool)` is called at both `initializePlanets` call sites, using the `galaxyConfig` already computed from `getGalaxyById(selectedGalaxyId)`

## Tasks / Subtasks

- [x] Task 1 — Add `currentSystemName` and `usedSystemNames` to `useLevel.jsx` state (AC: #1, #5)
  - [x] 1.1 Add `currentSystemName: null` to initial state object (alongside existing fields)
  - [x] 1.2 Add `usedSystemNames: []` to initial state object
  - [x] 1.3 Add both fields to `reset()` (see Dev Notes for exact placement)
  - [x] 1.4 Do NOT modify `advanceSystem()` — `usedSystemNames` persists across systems within a run
- [x] Task 2 — Implement `initializeSystemName(pool)` action in `useLevel.jsx` (AC: #2, #4)
  - [x] 2.1 Guard: if `!pool || pool.length === 0`, return immediately (no-op)
  - [x] 2.2 Filter pool to exclude names already in `usedSystemNames`
  - [x] 2.3 If filtered pool is empty, use full `pool` (wrap-around fallback)
  - [x] 2.4 Pick a random name from the filtered/full pool
  - [x] 2.5 `set({ currentSystemName: name, usedSystemNames: [...usedSystemNames, name] })`
- [x] Task 3 — Update `SystemNameBanner.jsx` to read from `useLevel.currentSystemName` (AC: #3)
  - [x] 3.1 Add `const currentSystemName = useLevel((s) => s.currentSystemName)` hook
  - [x] 3.2 Replace `GAME_CONFIG.SYSTEM_NAMES[currentSystem - 1]` lookup with `currentSystemName`
  - [x] 3.3 Use `currentSystemName || \`SYSTEM ${currentSystem}\`` as fallback (same pattern as before)
  - [x] 3.4 Remove the now-unused `systemName` variable and `console.warn` block
  - [x] 3.5 Keep `GAME_CONFIG` import (still needed for `SYSTEM_BANNER` timing constants)
- [x] Task 4 — Update `GameLoop.jsx` to call `initializeSystemName` at system-entry sites (AC: #6)
  - [x] 4.1 At ~line 141 (tunnel→gameplay): add `useLevel.getState().initializeSystemName(galaxyConfig?.systemNamePool)` after `initializePlanets` call
  - [x] 4.2 At ~line 162 (new game start): same addition
  - [x] 4.3 `getGalaxyById` and `galaxyConfig` will already be in scope from Story 34.2 changes
- [x] Task 5 — Write `useLevel.systemName.test.js` (AC: #1, #2, #4, #5)
  - [x] 5.1 Test: initial state has `currentSystemName: null`
  - [x] 5.2 Test: initial state has `usedSystemNames: []`
  - [x] 5.3 Test: `initializeSystemName(pool)` sets `currentSystemName` to a value from pool
  - [x] 5.4 Test: chosen name is added to `usedSystemNames`
  - [x] 5.5 Test: 4 successive calls with a 4-name pool yields 4 unique names (no repeat within pool)
  - [x] 5.6 Test: wrap-around — 5th call after pool exhaustion still returns a valid name
  - [x] 5.7 Test: `reset()` clears `currentSystemName` to null
  - [x] 5.8 Test: `reset()` clears `usedSystemNames` to `[]`
  - [x] 5.9 Test: no-op when pool is empty array
  - [x] 5.10 Test: no-op when pool is null or undefined
- [x] Task 6 — Update `SystemNameBanner.test.jsx` (AC: #3)
  - [x] 6.1 Remove the 7 tests in `'System name lookup logic'` that assert against `GAME_CONFIG.SYSTEM_NAMES` hardcoded values
  - [x] 6.2 Add 3 new tests covering `useLevel.currentSystemName` flow (see Dev Notes)
  - [x] 6.3 Keep all timing, phase transition, store integration, and galaxy subtitle tests unchanged
- [x] Task 7 — Run all tests and verify (AC: all)
  - [x] 7.1 `npx vitest run` — all tests must pass (83/83 on impacted files; pre-existing failures on unrelated files confirmed pre-existing)

## Dev Notes

### Dependency — Story 34.1 Must Be Complete First

This story requires `galaxyDefs.js` to have `systemNamePool` on the Andromeda Reach object (added in Story 34.1). After 34.1, `getGalaxyById('andromeda_reach').systemNamePool` returns this 16-name array:
```js
[
  'IRON REACH', 'SHATTERED VEIL', 'DEAD ORBIT', 'BURNING FRONT',
  'ASHEN BELT', 'VOID CORONA', 'FRACTURE ZONE', 'BLEEDING ARM',
  'DUST CORRIDOR', 'SILENT WRECK', 'PALE MARGIN', 'SULFUR TIDE',
  'CINDER GATE', 'RUST MERIDIAN', 'TORN NEBULA', 'COLLAPSED RIM',
]
```

Story 34.2 (luck-weighted planets, random spawn) can run in parallel with 34.3 — no conflicts. However, **if 34.2 is not done yet**, the developer must also handle the `getGalaxyById` import and `galaxyConfig` variable in `GameLoop.jsx` (see Story 34.2 Dev Notes section "GameLoop.jsx — Updating initializePlanets() Call Sites"). In that case both stories can be implemented in a single session.

### `initializeSystemName(pool)` — Full Implementation

Add to `useLevel.jsx` after `initializePlanets` (or after `initializeSystemDuration`):

```js
initializeSystemName: (pool) => {
  if (!pool || pool.length === 0) return
  const { usedSystemNames } = get()
  let available = pool.filter(name => !usedSystemNames.includes(name))
  // Wrap-around: if all names used, pick from full pool
  if (available.length === 0) {
    available = [...pool]
  }
  const name = available[Math.floor(Math.random() * available.length)]
  set({ currentSystemName: name, usedSystemNames: [...usedSystemNames, name] })
},
```

**Behaviour note:** `usedSystemNames` grows across systems within a run (up to 3 entries for Andromeda Reach's 3 systems). It is NOT cleared by `advanceSystem()` — only by `reset()`. This is intentional: names must stay unique across all systems of a run.

### `useLevel.jsx` — Exact State and Reset Changes

Initial state additions (add after `activeScanPlanetId: null`):
```js
// --- Procedural System Names (Story 34.3) ---
currentSystemName: null,
usedSystemNames: [],
```

`reset()` additions (add after the existing `actualSystemDuration` line):
```js
currentSystemName: null,
usedSystemNames: [],
```

**Do NOT modify `advanceSystem()`** — it already resets per-system fields (systemTimer, planets, wormholeState, etc.) but must NOT clear `usedSystemNames`, which is per-run.

### `SystemNameBanner.jsx` — Minimal Change

Current code at lines 9-10 (keep `currentSystem` — still needed for fallback):
```jsx
const currentSystem = useLevel((s) => s.currentSystem)
```

Add below it:
```jsx
const currentSystemName = useLevel((s) => s.currentSystemName)
```

Current lines 35-39 (replace entirely):
```jsx
// REMOVE:
const systemName = GAME_CONFIG.SYSTEM_NAMES[currentSystem - 1]
if (!systemName && import.meta.env.DEV) {
  console.warn(`[SystemNameBanner] No system name configured for system ${currentSystem}. Using fallback.`)
}
const rawSystemName = systemName || `SYSTEM ${currentSystem}`

// REPLACE WITH:
const rawSystemName = currentSystemName || `SYSTEM ${currentSystem}`
```

Keep the `GAME_CONFIG` import (lines 4) — it is still used for `SYSTEM_BANNER` timing constants at line 46. The `SYSTEM_NAMES` array in `gameConfig.js` becomes dead data but must NOT be deleted in this story.

### `GameLoop.jsx` — System Entry Call Sites

After Story 34.2, the two `initializePlanets()` call sites already have `galaxyConfig` in scope:

**~Line 141 (tunnel → gameplay):**
```js
const galaxyConfig = getGalaxyById(useGame.getState().selectedGalaxyId)
const luckValue = usePlayer.getState().getLuckStat()
useLevel.getState().initializePlanets(galaxyConfig, luckValue)
// ADD:
useLevel.getState().initializeSystemName(galaxyConfig?.systemNamePool)
```

**~Line 162 (new game start):**
```js
// Same galaxyConfig already computed above in the same if-block:
useLevel.getState().initializeSystemName(galaxyConfig?.systemNamePool)
```

Use `galaxyConfig?.systemNamePool` (optional chaining) for null safety — consistent with how Story 34.2 guards against null `galaxyConfig`.

### `SystemNameBanner.test.jsx` — Tests to Remove and Add

**Remove** these 7 tests from `'System name lookup logic'` describe block (entire block can be replaced):
- `'SYSTEM_NAMES array has 3 entries for 3 systems'`
- `'SYSTEM_NAMES are non-empty strings'`
- `'currentSystem 1 maps to SYSTEM_NAMES[0] ...'` (asserts `'ALPHA CENTAURI'`)
- `'currentSystem 2 maps to SYSTEM_NAMES[1]'` (asserts `'PROXIMA'`)
- `'currentSystem 3 maps to SYSTEM_NAMES[2]'` (asserts `'KEPLER-442'`)
- `'out-of-bounds currentSystem returns undefined'`
- `'currentSystem 0 returns undefined'`

**Add** new describe block:
```js
describe('Story 34.3 — currentSystemName from useLevel', () => {
  it('currentSystemName defaults to null in useLevel', () => {
    useLevel.getState().reset()
    expect(useLevel.getState().currentSystemName).toBeNull()
  })

  it('fallback rawSystemName is SYSTEM {n} when currentSystemName is null', () => {
    useLevel.getState().reset()
    const currentSystemName = useLevel.getState().currentSystemName
    const currentSystem = useLevel.getState().currentSystem
    const rawSystemName = currentSystemName || `SYSTEM ${currentSystem}`
    expect(rawSystemName).toBe('SYSTEM 1')
  })

  it('rawSystemName uses currentSystemName when set', () => {
    useLevel.setState({ currentSystemName: 'IRON REACH' })
    const currentSystemName = useLevel.getState().currentSystemName
    const rawSystemName = currentSystemName || `SYSTEM 1`
    expect(rawSystemName).toBe('IRON REACH')
  })
})
```

**Keep unchanged:**
- `'Banner timing configuration (Story 17.2)'` (6 tests)
- `'Phase transitions (integration with useGame)'` (3 tests)
- `'Store integration'` (3 tests)
- `'Story 29.2 — Cinematic two-line banner logic'` (6 tests)
- `'Dev mode console warning'` (1 test — can be kept as-is or removed)

### New Test File — `src/stores/__tests__/useLevel.systemName.test.js`

Create this new file:

```js
import { describe, it, expect, beforeEach } from 'vitest'
import useLevel from '../useLevel.jsx'

const MOCK_POOL = ['IRON REACH', 'DEAD ORBIT', 'VOID CORONA', 'BURNING FRONT']

describe('useLevel — initializeSystemName (Story 34.3)', () => {
  beforeEach(() => {
    useLevel.getState().reset()
  })

  it('initial state: currentSystemName is null', () => {
    expect(useLevel.getState().currentSystemName).toBeNull()
  })

  it('initial state: usedSystemNames is empty array', () => {
    expect(useLevel.getState().usedSystemNames).toEqual([])
  })

  it('sets currentSystemName to a name from pool', () => {
    useLevel.getState().initializeSystemName(MOCK_POOL)
    const name = useLevel.getState().currentSystemName
    expect(MOCK_POOL).toContain(name)
  })

  it('adds chosen name to usedSystemNames', () => {
    useLevel.getState().initializeSystemName(MOCK_POOL)
    const name = useLevel.getState().currentSystemName
    expect(useLevel.getState().usedSystemNames).toContain(name)
  })

  it('4 successive calls with a 4-name pool yield 4 unique names', () => {
    const usedNames = new Set()
    for (let i = 0; i < MOCK_POOL.length; i++) {
      useLevel.getState().initializeSystemName(MOCK_POOL)
      usedNames.add(useLevel.getState().currentSystemName)
    }
    expect(usedNames.size).toBe(MOCK_POOL.length)
  })

  it('wrap-around: 5th call after pool exhausted still returns a valid name', () => {
    for (let i = 0; i < MOCK_POOL.length; i++) {
      useLevel.getState().initializeSystemName(MOCK_POOL)
    }
    // 5th call — pool exhausted, should wrap around
    useLevel.getState().initializeSystemName(MOCK_POOL)
    const name = useLevel.getState().currentSystemName
    expect(MOCK_POOL).toContain(name)
  })

  it('reset() clears currentSystemName to null', () => {
    useLevel.getState().initializeSystemName(MOCK_POOL)
    expect(useLevel.getState().currentSystemName).not.toBeNull()
    useLevel.getState().reset()
    expect(useLevel.getState().currentSystemName).toBeNull()
  })

  it('reset() clears usedSystemNames to empty array', () => {
    useLevel.getState().initializeSystemName(MOCK_POOL)
    expect(useLevel.getState().usedSystemNames.length).toBeGreaterThan(0)
    useLevel.getState().reset()
    expect(useLevel.getState().usedSystemNames).toEqual([])
  })

  it('no-op when pool is empty array', () => {
    useLevel.getState().initializeSystemName([])
    expect(useLevel.getState().currentSystemName).toBeNull()
  })

  it('no-op when pool is null', () => {
    useLevel.getState().initializeSystemName(null)
    expect(useLevel.getState().currentSystemName).toBeNull()
  })

  it('no-op when pool is undefined', () => {
    useLevel.getState().initializeSystemName(undefined)
    expect(useLevel.getState().currentSystemName).toBeNull()
  })
})
```

### Architecture Compliance

- 6-layer architecture: this story touches **Stores** → **GameLoop** → **UI** (standard flow)
- Zustand pattern: `create((set, get) => ({...}))` — `initializeSystemName` uses both `get()` (reads `usedSystemNames`) and `set()` (updates state)
- Reset pattern: ALL new state fields must be in `reset()` — ✓ covered in Task 1.3
- SFX: no audio involved in this story
- HUD: `SystemNameBanner.jsx` is an HTML overlay div, not a 3D element — matches established HUD pattern

### What This Story Does NOT Do

- Does NOT delete or modify `GAME_CONFIG.SYSTEM_NAMES` — becomes dead data naturally
- Does NOT implement wormhole scan-based trigger (Story 34.4)
- Does NOT implement enemy speed/difficulty from galaxy profile (Story 34.5)
- Does NOT modify `advanceSystem()` — no per-system name reset needed
- Does NOT add a `setCurrentSystemName` action — only `initializeSystemName` manages this field

### Project Structure Notes

Files touched:
- `src/stores/useLevel.jsx` — add 2 state fields + `initializeSystemName()` + update `reset()`
- `src/ui/SystemNameBanner.jsx` — read `currentSystemName` from store, remove `SYSTEM_NAMES` lookup
- `src/GameLoop.jsx` — call `initializeSystemName` at 2 system-entry sites (~lines 141, 162)
- `src/stores/__tests__/useLevel.systemName.test.js` — NEW test file (11 tests)
- `src/ui/__tests__/SystemNameBanner.test.jsx` — remove 7 stale tests, add 3 new tests

### References

- [Source: _bmad-output/planning-artifacts/epic-34-galaxy-system-foundation.md#Story 34.3]
- [Source: _bmad-output/planning-artifacts/epic-34-galaxy-system-foundation.md#Technical Notes — systemNamePool]
- [Source: src/stores/useLevel.jsx] — current store (no `currentSystemName` yet), reset() at line 220
- [Source: src/ui/SystemNameBanner.jsx#35-39] — `GAME_CONFIG.SYSTEM_NAMES[currentSystem - 1]` lookup to replace
- [Source: src/ui/SystemNameBanner.jsx#46-49] — `SYSTEM_BANNER` timing constants (keep importing `GAME_CONFIG`)
- [Source: src/GameLoop.jsx#141] — `initializePlanets()` on tunnel→gameplay (add `initializeSystemName` here)
- [Source: src/GameLoop.jsx#162] — `initializePlanets()` on new game start (add `initializeSystemName` here)
- [Source: src/entities/galaxyDefs.js] — `getGalaxyById()` (in scope via Story 34.2 import)
- [Source: _bmad-output/implementation-artifacts/34-1-galaxy-profile-planet-redesign.md#galaxyDefs.js — Full Andromeda Reach Profile] — `systemNamePool` field
- [Source: _bmad-output/implementation-artifacts/34-2-luck-weighted-planet-generation-random-spawn.md#GameLoop.jsx — Updating initializePlanets() Call Sites] — exact call site context
- [Source: src/ui/__tests__/SystemNameBanner.test.jsx] — 7 tests to remove, 3 to add

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Implemented `currentSystemName` + `usedSystemNames` state fields in `useLevel.jsx` (initial state + reset)
- Implemented `initializeSystemName(pool)` action with wrap-around fallback when pool exhausted
- Updated `SystemNameBanner.jsx` to read `currentSystemName` from store instead of `GAME_CONFIG.SYSTEM_NAMES`
- Updated `GameLoop.jsx` two system-entry sites (tunnel→gameplay + new game) to call `initializeSystemName` after `initializePlanets`, using optional chaining `galaxyConfig?.systemNamePool` for null safety
- Created `src/stores/__tests__/useLevel.systemName.test.js` — 11 tests all passing
- Updated `SystemNameBanner.test.jsx` — replaced 7 stale `SYSTEM_NAMES` tests with 3 new `currentSystemName` tests (22 tests total, all passing)
- All 83 impacted tests pass; pre-existing failures on unrelated files confirmed pre-existing (audioManager, commandSystem, waveSystem, Armory, MainMenu)

### Code Review Fixes (AI-Review)

- **[M1 fixed]** Added 2 regression tests to `useLevel.systemName.test.js` verifying `advanceSystem()` does NOT clear `usedSystemNames` (per-run persistence guard)
- **[M2 fixed]** Removed stale "Dev mode console warning" describe block from `SystemNameBanner.test.jsx` — referenced removed component behavior (SYSTEM_NAMES lookup + console.warn eliminated by Task 3.4)
- **[L1 fixed]** Removed redundant optional chaining (`?.`) on `systemNamePool` inside non-null guard blocks in `GameLoop.jsx:147,174`
- All tests pass: 34/34 (13 in useLevel.systemName.test.js + 21 in SystemNameBanner.test.jsx)

### Code Review Fixes (AI-Review Round 2)

- **[M1 fixed]** Fixed wrap-around logic in `initializeSystemName`: after pool exhaustion, `usedSystemNames` now resets to `[name]` instead of growing indefinitely with duplicates. Without this fix, the first wrap-around permanently disabled deduplication for all subsequent calls (filter always returned empty). Added regression test `'wrap-around: usedSystemNames resets to [name] so deduplication resumes after cycle'`.
- **[L1 fixed]** Fixed hardcoded `SYSTEM 1` fallback in `SystemNameBanner.test.jsx:32` — replaced with dynamic `` `SYSTEM ${currentSystem}` `` to match actual component code.
- All tests pass: 35/35 (14 in useLevel.systemName.test.js + 21 in SystemNameBanner.test.jsx)

### File List

- src/stores/useLevel.jsx
- src/ui/SystemNameBanner.jsx
- src/GameLoop.jsx
- src/stores/__tests__/useLevel.systemName.test.js (NEW)
- src/ui/__tests__/SystemNameBanner.test.jsx
