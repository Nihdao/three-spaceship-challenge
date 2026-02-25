# Story 43.5: Renderer Static Color Upload & Unnecessary Work Reduction

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want renderers to skip GPU uploads when nothing has changed,
so that the GPU bus bandwidth is preserved for actual visual updates.

## Acceptance Criteria

1. **AC1 — XPOrbRenderer setColorAt guard**: Given `XPOrbRenderer.jsx` calling `setColorAt()` each frame for every orb (standard=cyan, rare=gold), when orb colors are static after spawn, then `setColorAt()` is only called for NEW orb slots (indices between `prevCount` and `currentCount`), not re-written for all existing orbs each frame. The existing `instanceColor.needsUpdate` guard (prevStandardCountRef/prevRareCountRef) remains in place.

2. **AC2 — HealGemRenderer setColorAt guard**: Given `HealGemRenderer.jsx` with the same `setColorAt()` each frame pattern (line 61), when gem colors are static, then applies the same optimization as AC1 — color upload only for new gem indices between `prevCountRef.current` and `count`.

3. **AC3 — Weapon renderer find to for loop**: Given 5 weapon renderers calling `.find()` with a callback in `useFrame` (allocating a closure per frame), when the frame tick runs, then each `.find()` is replaced with a `for` loop and `break`. Specific call sites:
   - `LaserCrossRenderer.jsx:54` — `activeWeapons.find(w => w.weaponId === 'LASER_CROSS')`
   - `MagneticFieldRenderer.jsx:51` — `activeWeapons.find(w => WEAPONS[w.weaponId]?.weaponType === 'magnetic_field')`
   - `ShockwaveWeaponRenderer.jsx:48` — `activeWeapons.find(w => WEAPONS[w.weaponId]?.weaponType === 'shockwave')`
   - `TacticalShotRenderer.jsx:35` — `useWeapons.getState().activeWeapons.find(w => WEAPONS[w.weaponId]?.weaponType === 'tactical_shot')`
   - `MineAroundRenderer.jsx:31` — `activeWeapons.find(w => WEAPONS[w.weaponId]?.weaponType === 'mine_around')`

4. **AC4 — EnemyRenderer clock time migration**: Given `EnemyRenderer.jsx` calling `performance.now()` per enemy type each frame (line 75), and `useEnemies.jsx` storing `lastHitTime` as `performance.now()` absolute epoch (lines 512, 541), when R3F provides `state.clock.elapsedTime` in `useFrame`, then:
   - `damageEnemy()` and `damageEnemiesBatch()` in `useEnemies.jsx` accept a `clockMs` parameter (defaulting to `performance.now()` for backward compat) and store `enemy.lastHitTime = clockMs`
   - All 6 `damageEnemiesBatch()` call sites in `GameLoop.jsx` (lines 547, 600, 761, 873, 965, 1017) pass `clockMs` from the frame's `state.clock.elapsedTime * 1000`
   - `EnemyRenderer.jsx` replaces `performance.now()` with `state.clock.elapsedTime * 1000`
   - The existing `hitAge = now - e.lastHitTime` comparison with `SCALE_FLASH_DURATION_MS` works correctly because both sides use the same clock domain

5. **AC5 — GameplayScene BossLayer isolation**: Given `GameplayScene.jsx` subscribing to `useBoss()` at the top level (line 45), when the boss spawns/changes phase/dies, then the subscription is isolated in a dedicated `BossLayer` sub-component. `GameplayScene` itself has zero store subscriptions and never re-renders after mount.

6. **AC6 — All tests pass**: Given `vitest run`, when the story is implemented, then all existing tests pass — including `useEnemies.damage.test.js` (which tests `lastHitTime` with `performance.now()` brackets and must be updated for clock-time approach).

## Tasks / Subtasks

