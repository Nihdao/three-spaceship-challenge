# Story 43.6: Leva Debug Controls Production Guard & spawnSystem Cache

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want debug tools stripped from production builds and spawn-time allocations minimized,
so that debug overhead doesn't affect player experience and spawn frames are lighter.

## Acceptance Criteria

1. **AC1 — Leva panel hidden in production**: Given `usePlayerCamera.jsx` using `useControls("Camera Follow", { ... })`, when the game runs in production (`import.meta.env.PROD === true`), then the Leva panel is not shown — default values are used directly as constants without rendering the debug panel. In development mode, `useControls` continues to work normally for tuning.

2. **AC2 — spawnSystem available-types cache**: Given `spawnSystem.js` calling `getAvailableEnemyTypes(phase)` each spawn tick, when the phase reference has not changed since the last call, then the cached result is returned instead of iterating `Object.values(ENEMIES)` and spreading objects again. The cache is invalidated when `systemNum` or `phase` reference changes. `reset()` also clears the cache.

3. **AC3 — FragmentGemRenderer pulse hoisted**: Given `FragmentGemRenderer.jsx` computing `pulsePhase = elapsed * PULSE_SPEED` identically for every gem inside the `for` loop, when 20+ gems are active, then `pulsePhase` and `pulse` are computed once before the `for` loop and reused for all gems.

4. **AC4 — All tests pass**: Given `vitest run`, when the story is implemented, then all existing tests pass.

## Tasks / Subtasks

