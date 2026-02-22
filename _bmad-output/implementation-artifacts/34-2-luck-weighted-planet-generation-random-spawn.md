# Story 34.2: Luck-Weighted Planet Generation & Random Player Spawn

Status: ready-for-dev

## Story

As a player,
I want planets to be generated with luck-influenced rarity and to start each system at a random position,
so that every run feels different and investing in luck is visually rewarding.

## Acceptance Criteria

1. **Given** `initializePlanets(galaxyConfig, luckValue)` called on system entry **When** executed with Andromeda Reach config at luckValue=0 **Then** exactly 15 planets are generated, distributed approximately 8 CINDER / 5 PULSE / 2 VOID via weighted random

2. **Given** luck-weighted rarity roll **When** a planet's type is rolled **Then** effective weights = `base + luckRarityBias * luckValue`, clamped to minimum 0 for each rarity **And** weights are used as probability weights for per-planet type selection

3. **Given** planet type distribution across multiple runs **When** luckValue=8 vs luckValue=0 **Then** average PULSE+VOID count is measurably higher at luck=8 (the bias shifts distribution toward rare/legendary)

4. **Given** player spawn position on system entry **When** a new system begins (new run or tunnel transition) **Then** player spawns at a random position `(x, z)` with `x, z ∈ [-1200, +1200]` (uniform random) **And** position is NOT always `[0, 0, 0]`

5. **Given** `usePlayer.reset()` is called (new run) **When** a new gameplay session starts **Then** position is set to a random spawn within the 1200-unit range

6. **Given** `usePlayer.resetForNewSystem()` is called (tunnel transition) **When** the player enters a new system **Then** position is set to a random spawn within the 1200-unit range

7. **Given** GameLoop calls to `initializePlanets()` **When** the function is invoked **Then** it receives both `galaxyConfig` (from `getGalaxyById(selectedGalaxyId)`) and `luckValue` (from `usePlayer.getState().getLuckStat()`)

8. **Given** `GAME_CONFIG.PLANET_COUNT_SILVER`, `PLANET_COUNT_GOLD`, `PLANET_COUNT_PLATINUM` **When** the story is complete **Then** these constants are no longer used in `useLevel.jsx` (they may remain in `gameConfig.js` as dead code)

## Tasks / Subtasks