- [x] Task 1 — XPOrbRenderer: setColorAt only for new indices (AC: #1)
  - [x] 1.1 In `useFrame`, replace `standardMesh.setColorAt(standardCount, standardColor)` (line 80) with a conditional: only call `setColorAt` if `standardCount >= prevStandardCountRef.current` (this index is new since last frame)
  - [x] 1.2 Same for `rareMesh.setColorAt(rareCount, rareColor)` (line 72): only call if `rareCount >= prevRareCountRef.current`
  - [x] 1.3 Handle the reset case: when orbs are collected and count drops, then new orbs spawn at lower indices — the `count !== prevCount` comparison in the existing needsUpdate guard (lines 92-99) already handles this by triggering needsUpdate on ANY count change, which forces the GPU to read the existing color buffer. The `setColorAt` calls for indices 0..prevCount are unnecessary because those colors were already written and haven't changed.
  - [x] 1.4 Edge case: if orbs respawn at the same count (prevCount === currentCount), colors are already in the buffer from the previous write. No upload needed — correctly handled by the existing guard.

- [x] Task 2 — HealGemRenderer: setColorAt only for new indices (AC: #2)
  - [x] 2.1 In `useFrame`, wrap `mesh.setColorAt(i, color)` (line 61) in `if (i >= prevCountRef.current)` — only write color for new gem slots
  - [x] 2.2 Same edge cases as Task 1 — existing prevCountRef guard handles count-change upload

- [x] Task 3 — Weapon renderers: find to for loop (AC: #3)
  - [x] 3.1 `LaserCrossRenderer.jsx:54`: Replace `.find(w => w.weaponId === 'LASER_CROSS')` with `for` loop matching `w.weaponId === 'LASER_CROSS'`
  - [x] 3.2 `MagneticFieldRenderer.jsx:51`: Replace `.find(w => WEAPONS[w.weaponId]?.weaponType === 'aura')` with `for` loop (actual weaponType in code is 'aura', not 'magnetic_field')
  - [x] 3.3 `ShockwaveWeaponRenderer.jsx:48`: Replace `.find(w => WEAPONS[w.weaponId]?.weaponType === 'shockwave')` with `for` loop
  - [x] 3.4 `TacticalShotRenderer.jsx:35`: Replace `.find(w => WEAPONS[w.weaponId]?.weaponType === 'tactical_shot')` with `for` loop
  - [x] 3.5 `MineAroundRenderer.jsx:31`: Replace `.find(w => WEAPONS[w.weaponId]?.weaponType === 'mine_around')` with `for` loop

- [x] Task 4 — EnemyRenderer + useEnemies clock time migration (AC: #4)
  - [x] 4.1 In `useEnemies.jsx`, add `clockMs` parameter to `damageEnemy(enemyId, damage, clockMs)` — default to `performance.now()` for backward compatibility. Changed `enemy.lastHitTime = performance.now()` to `enemy.lastHitTime = clockMs ?? performance.now()`
  - [x] 4.2 In `useEnemies.jsx`, add `clockMs` parameter to `damageEnemiesBatch(hits, clockMs)`. Changed `enemy.lastHitTime = performance.now()` to `enemy.lastHitTime = clockMs ?? performance.now()`
  - [x] 4.3 In `GameLoop.jsx`, compute `const clockMs = state.clock.elapsedTime * 1000` at top of useFrame. Passed to all 6 `damageEnemiesBatch()` calls
  - [x] 4.4 In `EnemyRenderer.jsx`: replaced `const now = performance.now()` with `const now = state.clock.elapsedTime * 1000` (added `state` parameter to useFrame callback)
  - [x] 4.5 Removed the NOTE comment block in EnemyRenderer.jsx — resolved
  - [x] 4.6 Updated `useEnemies.damage.test.js`: both `lastHitTime` tests now pass explicit `clockMs` and assert `toBe(clockMs)`

- [x] Task 5 — GameplayScene BossLayer isolation (AC: #5)
  - [x] 5.1 Created `BossLayer` function component inside `GameplayScene.jsx` (above the default export)
  - [x] 5.2 Moved `const { isActive, bossDefeated } = useBoss()` into `BossLayer`
  - [x] 5.3 `BossLayer` returns `null` when `!isActive && !bossDefeated`, otherwise returns `<><BossRenderer /><BossProjectileRenderer /></>`
  - [x] 5.4 Replaced `{showBoss && ...}` block with `<BossLayer />`
  - [x] 5.5 `useBoss` import retained (used by `BossLayer` in same file — `GameplayScene` itself has zero store subscriptions)

- [x] Task 6 — Run tests and verify (AC: #6)
  - [x] 6.1 `npx vitest run` passes: 2695 passed, 1 pre-existing flaky test (progressionSystem.test.js randomness-related, passes in isolation)

## Dev Notes

### Architecture Compliance

- **6-layer architecture**: This story touches the **Rendering** layer (7 renderer files), **Stores** layer (useEnemies.jsx for clock time param), and **GameLoop** (passing clockMs to damage functions). The **Scene** layer (GameplayScene.jsx) is modified for BossLayer isolation.
- **R3F conventions**: `useFrame((state) => { ... })` provides `state.clock.elapsedTime`. The `state` parameter is already available in most renderers (XPOrbRenderer, HealGemRenderer, MagneticFieldRenderer, MineAroundRenderer use it). EnemyRenderer currently declares `useFrame(() => {})` without `state` — it must be added.
- **Zustand getState()**: All weapon renderers correctly use `useWeapons.getState()` in `useFrame` (imperative read, no subscription). `GameplayScene` is the exception — `useBoss()` creates a subscription (declarative hook call). The `BossLayer` isolation fixes this.
- **No new files created**: All changes are in existing files.

### Critical Source Analysis — XPOrbRenderer.jsx (AC1)

**Current code (lines 57-99):**
```jsx
for (let i = 0; i < totalCount; i++) {
  const orb = orbs[i]
  const y = 0.5 + Math.sin((elapsed + orb.x * 0.5 + orb.z * 0.3) * 3) * 0.3

  if (orb.isRare) {
    // ... matrix update ...
    rareMesh.setColorAt(rareCount, rareColor)  // <- EVERY frame for EVERY rare orb
    rareCount++
  } else {
    // ... matrix update ...
    standardMesh.setColorAt(standardCount, standardColor)  // <- EVERY frame for EVERY standard orb
    standardCount++
  }
}
// needsUpdate guard exists (lines 92-99) but setColorAt still runs every frame
```

**Problem**: `setColorAt()` writes to the CPU-side color buffer (`instanceColor.array`). Even though `needsUpdate` guards the GPU upload, the CPU write is still wasted work for orbs that already have the correct color. With 200 orbs at 60fps = 12,000 unnecessary `setColorAt` calls per second.

**Fix — only set color for NEW slots:**
```jsx
if (orb.isRare) {
  // ... matrix update ...
  if (rareCount >= prevRareCountRef.current) {
    rareMesh.setColorAt(rareCount, rareColor)  // Only new slots
  }
  rareCount++
} else {
  // ... matrix update ...
  if (standardCount >= prevStandardCountRef.current) {
    standardMesh.setColorAt(standardCount, standardColor)  // Only new slots
  }
  standardCount++
}
```

**Why this works**: Orbs are iterated in pool order. The color buffer already has the correct color written at indices 0..prevCount-1 from previous frames. Only indices prevCount..currentCount-1 are genuinely new and need their color set.

**Edge case — count drops then rises to same value**: If 5 standard orbs exist, 2 are collected (count=3), then 2 new spawn (count=5 again) — `prevStandardCountRef.current` was 5, drops to 3, then rises to 5. When count drops to 3, the guard `count !== prevCount` triggers `needsUpdate` (the GPU reads indices 0-2). When count rises back to 5, indices 3-4 are NEW orbs that need `setColorAt`. Since `prevStandardCountRef.current` was updated to 3 when count dropped, the condition `standardCount >= 3` correctly writes colors for indices 3 and 4.

### Critical Source Analysis — HealGemRenderer.jsx (AC2)

**Current code (line 61):**
```jsx
for (let i = 0; i < count; i++) {
  // ... matrix update ...
  mesh.setColorAt(i, color)  // <- EVERY frame for EVERY gem
}
```

**Fix — identical pattern to AC1:**
```jsx
for (let i = 0; i < count; i++) {
  // ... matrix update ...
  if (i >= prevCountRef.current) {
    mesh.setColorAt(i, color)  // Only new slots
  }
}
```

### Critical Source Analysis — Weapon Renderers find to for (AC3)

**Pattern (e.g., LaserCrossRenderer.jsx:54):**
```jsx
const weapon = activeWeapons.find(w => w.weaponId === 'LASER_CROSS')
```
**Creates a new closure** `w => w.weaponId === 'LASER_CROSS'` every frame (60 closures/sec per renderer, 300/sec total across 5 renderers).

**Fix pattern:**
```jsx
let weapon = null
for (let i = 0; i < activeWeapons.length; i++) {
  if (activeWeapons[i].weaponId === 'LASER_CROSS') {
    weapon = activeWeapons[i]
    break
  }
}
```

**Note**: MagneticFieldRenderer, ShockwaveWeaponRenderer, TacticalShotRenderer, and MineAroundRenderer match on `weaponType` via `WEAPONS[w.weaponId]?.weaponType`, not directly on `weaponId`. The for-loop version must replicate this:
```jsx
let weapon = null
for (let i = 0; i < activeWeapons.length; i++) {
  const def = WEAPONS[activeWeapons[i].weaponId]
  if (def && def.weaponType === 'magnetic_field') {
    weapon = activeWeapons[i]
    break
  }
}
```

### Critical Source Analysis — EnemyRenderer Clock Time Migration (AC4)

**Current flow:**
1. `GameLoop.useFrame` calls `useEnemies.getState().damageEnemiesBatch(hits)` (6 sites)
2. `damageEnemiesBatch` sets `enemy.lastHitTime = performance.now()` (absolute epoch, ~1740000000000 ms)
3. `EnemyRenderer.useFrame` reads `const now = performance.now()`, computes `hitAge = now - e.lastHitTime`

**New flow:**
1. `GameLoop.useFrame` computes `const clockMs = state.clock.elapsedTime * 1000` once
2. GameLoop passes `clockMs` to all `damageEnemiesBatch(hits, clockMs)` calls
3. `damageEnemiesBatch` sets `enemy.lastHitTime = clockMs ?? performance.now()`
4. `EnemyRenderer.useFrame((state) => { const now = state.clock.elapsedTime * 1000; ... })` — same domain

**Why default to `performance.now()`**: Backward compatibility for `damageEnemy()` which is called from outside GameLoop (e.g., tests, or potentially from boss damage). The default ensures existing callers that don't pass clockMs continue to work. However, the hitAge comparison in EnemyRenderer will have a domain mismatch (clock time vs perf time) for the default case — this is acceptable because `damageEnemy` is rarely called and the flash duration is short (150ms).

**GameLoop clockMs computation location**: The `state` parameter is available in the GameLoop's `useFrame((state, delta) => { ... })`. Compute `const clockMs = state.clock.elapsedTime * 1000` at the very top (section 0) and reuse throughout.

**Test update (useEnemies.damage.test.js):**
Current:
```js
const before = performance.now()
useEnemies.getState().damageEnemy('enemy-0', 5)
const after = performance.now()
expect(updated.lastHitTime).toBeGreaterThanOrEqual(before)
```
New:
```js
const clockMs = 12345
useEnemies.getState().damageEnemy('enemy-0', 5, clockMs)
expect(updated.lastHitTime).toBe(clockMs)
```

### Critical Source Analysis — GameplayScene BossLayer (AC5)

**Current code (lines 44-46, 98-103):**
```jsx
export default function GameplayScene() {
  const { isActive, bossDefeated } = useBoss()  // <- SUBSCRIPTION — re-renders on boss state change
  const showBoss = isActive || bossDefeated
  // ...
  {showBoss && (<><BossRenderer /><BossProjectileRenderer /></>)}
}
```

**Problem**: `useBoss()` is a Zustand hook that subscribes to the store. When `isActive` or `bossDefeated` changes (boss spawn, phase change, defeat), React re-renders `GameplayScene`. This re-renders ALL child components in the JSX tree (30+ renderers), even though R3F memoizes most under the hood. The reconciliation pass alone is measurable.

**Fix — extract BossLayer:**
```jsx
function BossLayer() {
  const { isActive, bossDefeated } = useBoss()
  if (!isActive && !bossDefeated) return null
  return (
    <>
      <BossRenderer />
      <BossProjectileRenderer />
    </>
  )
}

export default function GameplayScene() {
  // NO store subscriptions — never re-renders after mount
  return (
    <>
      {/* ... all other children unchanged ... */}
      <BossLayer />
      {/* ... */}
    </>
  )
}
```

**Import cleanup**: Remove `useBoss` from imports if `GameplayScene` no longer uses it. `BossLayer` is defined in the same file, so it accesses `useBoss` through the existing import.

### Previous Stories Intelligence

**Story 43.4** (ready-for-dev): PlanetRenderer material disposal + WormholeRenderer needsUpdate guard. Different files — no overlap. Pattern overlap: WormholeRenderer `needsUpdate` guard (skip dormant state) is conceptually similar to XPOrbRenderer color upload guard (skip unchanged colors).

**Story 43.3** (ready-for-dev): Separation stubs + usePlayer hasChange flag + usePlayerCamera spread. No file overlap. Pattern: the `Object.keys(changed).length > 0` → boolean flag optimization in usePlayer is the same "avoid unnecessary work" philosophy.

**Story 43.2** (ready-for-dev): GameLoop allocations. Overlapping file: `GameLoop.jsx`. Both 43.2 and 43.5 modify GameLoop — 43.2 adds module-level `_composedWeaponMods` and shockwave compaction, 43.5 adds `clockMs` computation and passes it to `damageEnemiesBatch` calls. Changes are in different sections and don't conflict. If 43.2 is implemented first, 43.5 should verify `clockMs` is computed before section 7 where damage batch calls occur.

**Story 43.1** (ready-for-dev): Spawn/eviction zero allocation. Overlapping file: `useEnemies.jsx`. Story 43.1 changes `spawnEnemies` and `damageEnemiesBatch` (minimal capture `{ ...enemy }` → 4-field capture). Story 43.5 adds `clockMs` parameter to `damageEnemiesBatch`. These overlap in the same function — verify both parameter addition and kill capture work together. The `clockMs` parameter is independent of the kill capture change.

### Git Intelligence

Recent commits focus on UI/design (Epics 33-34 redshift pass, HUD icons). No recent changes to the 10 files modified by this story. No merge conflict risk.

### Project Structure Notes

- **10 files modified**: `src/renderers/XPOrbRenderer.jsx`, `src/renderers/HealGemRenderer.jsx`, `src/renderers/LaserCrossRenderer.jsx`, `src/renderers/MagneticFieldRenderer.jsx`, `src/renderers/ShockwaveWeaponRenderer.jsx`, `src/renderers/TacticalShotRenderer.jsx`, `src/renderers/MineAroundRenderer.jsx`, `src/renderers/EnemyRenderer.jsx`, `src/stores/useEnemies.jsx`, `src/scenes/GameplayScene.jsx`
- **1 file also modified**: `src/GameLoop.jsx` (clockMs computation + passing to damageEnemiesBatch)
- **1 test file updated**: `src/stores/__tests__/useEnemies.damage.test.js`
- **No new files created**
- **No new dependencies**
- Import changes: `EnemyRenderer.jsx` needs `state` parameter in `useFrame` callback (currently `useFrame(() => {`)`)

### References

- [Source: _bmad-output/planning-artifacts/epic-43-performance-hotpath-residual-gc.md#Story 43.5]
- [Source: src/renderers/XPOrbRenderer.jsx — setColorAt lines 72, 80; prevCount guards lines 92-99]
- [Source: src/renderers/HealGemRenderer.jsx — setColorAt line 61; prevCount guard lines 71-73]
- [Source: src/renderers/LaserCrossRenderer.jsx — find() line 54]
- [Source: src/renderers/MagneticFieldRenderer.jsx — find() line 51]
- [Source: src/renderers/ShockwaveWeaponRenderer.jsx — find() line 48]
- [Source: src/renderers/TacticalShotRenderer.jsx — find() line 35]
- [Source: src/renderers/MineAroundRenderer.jsx — find() line 31]
- [Source: src/renderers/EnemyRenderer.jsx — performance.now() line 75, NOTE comment lines 71-74]
- [Source: src/stores/useEnemies.jsx — lastHitTime lines 512, 541; damageEnemy line 499; damageEnemiesBatch line 516]
- [Source: src/scenes/GameplayScene.jsx — useBoss() line 45, showBoss lines 46/98-103]
- [Source: src/GameLoop.jsx — damageEnemiesBatch calls lines 547, 600, 761, 873, 965, 1017]
- [Source: src/stores/__tests__/useEnemies.damage.test.js — performance.now() brackets lines 73-78, 167-177]
- [Source: _bmad-output/implementation-artifacts/43-4-planet-material-disposal-gpu-memory-leaks.md — previous story context]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None — implementation was straightforward. One note: MagneticFieldRenderer uses `weaponType === 'aura'` in the actual code, not `'magnetic_field'` as stated in the story AC3. The for-loop replacement uses the correct value from the actual code.

### Completion Notes List

- AC1 ✅ XPOrbRenderer: `setColorAt()` now guarded with `if (rareCount >= prevRareCountRef.current)` and `if (standardCount >= prevStandardCountRef.current)` — eliminates ~12,000 unnecessary CPU writes/sec at 200 orbs@60fps
- AC2 ✅ HealGemRenderer: `setColorAt()` now guarded with `if (i >= prevCountRef.current)` — same pattern
- AC3 ✅ All 5 weapon renderers: `.find()` with closure replaced by `for` loop + `break` — eliminates 300 closure allocations/sec (5 renderers × 60fps)
- AC4 ✅ Clock-time migration complete: `damageEnemy()` + `damageEnemiesBatch()` accept `clockMs` param (default `performance.now()` for backward compat). GameLoop computes `clockMs` once per frame and passes to all 6 batch calls. EnemyRenderer uses `state.clock.elapsedTime * 1000`. Hit flash timing now uses single clock domain.
- AC5 ✅ `BossLayer` sub-component isolates `useBoss()` subscription. `GameplayScene` has zero store subscriptions and never re-renders after mount.
- AC6 ✅ 2695/2696 tests pass. 1 pre-existing flaky failure in `progressionSystem.test.js` (randomness-related, passes in isolation — unrelated to this story).

### File List

- src/renderers/XPOrbRenderer.jsx
- src/renderers/HealGemRenderer.jsx
- src/renderers/LaserCrossRenderer.jsx
- src/renderers/MagneticFieldRenderer.jsx
- src/renderers/ShockwaveWeaponRenderer.jsx
- src/renderers/TacticalShotRenderer.jsx
- src/renderers/MineAroundRenderer.jsx
- src/renderers/EnemyRenderer.jsx
- src/stores/useEnemies.jsx
- src/scenes/GameplayScene.jsx
- src/GameLoop.jsx
- src/stores/__tests__/useEnemies.damage.test.js

### Review Fixes Applied

- **[M1] EnemyRenderer.jsx** — Added `hitAge >= 0` guard to scale-flash check. Prevents permanent flash when `lastHitTime` is set via `performance.now()` fallback (epoch ~1.74T ms vs clock-time small ms → huge negative hitAge would have always passed the `< SCALE_FLASH_DURATION_MS` check).
- **[M2] HealGemRenderer.jsx** — Hoisted `pulse` and `scale` outside the for loop. They don't depend on loop variable `i` — same pattern as Story 43.6 FragmentGemRenderer fix that was missed here.
- **[M3] XPOrbRenderer.jsx** — Hoisted `rareScaleMult` and `rarePulse` outside the for loop. Same pattern: rare orb pulse is identical for all rare orbs in a given frame.
- **[M4] useEnemies.jsx** — Added clarifying comments on both `performance.now()` fallback sites documenting the clock domain behavior and pointing to the EnemyRenderer guard.

## Change Log

- 2026-02-25: Story implemented — setColorAt CPU-write guards (AC1, AC2), find→for-loop in 5 weapon renderers (AC3), clock-time migration for hit-flash domain alignment (AC4), BossLayer subscription isolation (AC5). 12 files modified, 0 new files.
- 2026-02-25: Code review fixes — EnemyRenderer hitAge >= 0 guard (M1: permanent flash bug with performance.now() fallback), HealGemRenderer pulse hoisting (M2), XPOrbRenderer rarePulse hoisting (M3), useEnemies clock domain comments (M4). 2705/2705 tests pass.
