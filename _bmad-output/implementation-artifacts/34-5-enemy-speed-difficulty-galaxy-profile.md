# Story 34.5: Enemy Speed & Difficulty from Galaxy Profile

Status: done

## Story

As a developer,
I want enemy speed and per-system difficulty scaling to be driven by the galaxy profile,
so that different galaxies can have distinct feels without modifying hardcoded config.

## Acceptance Criteria

1. **Given** `spawnEnemies()` in GameLoop **When** enemies are spawned in Andromeda Reach **Then** each enemy's base speed is multiplied by `galaxyConfig.enemySpeedMult` (1.5) in addition to existing system scaling **And** the effective speed for FODDER_BASIC at system 1 is ≥ 25 (17 × 1.5)

2. **Given** per-system difficulty scaling **When** entering system N of Andromeda Reach **Then** HP multiplier = `galaxyConfig.difficultyScalingPerSystem.hp ^ (N-1)` (system 1: ×1.0, system 2: ×1.25, system 3: ×1.5625) **And** same formula applies to damage, speed, xpReward multipliers **And** these galaxy-derived multipliers REPLACE `GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM` for galaxies that define `difficultyScalingPerSystem`

3. **Given** `GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM` **When** a galaxy defines `difficultyScalingPerSystem` **Then** the galaxy config takes precedence; `ENEMY_SCALING_PER_SYSTEM` is used as fallback only if no galaxy scaling is defined

## Tasks / Subtasks