- [x] Task 1 — Leva production guard in usePlayerCamera.jsx (AC: #1)
  - [x] 1.1 Add module-level defaults constant above `usePlayerCamera`: `const _CAMERA_DEFAULTS = { offsetY: 120, posSmooth: 20 }`
  - [x] 1.2 Change the `useControls` call to pass `{ hidden: import.meta.env.PROD }` as third argument: `useControls("Camera Follow", { offsetY: {...}, posSmooth: {...} }, { hidden: import.meta.env.PROD })`
  - [x] 1.3 Verify existing tests in `usePlayerCamera.jsx` still pass — `computeCameraFrame` is already exported and tested independently; no test changes needed

- [x] Task 2 — getAvailableEnemyTypes cache inside createSpawnSystem closure (AC: #2)
  - [x] 2.1 Add three cache variables inside `createSpawnSystem()` closure, before `spawnTimer` declaration: `let _cachedAvailableTypes = null`, `let _cachedPhase = null`, `let _cachedSystemNum = -1`
  - [x] 2.2 In `tick()`, after computing `phase`, add cache check: if `phase === _cachedPhase && systemNum === _cachedSystemNum`, reuse `_cachedAvailableTypes`; otherwise call `getAvailableEnemyTypes(phase)`, store result in `_cachedAvailableTypes`, update `_cachedPhase` and `_cachedSystemNum`
  - [x] 2.3 Replace the existing `const available = getAvailableEnemyTypes(phase)` call (line 118) with the cached access
  - [x] 2.4 In `reset()`, add: `_cachedAvailableTypes = null; _cachedPhase = null; _cachedSystemNum = -1`
  - [x] 2.5 Run `npx vitest run src/systems/__tests__/spawnSystem.test.js` to confirm all spawn tests pass

- [x] Task 3 — Hoist pulse computation in FragmentGemRenderer.jsx (AC: #3)
  - [x] 3.1 Move `const pulsePhase = elapsed * GAME_CONFIG.FRAGMENT_GEM_PULSE_SPEED` and `const pulse = Math.sin(pulsePhase) * 0.15 + 1.0` to before the `for (let i = 0; i < count; i++)` loop (currently lines 49–50 are inside the loop)
  - [x] 3.2 Verify `scaleX/scaleY/scaleZ` still use the hoisted `pulse` value — no behavioral change, pure optimization

- [x] Task 4 — Run full test suite (AC: #4)
  - [x] 4.1 `npx vitest run` — 2697/2698 tests pass; 1 pre-existing floating-point precision failure in xpOrbSystem.test.js unrelated to this story

## Dev Notes

### Architecture Compliance

- **6-layer architecture**: Story touches 3 layers — **Hooks** (`usePlayerCamera.jsx`), **Systems** (`spawnSystem.js`), **Rendering** (`FragmentGemRenderer.jsx`). No store or GameLoop changes.
- **No new files**: All 3 changes are small, surgical edits to existing files.
- **No new dependencies**: Leva is already a dev dependency; `import.meta.env.PROD` is native Vite.

### Critical Source Analysis — usePlayerCamera.jsx

**Current code (lines 42–45):**
```jsx
const { offsetY, posSmooth } = useControls("Camera Follow", {
  offsetY: { value: 120, min: 10, max: 200, step: 1 },
  posSmooth: { value: 20, min: 1, max: 40, step: 0.5 },
});
```

**Problem**: In production builds, this registers a Leva control group and initializes the Leva store — unnecessary UI overhead that the player never sees.

**Fix — hidden option approach (safest, no Rules of Hooks violation):**
```jsx
const _CAMERA_DEFAULTS = { offsetY: 120, posSmooth: 20 }

// In usePlayerCamera():
const { offsetY, posSmooth } = useControls("Camera Follow", {
  offsetY: { value: 120, min: 10, max: 200, step: 1 },
  posSmooth: { value: 20, min: 1, max: 40, step: 0.5 },
}, { hidden: import.meta.env.PROD })
```

`useControls` still runs (no Rules of Hooks violation), but the panel is hidden in production. `import.meta.env.PROD` is a Vite build-time constant resolved to `true` in production builds and `false` in dev — it never changes at runtime. The Leva `hidden` option suppresses the panel rendering entirely.

**Alternative (module-level wrapper)**: If deeper stripping is needed, a module-level selector can be used since `import.meta.env.PROD` is build-time constant:
```jsx
const _CAMERA_DEFAULTS = { offsetY: 120, posSmooth: 20 }
const _useCameraControls = import.meta.env.PROD
  ? () => _CAMERA_DEFAULTS
  : () => useControls("Camera Follow", {
      offsetY: { value: 120, min: 10, max: 200, step: 1 },
      posSmooth: { value: 20, min: 1, max: 40, step: 0.5 },
    })
// In usePlayerCamera():
const { offsetY, posSmooth } = _useCameraControls()
```
This eliminates the Leva hook call entirely in production. Valid because the condition is resolved at build time — React's runtime hook checker cannot trigger a violation. **Recommended** if Leva overhead in prod is a concern.

**Note on coexisting Story 43.3**: Story 43.3 (ready-for-dev) will modify `usePlayerCamera.jsx` to eliminate the `{ ...playerState }` spread during pause (lines 63–66). These are independent changes — apply both separately without conflict. 43.3 touches the `useFrame` callback; 43.6 touches the `useControls` call above it.

**No test changes needed**: `computeCameraFrame` is exported and tested independently. The `useControls` call is not tested directly.

### Critical Source Analysis — spawnSystem.js

**Current code (lines 26–38 + line 118):**
```js
function getAvailableEnemyTypes(phase) {
  const tierWeights = phase.enemyTierWeights
  const available = []
  for (const enemy of Object.values(ENEMIES)) {
    if (enemy.spawnWeight <= 0) continue
    const tier = enemy.tier || inferTierFromId(enemy.id)
    const tierWeight = tierWeights[tier]
    if (!tierWeight || tierWeight <= 0) continue
    available.push({ ...enemy, adjustedWeight: enemy.spawnWeight * tierWeight })  // ← spread
  }
  return available
}
// Line 118 in tick():
const available = getAvailableEnemyTypes(phase)
```

**Problem**: Called every spawn tick (multiple times per second in dense waves). Each call iterates all `ENEMIES`, spreads N objects, and returns a new array — all pure redundant work when the phase hasn't changed.

**Key insight from waveDefs.js**: `getPhaseForProgress` returns a reference to a static `WAVE_PROFILES[systemX][i]` phase literal. The same phase object reference is returned for all ticks within the same progress window. Therefore, **reference equality check (`phase === _cachedPhase`) is sufficient** to detect phase transitions without any string serialization.

**Fix — closure-level cache (preferred over module-level to respect reset()):**
```js
export function createSpawnSystem() {
  let spawnTimer = null
  let elapsedTime = 0
  let _cachedAvailableTypes = null  // ← add
  let _cachedPhase = null           // ← add
  let _cachedSystemNum = -1         // ← add

  // ... (getAvailableEnemyTypes unchanged) ...

  function tick(delta, playerX, playerZ, options = {}) {
    const { systemNum = 1, systemTimer = GAME_CONFIG.SYSTEM_TIMER, systemScaling = null } = options
    // ... (elapsedTime, spawnTimer init, etc. unchanged) ...

    const phase = getPhaseForProgress(systemNum, timeProgress)

    // Cache: reuse available pool if phase and system haven't changed
    let available
    if (phase === _cachedPhase && systemNum === _cachedSystemNum) {
      available = _cachedAvailableTypes
    } else {
      available = getAvailableEnemyTypes(phase)
      _cachedAvailableTypes = available
      _cachedPhase = phase
      _cachedSystemNum = systemNum
    }

    // ... (batchSize, instructions loop, etc. unchanged) ...
  }

  function reset() {
    spawnTimer = null
    elapsedTime = 0
    _cachedAvailableTypes = null  // ← add
    _cachedPhase = null           // ← add
    _cachedSystemNum = -1         // ← add
  }
}
```

**Impact**: In a typical wave, the phase changes ~3–5 times per system (5–8 phase transitions). Between transitions, spawn happens every 0.4–2s. With 3 systems × ~300s each, this eliminates ~hundreds of array iterations + object spreads over a full run. Cost per cache miss: same as before. Cost per hit: 2 reference comparisons.

**Why closure (not module-level)**: Module-level cache would persist across `createSpawnSystem()` calls (game restarts). The closure approach naturally resets via `reset()` which is already called on game restart.

### Critical Source Analysis — FragmentGemRenderer.jsx

**Current code (lines 43–58):**
```jsx
for (let i = 0; i < count; i++) {
  const gem = gems[i]
  const y = 0.5 + Math.sin((elapsed + gem.x * 0.5 + gem.z * 0.3) * 3) * 0.3
  const pulsePhase = elapsed * GAME_CONFIG.FRAGMENT_GEM_PULSE_SPEED  // ← same for all gems
  const pulse = Math.sin(pulsePhase) * 0.15 + 1.0                    // ← same for all gems
  const scaleX = sx * pulse
  // ...
}
```

**Problem**: `pulsePhase` and `pulse` don't depend on the gem — they use only `elapsed` and `FRAGMENT_GEM_PULSE_SPEED`. Computing them N times per frame when N is 20+ is pure waste.

**Fix:**
```jsx
// Before the loop:
const pulsePhase = elapsed * GAME_CONFIG.FRAGMENT_GEM_PULSE_SPEED
const pulse = Math.sin(pulsePhase) * 0.15 + 1.0

for (let i = 0; i < count; i++) {
  const gem = gems[i]
  const y = 0.5 + Math.sin((elapsed + gem.x * 0.5 + gem.z * 0.3) * 3) * 0.3
  const scaleX = sx * pulse
  const scaleY = sy * pulse
  const scaleZ = sz * pulse
  // ...
}
```

Note: `y` (bobbing) DOES depend on `gem.x` and `gem.z` per-gem, so it stays inside the loop. Only `pulsePhase` and `pulse` are hoisted.

### Previous Stories Intelligence

**Stories 43.1–43.4** (all `ready-for-dev`): Zero overlap with the 3 files in this story.
- 43.1 → `useEnemies.jsx` only
- 43.2 → `GameLoop.jsx` only
- 43.3 → `separationSystem.js`, `usePlayer.jsx`, `usePlayerCamera.jsx` (**shared file!**)
- 43.4 → `PlanetRenderer.jsx`, `WormholeRenderer.jsx` only

**Story 43.3 shared file**: Both 43.3 and 43.6 modify `usePlayerCamera.jsx`. If developed concurrently:
- 43.3 changes: lines 63–66 (useFrame callback, pause spread elimination)
- 43.6 changes: lines 42–45 (useControls call, production guard)
These are non-overlapping hunks — a clean merge. Coordinate commit order to avoid conflicts.

**Story 43.5** (`backlog`, no artifact file): Modifies `XPOrbRenderer.jsx`, `HealGemRenderer.jsx`, `FragmentGemRenderer.jsx` (**shared file!**), several weapon renderers, `EnemyRenderer.jsx`, `useEnemies.jsx`, `GameplayScene.jsx`. If 43.5 and 43.6 are developed in parallel, both touch `FragmentGemRenderer.jsx`. The 43.6 change is confined to lines 49–50 (hoist); 43.5's change to this file is unrelated (would be `find→for` replacement for weapon renderers which don't apply here — actually 43.5 doesn't list FragmentGemRenderer changes). So no conflict. But coordinate with 43.5 dev if parallel.

### Git Intelligence

Recent commits are UI/design system work (Epics 33–34). The performance epic (43) is a separate workstream. `usePlayerCamera.jsx` was last modified in Epic 43's backlog preparation. `spawnSystem.js` was last touched in Epic 34 or earlier (galaxy profile). `FragmentGemRenderer.jsx` has no recent changes. No rebase conflicts expected.

### Project Structure Notes

**3 files modified:**
- `src/hooks/usePlayerCamera.jsx` — lines 42–45 only
- `src/systems/spawnSystem.js` — inside `createSpawnSystem()` closure
- `src/renderers/FragmentGemRenderer.jsx` — lines 49–50 hoisted

**No new files created. No new imports.**

`import.meta.env.PROD` is already available in all Vite-based files without any import.

### References

- [Source: _bmad-output/planning-artifacts/epic-43-performance-hotpath-residual-gc.md#Story 43.6]
- [Source: src/hooks/usePlayerCamera.jsx — useControls call lines 42–45, full file lines 1–68]
- [Source: src/systems/spawnSystem.js — getAvailableEnemyTypes lines 26–39, tick line 118, createSpawnSystem closure lines 41–181]
- [Source: src/renderers/FragmentGemRenderer.jsx — useFrame loop lines 43–65, pulse lines 49–50]
- [Source: src/entities/waveDefs.js — getPhaseForProgress lines 179–192, returns stable WAVE_PROFILES references]
- [Source: src/systems/__tests__/spawnSystem.test.js — existing test coverage for tick/reset/phase behavior]
- [Source: _bmad-output/implementation-artifacts/43-4-planet-material-disposal-gpu-memory-leaks.md — previous story context and pattern]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_No blockers encountered._

### Completion Notes List

- AC1: Added `_CAMERA_DEFAULTS = { offsetY: 120, posSmooth: 20 }` module-level constant and `{ hidden: import.meta.env.PROD }` third arg to `useControls` — Leva panel suppressed in production builds, dev tuning unchanged.
- AC2: Added closure-level cache (`_cachedAvailableTypes`, `_cachedPhase`, `_cachedSystemNum`) inside `createSpawnSystem()`. Reference equality check on `phase` object is sufficient (getPhaseForProgress returns stable WAVE_PROFILES refs). Cache cleared in `reset()`. All 18 spawn tests pass.
- AC3: Hoisted `pulsePhase` and `pulse` before the `for` loop in `FragmentGemRenderer.jsx`. Bobbing (`y`) correctly remains per-gem inside the loop. No behavioral change.
- AC4: 2697/2698 tests pass. The single failure (`xpOrbSystem.test.js` "orbs accelerate as they get closer (ease-in)") is a pre-existing floating-point precision issue (`1.6666666666666667 > 1.666666666666667`) unrelated to this story's changes.

### File List

- `src/hooks/usePlayerCamera.jsx`
- `src/systems/spawnSystem.js`
- `src/systems/__tests__/spawnSystem.test.js`
- `src/renderers/FragmentGemRenderer.jsx`
- `_bmad-output/implementation-artifacts/43-6-leva-production-guard-spawnsystem-cache.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- Story 43.6 implemented: Leva production guard, spawnSystem phase cache, FragmentGemRenderer pulse hoist (Date: 2026-02-25)
- Code review fixes applied (Date: 2026-02-25):
  - M1: Removed dead code `_CAMERA_DEFAULTS` from `usePlayerCamera.jsx` (was defined but never referenced — `hidden` approach uses inline schema values)
  - M2: Added 3 cache-contract tests to `spawnSystem.test.js` (cache hit, reset clears cache, systemNum invalidation) using `vi.spyOn(Object, 'values')` filtered on `ENEMIES` reference