- [ ] Task 1 — Rewrite `initializePlanets()` in `useLevel.jsx` (AC: #1, #2, #3, #8)
  - [ ] 1.1 Change signature to `initializePlanets(galaxyConfig, luckValue = 0)`
  - [ ] 1.2 Implement luck-weighted type distribution (see Dev Notes for full algorithm)
  - [ ] 1.3 Generate exactly `galaxyConfig.planetCount` planets (15 for Andromeda)
  - [ ] 1.4 Remove `GAME_CONFIG.PLANET_COUNT_SILVER/GOLD/PLATINUM` usage — keep spatial constraint constants

- [ ] Task 2 — Randomize player spawn in `usePlayer.jsx` (AC: #4, #5, #6)
  - [ ] 2.1 In `reset()`: replace `position: [0, 0, 0]` with random spawn in `[-1200, +1200]`
  - [ ] 2.2 In `resetForNewSystem()`: replace `position: [0, 0, 0]` with random spawn in `[-1200, +1200]`

- [ ] Task 3 — Update GameLoop.jsx calls to `initializePlanets()` (AC: #7)
  - [ ] 3.1 Ensure `getGalaxyById` is imported in `GameLoop.jsx`
  - [ ] 3.2 At line ~141 (tunnel→gameplay): pass `(getGalaxyById(useGame.getState().selectedGalaxyId), usePlayer.getState().getLuckStat())`
  - [ ] 3.3 At line ~162 (new game start): same replacement

- [ ] Task 4 — Rewrite `useLevel.planets.test.js` (AC: #1, #2, #3)
  - [ ] 4.1 Define `MOCK_GALAXY_CONFIG` fixture matching Andromeda Reach
  - [ ] 4.2 Update total count test: 15 planets
  - [ ] 4.3 Add test: all planet typeIds are PLANET_CINDER / PLANET_PULSE / PLANET_VOID
  - [ ] 4.4 Keep spatial constraint tests — update call signature
  - [ ] 4.5 Add luck distribution test: run 50 iterations at luck=0 vs luck=8, compare PULSE+VOID averages

- [ ] Task 5 — Update all other test files calling `initializePlanets()` (AC: #7)
  - [ ] 5.1 `resetFlow.test.js` lines 22, 51: add `MOCK_GALAXY_CONFIG` and pass to calls
  - [ ] 5.2 `runContinuity.test.js` line 44: same
  - [ ] 5.3 `useLevel.systemTransition.test.js` lines 33, 136, 150, 242: same

- [ ] Task 6 — Update `usePlayer.systemTransition.test.js` position assertions (AC: #5, #6)
  - [ ] 6.1 Find all tests that assert `position: [0, 0, 0]` after `resetForNewSystem()` and update them to assert within-bounds instead

- [ ] Task 7 — Add player spawn tests (AC: #4, #5, #6)
  - [ ] 7.1 Add to appropriate test file: `reset()` sets position within `[-1200, 1200]` range
  - [ ] 7.2 Add: `reset()` does not always spawn at `[0, 0, 0]` (10 iterations check)
  - [ ] 7.3 Add: `resetForNewSystem()` sets position within `[-1200, 1200]` range

- [ ] Task 8 — Run all tests and verify (AC: all)
  - [ ] 8.1 `npx vitest run` — all tests must pass

## Dev Notes

### Dependency on Story 34.1 — MUST Be Done First

This story assumes Story 34.1 is **complete** before implementation begins. The following are in place after 34.1:
- `planetDefs.js` has `PLANET_CINDER` (standard), `PLANET_PULSE` (rare), `PLANET_VOID` (legendary) — old SILVER/GOLD/PLATINUM removed
- `galaxyDefs.js` has full Andromeda Reach profile with `planetCount: 15`, `planetRarity`, `luckRarityBias`, etc.
- `useLevel.jsx` `initializePlanets()` already uses `PLANET_CINDER/PULSE/VOID` typeIds (but still with old static count logic)

### `initializePlanets(galaxyConfig, luckValue)` — Full Implementation

Replace the entire function body in `useLevel.jsx`:

```js
initializePlanets: (galaxyConfig, luckValue = 0) => {
  const planets = []
  const margin = GAME_CONFIG.PLANET_PLACEMENT_MARGIN
  const minCenter = GAME_CONFIG.PLANET_MIN_DISTANCE_FROM_CENTER
  const minBetween = GAME_CONFIG.PLANET_MIN_DISTANCE_BETWEEN
  const range = GAME_CONFIG.PLAY_AREA_SIZE - margin

  // Luck-adjusted weights (clamped to min 0)
  const base = galaxyConfig.planetRarity
  const bias = galaxyConfig.luckRarityBias
  const weights = {
    standard:  Math.max(0, base.standard  + bias.standard  * luckValue),
    rare:      Math.max(0, base.rare      + bias.rare      * luckValue),
    legendary: Math.max(0, base.legendary + bias.legendary * luckValue),
  }
  const totalWeight = weights.standard + weights.rare + weights.legendary

  // Rarity → typeId mapping
  const TYPE_MAP = {
    standard:  'PLANET_CINDER',
    rare:      'PLANET_PULSE',
    legendary: 'PLANET_VOID',
  }

  for (let i = 0; i < galaxyConfig.planetCount; i++) {
    // Weighted random roll for type
    const roll = Math.random() * totalWeight
    let typeId
    if (roll < weights.standard) {
      typeId = TYPE_MAP.standard
    } else if (roll < weights.standard + weights.rare) {
      typeId = TYPE_MAP.rare
    } else {
      typeId = TYPE_MAP.legendary
    }

    const def = PLANETS[typeId]

    // Spatial placement with constraints
    let x, z, valid
    let attempts = 0
    do {
      x = (Math.random() * 2 - 1) * range
      z = (Math.random() * 2 - 1) * range
      const distFromCenter = Math.sqrt(x * x + z * z)
      valid = distFromCenter >= minCenter
      if (valid) {
        for (const p of planets) {
          const dx = p.x - x, dz = p.z - z
          if (Math.sqrt(dx * dx + dz * dz) < minBetween) {
            valid = false
            break
          }
        }
      }
      attempts++
    } while (!valid && attempts < 50)

    if (attempts >= 50) {
      console.warn(`Planet placement: ${typeId}_${i} placed after 50 failed attempts (constraints may be violated)`)
    }

    planets.push({
      id: `${typeId}_${i}`,
      typeId,
      tier: def.tier,
      x, z,
      scanned: false,
      scanProgress: 0,
    })
  }
  set({ planets })
},
```

**Spatial constraints kept:** `PLANET_PLACEMENT_MARGIN`, `PLANET_MIN_DISTANCE_FROM_CENTER`, `PLANET_MIN_DISTANCE_BETWEEN`, `PLAY_AREA_SIZE` — all from `GAME_CONFIG`. Only `PLANET_COUNT_SILVER/GOLD/PLATINUM` are eliminated.

**Note on 15 planets + constraints:** With 15 planets in a 4000×4000 unit area (±2000), `minCenter=200`, `minBetween=300`, placement may fail on some iterations after ~10 planets are placed. The 50-attempt cap with `console.warn` is acceptable — identical behavior to the old code. **Do NOT change spatial constants.**

### Player Spawn Randomization in `usePlayer.jsx`

In **both** `reset()` and `resetForNewSystem()`, replace:
```js
position: [0, 0, 0],
```
With:
```js
position: [(Math.random() * 2 - 1) * 1200, 0, (Math.random() * 2 - 1) * 1200],
```

The spawn range `1200` is within `PLAY_AREA_SIZE` (2000) with comfortable margin.

**System Entry Cinematic note:** `resetForNewSystem()` is called by `TunnelHub.jsx` before the `systemEntry` phase. The `SystemEntryPortal` component subsequently calls `setCinematicPosition()` to override the position during the fly-in animation. This is intentional — the random spawn sets the starting position of the cinematic sequence. Do NOT attempt to apply random spawn AFTER the cinematic.

**No `setPosition()` action needed:** The random position is computed directly inside `reset()` and `resetForNewSystem()`. There is no need to add a new `setPosition` action to usePlayer.

### GameLoop.jsx — Updating `initializePlanets()` Call Sites

The function is called in two places in `GameLoop.jsx`:

**~Line 141 (tunnel → new system):**
```js
// Before:
useLevel.getState().initializePlanets()

// After:
const galaxyConfig = getGalaxyById(useGame.getState().selectedGalaxyId)
const luckValue = usePlayer.getState().getLuckStat()
useLevel.getState().initializePlanets(galaxyConfig, luckValue)
```

**~Line 162 (new game start):**
```js
// Same pattern — compute galaxyConfig and luckValue before the call
```

Add import at top of `GameLoop.jsx` if not present:
```js
import { getGalaxyById } from './entities/galaxyDefs.js'
```

**Null safety:** `getGalaxyById(null)` returns `null`. If `selectedGalaxyId` is somehow null, `initializePlanets` receives null. Since `galaxyConfig.planetRarity` would crash, add defensive check:
```js
const galaxyConfig = getGalaxyById(useGame.getState().selectedGalaxyId)
if (!galaxyConfig) {
  console.warn('[GameLoop] No galaxyConfig available — skipping initializePlanets')
  return
}
```
In practice, `selectedGalaxyId` is always set before `gameplay` phase (set during galaxy choice screen, Story 25.3). This guard is purely defensive.

### Test — `useLevel.planets.test.js` Full Rewrite

```js
import { describe, it, expect, beforeEach } from 'vitest'
import useLevel from '../useLevel.jsx'
import { GAME_CONFIG } from '../../config/gameConfig.js'

// Andromeda Reach fixture
const MOCK_GALAXY_CONFIG = {
  planetCount: 15,
  planetRarity: { standard: 8, rare: 5, legendary: 2 },
  luckRarityBias: { standard: -0.15, rare: 0.10, legendary: 0.05 },
}

describe('useLevel — initializePlanets (Story 34.2)', () => {
  beforeEach(() => {
    useLevel.getState().reset()
  })

  it('generates exactly planetCount planets from galaxyConfig', () => {
    useLevel.getState().initializePlanets(MOCK_GALAXY_CONFIG, 0)
    expect(useLevel.getState().planets).toHaveLength(15)
  })

  it('all planet typeIds are valid Redshift types', () => {
    useLevel.getState().initializePlanets(MOCK_GALAXY_CONFIG, 0)
    const validTypes = new Set(['PLANET_CINDER', 'PLANET_PULSE', 'PLANET_VOID'])
    for (const p of useLevel.getState().planets) {
      expect(validTypes.has(p.typeId)).toBe(true)
    }
  })

  it('each planet has required state fields', () => {
    useLevel.getState().initializePlanets(MOCK_GALAXY_CONFIG, 0)
    for (const p of useLevel.getState().planets) {
      expect(p).toHaveProperty('id')
      expect(p).toHaveProperty('typeId')
      expect(p).toHaveProperty('tier')
      expect(typeof p.x).toBe('number')
      expect(typeof p.z).toBe('number')
      expect(p.scanned).toBe(false)
      expect(p.scanProgress).toBe(0)
    }
  })

  it('all planets within play area bounds minus margin', () => {
    useLevel.getState().initializePlanets(MOCK_GALAXY_CONFIG, 0)
    const range = GAME_CONFIG.PLAY_AREA_SIZE - GAME_CONFIG.PLANET_PLACEMENT_MARGIN
    for (const p of useLevel.getState().planets) {
      expect(Math.abs(p.x)).toBeLessThanOrEqual(range)
      expect(Math.abs(p.z)).toBeLessThanOrEqual(range)
    }
  })

  it('no planet closer than MIN_DISTANCE_FROM_CENTER to world center', () => {
    useLevel.getState().initializePlanets(MOCK_GALAXY_CONFIG, 0)
    for (const p of useLevel.getState().planets) {
      const dist = Math.sqrt(p.x * p.x + p.z * p.z)
      expect(dist).toBeGreaterThanOrEqual(GAME_CONFIG.PLANET_MIN_DISTANCE_FROM_CENTER)
    }
  })

  it('each planet has a unique id', () => {
    useLevel.getState().initializePlanets(MOCK_GALAXY_CONFIG, 0)
    const ids = useLevel.getState().planets.map(p => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('luck=8 produces measurably more PULSE+VOID than luck=0 over 50 runs', () => {
    let sumRareLuck0 = 0
    let sumRareLuck8 = 0
    const RUNS = 50

    for (let r = 0; r < RUNS; r++) {
      useLevel.getState().initializePlanets(MOCK_GALAXY_CONFIG, 0)
      const planets = useLevel.getState().planets
      sumRareLuck0 += planets.filter(p => p.typeId !== 'PLANET_CINDER').length
    }
    for (let r = 0; r < RUNS; r++) {
      useLevel.getState().initializePlanets(MOCK_GALAXY_CONFIG, 8)
      const planets = useLevel.getState().planets
      sumRareLuck8 += planets.filter(p => p.typeId !== 'PLANET_CINDER').length
    }

    // luck=8 should shift distribution toward PULSE+VOID
    expect(sumRareLuck8 / RUNS).toBeGreaterThan(sumRareLuck0 / RUNS)
  })

  it('reset() clears planets array', () => {
    useLevel.getState().initializePlanets(MOCK_GALAXY_CONFIG, 0)
    expect(useLevel.getState().planets.length).toBeGreaterThan(0)
    useLevel.getState().reset()
    expect(useLevel.getState().planets).toEqual([])
  })
})
```

### Test — Other Files Using `initializePlanets()`

Add to the top of each affected file:
```js
const MOCK_GALAXY_CONFIG = {
  planetCount: 7,  // Small count for test speed — same code path as 15
  planetRarity: { standard: 4, rare: 2, legendary: 1 },
  luckRarityBias: { standard: -0.15, rare: 0.10, legendary: 0.05 },
}
```

Replace all `useLevel.getState().initializePlanets()` with `useLevel.getState().initializePlanets(MOCK_GALAXY_CONFIG)`.

Files to update:
- `src/stores/__tests__/resetFlow.test.js` — lines 22, 51
- `src/stores/__tests__/runContinuity.test.js` — line 44
- `src/stores/__tests__/useLevel.systemTransition.test.js` — lines 33, 136, 150, 242

### Test — Player Spawn (update `usePlayer.systemTransition.test.js`)

Find tests asserting exact position `[0, 0, 0]` after `resetForNewSystem()`. Update them to assert within-bounds:
```js
// Before:
expect(usePlayer.getState().position).toEqual([0, 0, 0])

// After:
const [px, py, pz] = usePlayer.getState().position
expect(py).toBe(0)
expect(Math.abs(px)).toBeLessThanOrEqual(1200)
expect(Math.abs(pz)).toBeLessThanOrEqual(1200)
```

Add spawn tests (in a new describe block in an appropriate player test file):
```js
describe('usePlayer — random spawn (Story 34.2)', () => {
  it('reset() sets position within [-1200, 1200] range', () => {
    usePlayer.getState().reset()
    const [x, y, z] = usePlayer.getState().position
    expect(y).toBe(0)
    expect(Math.abs(x)).toBeLessThanOrEqual(1200)
    expect(Math.abs(z)).toBeLessThanOrEqual(1200)
  })

  it('reset() does not always spawn at [0, 0, 0] (10 iterations)', () => {
    const positions = []
    for (let i = 0; i < 10; i++) {
      usePlayer.getState().reset()
      positions.push([...usePlayer.getState().position])
    }
    const allAtOrigin = positions.every(([x, , z]) => x === 0 && z === 0)
    expect(allAtOrigin).toBe(false)
  })

  it('resetForNewSystem() sets position within [-1200, 1200] range', () => {
    usePlayer.getState().resetForNewSystem()
    const [x, y, z] = usePlayer.getState().position
    expect(y).toBe(0)
    expect(Math.abs(x)).toBeLessThanOrEqual(1200)
    expect(Math.abs(z)).toBeLessThanOrEqual(1200)
  })
})
```

### Architecture Notes

This story operates at the **Store → GameLoop** boundary:
- `useLevel.jsx` (Store): `initializePlanets` signature + luck algorithm
- `usePlayer.jsx` (Store): spawn position randomization
- `GameLoop.jsx` (GameLoop): wires galaxyConfig + luckValue to `initializePlanets`

The luck-weighted algorithm is intentionally simple: per-planet weighted random roll, no integer rounding or floor-adjustment. Natural variance is acceptable — the AC confirms "approximately" and "measurably" rather than exact counts.

### What This Story Does NOT Do

- Does NOT implement wormhole scan-based trigger (Story 34.4)
- Does NOT implement procedural system names (Story 34.3)
- Does NOT connect `enemySpeedMult` or `difficultyScalingPerSystem` to GameLoop (Story 34.5)
- Does NOT rename `GAME_CONFIG.PLANET_COUNT_SILVER/GOLD/PLATINUM` — they become dead code naturally
- Does NOT change planet placement algorithm or spatial constraints

### Project Structure Notes

Files touched:
- `src/stores/useLevel.jsx` — `initializePlanets` rewrite (lines 105-155)
- `src/stores/usePlayer.jsx` — `reset()` line ~568 and `resetForNewSystem()` line ~536
- `src/GameLoop.jsx` — two call sites for `initializePlanets()` (~lines 141, 162)
- `src/stores/__tests__/useLevel.planets.test.js` — full rewrite
- `src/stores/__tests__/resetFlow.test.js` — add fixture, update calls
- `src/stores/__tests__/runContinuity.test.js` — add fixture, update call
- `src/stores/__tests__/useLevel.systemTransition.test.js` — update calls
- `src/stores/__tests__/usePlayer.systemTransition.test.js` — update position assertions

### References

- [Source: _bmad-output/planning-artifacts/epic-34-galaxy-system-foundation.md#Story 34.2]
- [Source: _bmad-output/planning-artifacts/epic-34-galaxy-system-foundation.md#Luck-weighted roll]
- [Source: _bmad-output/planning-artifacts/epic-34-galaxy-system-foundation.md#Player spawn in reset/initSystem]
- [Source: src/stores/useLevel.jsx#105-155] — current `initializePlanets()` (to be replaced)
- [Source: src/stores/usePlayer.jsx#535-562] — `resetForNewSystem()`: position [0,0,0] to randomize
- [Source: src/stores/usePlayer.jsx#564-611] — `reset()`: position [0,0,0] to randomize
- [Source: src/GameLoop.jsx#141] — `initializePlanets()` on tunnel→gameplay transition
- [Source: src/GameLoop.jsx#162] — `initializePlanets()` on new game start
- [Source: src/config/gameConfig.js#168-170] — PLANET_COUNT_SILVER=4, GOLD=2, PLATINUM=1 (dead code after this story)
- [Source: src/entities/galaxyDefs.js] — `getGalaxyById()` function
- [Source: src/stores/useGame.jsx#22] — `selectedGalaxyId` field
- [Source: src/stores/usePlayer.jsx#282-289] — `getLuckStat()` method (ship + permanent + boon luck)
- [Source: src/stores/__tests__/useLevel.planets.test.js] — full rewrite
- [Source: src/stores/__tests__/resetFlow.test.js#22,51] — calls to update
- [Source: src/stores/__tests__/runContinuity.test.js#44] — call to update
- [Source: src/stores/__tests__/useLevel.systemTransition.test.js#33,136,150,242] — calls to update
- [Source: src/stores/__tests__/usePlayer.systemTransition.test.js] — position assertions to update

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