- [x] Task 1 — Update `systemScaling` computation in `GameLoop.jsx` (AC: #1, #2, #3)
  - [x] 1.1 Locate the `systemScaling` line at ~line 286: `const systemScaling = GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[currentSystem] || ...`
  - [x] 1.2 Replace with the galaxy-aware block (see Dev Notes for exact code)
  - [x] 1.3 Read `selectedGalaxyId` from `useGame.getState()` and call `getGalaxyById()`
  - [x] 1.4 Guard: if `gc?.difficultyScalingPerSystem` exists, use galaxy formula; else fall back

- [x] Task 2 — Verify `getGalaxyById` import in `GameLoop.jsx` (AC: #1)
  - [x] 2.1 Check first 30 lines of `GameLoop.jsx` for `import { getGalaxyById } from './entities/galaxyDefs.js'`
  - [x] 2.2 If missing (Story 34.2 not yet done), add it alongside existing entity imports

- [x] Task 3 — Write `src/stores/__tests__/useEnemies.galaxyScaling.test.js` (AC: #1, #2, #3)
  - [x] 3.1 Test: system 1 — hp/damage/xpReward ×1.0, speed ×1.5 (enemySpeedMult only)
  - [x] 3.2 Test: system 2 — hp ×1.25, speed ×1.65 (1.10^1 × 1.5), damage ×1.20, xpReward ×1.15
  - [x] 3.3 Test: system 3 — hp ×1.5625, speed ≈1.815 (1.10^2 × 1.5)
  - [x] 3.4 Test: FODDER_BASIC effective speed at system 1 = 17 × 1.5 = 25.5 ≥ 25 (AC #1)
  - [x] 3.5 Test: fallback — when `gc` is null, returns `GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[1]`
  - [x] 3.6 Test: fallback — when `gc` has no `difficultyScalingPerSystem`, returns hardcoded scaling

- [x] Task 4 — Run all tests (AC: all)
  - [x] 4.1 `npx vitest run` — all existing tests pass
  - [x] 4.2 `useEnemies.galaxyScaling.test.js` runs green

## Dev Notes

### Dependency — Story 34.1 Must Be Complete First

Story 34.5 requires `getGalaxyById('andromeda_reach')` to return `enemySpeedMult: 1.5` and `difficultyScalingPerSystem: { hp: 1.25, damage: 1.20, speed: 1.10, xpReward: 1.15 }` — both added by Story 34.1.

Current `galaxyDefs.js` (pre-34.1) does NOT have these fields. Implement Story 34.1 first, or apply a null-safe fallback: `gc?.difficultyScalingPerSystem` and `gc?.enemySpeedMult ?? 1.0`.

### Dependency — `getGalaxyById` Import (Story 34.2)

Story 34.2 adds to `GameLoop.jsx`:
```js
import { getGalaxyById } from './entities/galaxyDefs.js'
```
**If Story 34.2 is not yet done**, add this import manually to `GameLoop.jsx`.

As of this writing, the current `GameLoop.jsx` (lines 1–30) does NOT include `getGalaxyById` in its imports. Verify before implementing.

### `GameLoop.jsx` — Exact Change

**Location:** Inside the `if (wormholeStatePre !== 'activating' && wormholeStatePre !== 'active' && !useGame.getState()._debugSpawnPaused)` block, approximately line 285.

**BEFORE (one-liner, ~line 286):**
```js
const systemScaling = GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[currentSystem] || GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[1]
```

**AFTER — galaxy-aware block:**
```js
// Story 34.5: Compute system difficulty from galaxy profile (fallback to hardcoded config)
const _selectedGalaxyId = useGame.getState().selectedGalaxyId
const _gc = getGalaxyById(_selectedGalaxyId)
let systemScaling
if (_gc?.difficultyScalingPerSystem) {
  const _si = currentSystem - 1 // 0-based system index
  const _s = _gc.difficultyScalingPerSystem
  systemScaling = {
    hp:       Math.pow(_s.hp,       _si),
    damage:   Math.pow(_s.damage,   _si),
    speed:    Math.pow(_s.speed,    _si) * (_gc.enemySpeedMult ?? 1.0),
    xpReward: Math.pow(_s.xpReward, _si),
  }
} else {
  systemScaling = GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[currentSystem] || GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[1]
}
```

**Why `_` prefixes?** Avoids shadowing outer `GameLoop` variables. The `gameState` constant is captured later (~line 534) — reading fresh via `useGame.getState()` here is safe because `selectedGalaxyId` never changes mid-tick.

### Scaling Formula — Reference Table

| System | hp      | damage | speed (base × galaxy × system) | xpReward |
|--------|---------|--------|--------------------------------|----------|
| 1      | ×1.0    | ×1.0   | ×1.5 (1.0 × 1.5)              | ×1.0     |
| 2      | ×1.25   | ×1.20  | ×1.65 (1.1 × 1.5)             | ×1.15    |
| 3      | ×1.5625 | ×1.44  | ×1.815 (1.21 × 1.5)           | ×1.3225  |

→ FODDER_BASIC (base speed=17): System 1 = **25.5**, System 2 = **28.05**, System 3 = **30.86**

### Scaling Pipeline — No Changes Needed Beyond GameLoop

The full pipeline is already in place:

1. `GameLoop.jsx` computes `systemScaling` → passes to `spawnSystemRef.current.tick(..., { systemScaling })`
2. `spawnSystem.js` (`src/systems/spawnSystem.js` ~line 147, 168) forwards it into each spawn instruction: `{ typeId, x, z, scaling: systemScaling }`
3. `useEnemies.spawnEnemies(instructions)` (`src/stores/useEnemies.jsx` ~lines 99-107) reads `instruction.scaling` → applies per-stat:
   ```js
   const hpMult    = scaling?.hp       ?? difficultyMult
   const speedMult = scaling?.speed    ?? difficultyMult
   const damageMult= scaling?.damage   ?? difficultyMult
   const xpMult    = scaling?.xpReward ?? difficultyMult
   // Applied at:
   speed: def.speed * speedMult
   hp:    Math.round(def.hp * hpMult)
   ```

**No changes needed in `spawnSystem.js` or `useEnemies.jsx`.** The only code change is the `systemScaling` block in `GameLoop.jsx`.

### New Test File — `src/stores/__tests__/useEnemies.galaxyScaling.test.js`

```js
import { describe, it, expect } from 'vitest'
import { GAME_CONFIG } from '../../config/gameConfig.js'
import { ENEMIES } from '../../entities/enemyDefs.js'

// Galaxy profile for Andromeda Reach (matches galaxyDefs.js post-34.1)
const MOCK_GALAXY_CONFIG = {
  id: 'andromeda_reach',
  enemySpeedMult: 1.5,
  difficultyScalingPerSystem: {
    hp:       1.25,
    damage:   1.20,
    speed:    1.10,
    xpReward: 1.15,
  },
}

// Pure function — mirrors the GameLoop logic (Story 34.5)
function computeSystemScaling(gc, currentSystem) {
  if (gc?.difficultyScalingPerSystem) {
    const si = currentSystem - 1
    const s = gc.difficultyScalingPerSystem
    return {
      hp:       Math.pow(s.hp,       si),
      damage:   Math.pow(s.damage,   si),
      speed:    Math.pow(s.speed,    si) * (gc.enemySpeedMult ?? 1.0),
      xpReward: Math.pow(s.xpReward, si),
    }
  }
  return GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[currentSystem] || GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[1]
}

describe('computeSystemScaling — galaxy profile (Story 34.5)', () => {
  describe('Andromeda Reach — System 1 (systemIndex=0)', () => {
    it('hp multiplier is 1.0 (x^0 = 1)', () => {
      expect(computeSystemScaling(MOCK_GALAXY_CONFIG, 1).hp).toBeCloseTo(1.0)
    })

    it('damage multiplier is 1.0', () => {
      expect(computeSystemScaling(MOCK_GALAXY_CONFIG, 1).damage).toBeCloseTo(1.0)
    })

    it('speed multiplier is 1.5 (1.10^0 × 1.5 = 1.5)', () => {
      expect(computeSystemScaling(MOCK_GALAXY_CONFIG, 1).speed).toBeCloseTo(1.5)
    })

    it('xpReward multiplier is 1.0', () => {
      expect(computeSystemScaling(MOCK_GALAXY_CONFIG, 1).xpReward).toBeCloseTo(1.0)
    })

    it('FODDER_BASIC effective speed ≥ 25 — AC #1 (17 × 1.5 = 25.5)', () => {
      const scaling = computeSystemScaling(MOCK_GALAXY_CONFIG, 1)
      const effectiveSpeed = ENEMIES.FODDER_BASIC.speed * scaling.speed
      expect(effectiveSpeed).toBeGreaterThanOrEqual(25)
    })
  })

  describe('Andromeda Reach — System 2 (systemIndex=1)', () => {
    it('hp multiplier is 1.25 (1.25^1)', () => {
      expect(computeSystemScaling(MOCK_GALAXY_CONFIG, 2).hp).toBeCloseTo(1.25)
    })

    it('speed multiplier is 1.65 (1.10^1 × 1.5)', () => {
      expect(computeSystemScaling(MOCK_GALAXY_CONFIG, 2).speed).toBeCloseTo(1.65)
    })

    it('damage multiplier is 1.20 (1.20^1)', () => {
      expect(computeSystemScaling(MOCK_GALAXY_CONFIG, 2).damage).toBeCloseTo(1.20)
    })

    it('xpReward multiplier is 1.15 (1.15^1)', () => {
      expect(computeSystemScaling(MOCK_GALAXY_CONFIG, 2).xpReward).toBeCloseTo(1.15)
    })
  })

  describe('Andromeda Reach — System 3 (systemIndex=2)', () => {
    it('hp multiplier is 1.5625 (1.25^2)', () => {
      expect(computeSystemScaling(MOCK_GALAXY_CONFIG, 3).hp).toBeCloseTo(1.5625)
    })

    it('speed multiplier ≈ 1.815 (1.10^2 × 1.5)', () => {
      expect(computeSystemScaling(MOCK_GALAXY_CONFIG, 3).speed).toBeCloseTo(1.815)
    })

    it('damage multiplier is 1.44 (1.20^2)', () => {
      expect(computeSystemScaling(MOCK_GALAXY_CONFIG, 3).damage).toBeCloseTo(1.44)
    })
  })

  describe('Fallback — no galaxy config (AC #3)', () => {
    it('null galaxy → returns GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[1]', () => {
      expect(computeSystemScaling(null, 1)).toEqual(GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[1])
    })

    it('galaxy without difficultyScalingPerSystem → returns hardcoded scaling for system 2', () => {
      const bareGalaxy = { id: 'bare', enemySpeedMult: 1.0 }
      expect(computeSystemScaling(bareGalaxy, 2)).toEqual(GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[2])
    })

    it('null galaxy at system 3 → returns hardcoded scaling for system 3', () => {
      expect(computeSystemScaling(null, 3)).toEqual(GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM[3])
    })
  })
})
```

### What This Story Does NOT Do

- Does NOT modify `spawnSystem.js` — pipeline already passes `scaling` correctly
- Does NOT modify `useEnemies.jsx` — already applies per-stat scaling from instruction
- Does NOT deprecate `GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM` — it remains as the fallback
- Does NOT affect boss HP scaling (boss uses a separate path in `useBoss.jsx`)
- Does NOT change `galaxyDefs.js` (managed by Story 34.1)
- Does NOT rename planet types (Story 34.1 scope)
- Does NOT change the wormhole trigger logic (Story 34.4)

### Architecture Compliance

- **6-layer architecture**: Change is in GameLoop layer only — no store actions, no new stores
- **Pattern consistency**: reads `galaxyConfig` inside the spawn guard block (same approach as Story 34.4's `scanGalaxyConfig` read in the scan completion block)
- **No per-frame object creation**: `systemScaling` is created once per spawn event (spawnTimer fires, not every frame)
- **SFX**: no SFX changes
- **Reset**: no changes needed — scaling is recomputed live from store state each time enemies spawn

### Project Structure Notes

Files touched:
- `src/GameLoop.jsx` — replace `systemScaling` one-liner with galaxy-aware block (~line 286)
- `src/stores/__tests__/useEnemies.galaxyScaling.test.js` — NEW test file (13 tests)

Files NOT touched:
- `src/systems/spawnSystem.js`
- `src/stores/useEnemies.jsx`
- `src/config/gameConfig.js` (`ENEMY_SCALING_PER_SYSTEM` kept as fallback — do NOT remove)
- `src/entities/galaxyDefs.js` (managed by Story 34.1)
- `src/entities/enemyDefs.js`
- All other stores and systems

### References

- [Source: _bmad-output/planning-artifacts/epic-34-galaxy-system-foundation.md#Story 34.5]
- [Source: src/GameLoop.jsx#284-293] — current `systemScaling` computation and `spawnSystem.tick()` call site
- [Source: src/systems/spawnSystem.js#147, 168] — spawn instructions include `scaling: systemScaling`
- [Source: src/systems/spawnSystem.js#64-75] — `tick()` accepts `systemScaling` in options
- [Source: src/stores/useEnemies.jsx#99-107] — `spawnEnemies()` applies per-stat multipliers from `instruction.scaling`
- [Source: src/config/gameConfig.js#252-258] — `ENEMY_SCALING_PER_SYSTEM` fallback (kept)
- [Source: src/entities/enemyDefs.js#16-31] — `FODDER_BASIC.speed = 17` (base speed for AC #1)
- [Source: src/stores/useGame.jsx#22] — `selectedGalaxyId` field
- [Source: src/entities/galaxyDefs.js#23-25] — `getGalaxyById()` function
- [Source: _bmad-output/implementation-artifacts/34-4-wormhole-scan-based-trigger.md#Dev Notes] — `scanGalaxyConfig` pattern for reading galaxyConfig inside GameLoop

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

(none)

### Completion Notes List

- **Task 2**: `getGalaxyById` was already imported at line 30 of `GameLoop.jsx` (added by Story 34.2) — no change needed.
- **Task 1**: Replaced the `systemScaling` one-liner (line 299) with the galaxy-aware block. Reads `selectedGalaxyId` from `useGame.getState()`, calls `getGalaxyById()`, and uses `Math.pow(s.stat, systemIndex)` formula for exponential per-system scaling. Falls back to `GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM` when no galaxy or no `difficultyScalingPerSystem`.
- **Task 3**: Created `useEnemies.galaxyScaling.test.js` with 15 tests covering all 3 AC scenarios (system 1/2/3 multipliers, FODDER_BASIC speed ≥ 25, and null/bare-galaxy fallbacks).
- **Task 4**: Full suite — 136 test files, 2318 tests, 0 failures.

### File List

- `src/GameLoop.jsx` (modified — replaced systemScaling one-liner with galaxy-aware block, ~line 299; cache optimization added)
- `src/stores/__tests__/useEnemies.galaxyScaling.test.js` (new — 16 tests for AC #1, #2, #3)

### Change Log

- 2026-02-23: Story 34.5 implemented — enemy speed and per-system difficulty scaling now driven by galaxy profile (`galaxyDefs.js`). `GameLoop.jsx` `systemScaling` block replaced with exponential formula using `difficultyScalingPerSystem` fields; fallback to `GAME_CONFIG.ENEMY_SCALING_PER_SYSTEM` when galaxy has no scaling config. 15 new tests added.
- 2026-02-23: Code review (AI) — 2 MEDIUM fixed: (1) per-frame object allocation eliminated via `systemScalingCacheKeyRef`/`systemScalingCachedRef` — `getGalaxyById()` and Math.pow now called only on system transition, not at 60fps; (2) cache invalidated on new game start in the new-game reset block. 1 LOW fixed: added missing xpReward system 3 test (1.15^2 = 1.3225) → 16 tests total.
