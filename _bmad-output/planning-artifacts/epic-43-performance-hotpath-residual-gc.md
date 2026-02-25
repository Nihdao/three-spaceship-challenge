# Epic 43: Performance — Residual GC Pressure, Spawn Spikes & Renderer Leaks

Deuxieme passe de performance focalisee sur les allocations survivantes de l'Epic 41, le chemin critique de spawn/eviction d'ennemis qui provoque des freezes observables, les fuites memoire GPU dans les renderers, et les micro-allocations cumulees dans les hot paths du GameLoop.

## Epic Goals

- Eliminer le pic GC lors du spawn+eviction d'ennemis (chaine filter/sort/map/Set/filter synchrone)
- Supprimer les allocations residuelles dans les hot paths du GameLoop (composedWeaponMods, stillPending, shockwave arcs, damage number batching)
- Corriger les fuites memoire GPU (materiaux clones de PlanetRenderer, pointsMaterial de WormholeRenderer)
- Reduire le travail CPU/GPU inutile dans les renderers (couleurs statiques re-uploadees, buffer updates en etat dormant)
- Isoler les subscriptions Zustand couteuses dans GameplayScene et usePlayerCamera

## Epic Context

L'Epic 41 a pose les fondations de performance : pre-allocation des tableaux de hits, pool d'entites pour le collision system, hash spatial en bit-packing, set() conditionnel dans usePlayer. Cependant, des freezes intermittents persistent, principalement lors de spawns d'ennemis en combat dense. L'audit post-Epic 41 a identifie trois sources convergentes :

1. **Spawn spike** : quand le pool est plein, `spawnEnemies()` declenche un chemin d'eviction qui chaine 6 allocations synchrones (filter → sort avec parseInt → slice → map → new Set → filter) dans le meme frame que le `set({ enemies: [...] })`. Quand ca coincide avec des morts AOE (mine, magnetic field), plusieurs `spawnDamageNumbers()` s'ajoutent → pic GC → freeze observable.

2. **Allocations par-frame survivantes** : `composedWeaponMods` (objet litteral recree 60x/s), `stillPending[]` (shockwave arcs), `{ ...enemy }` spread dans damageEnemiesBatch pour chaque kill, `{ ...playerState }` spread dans usePlayerCamera pendant la pause, et 100 objets stub dans separationSystem.insert() par frame.

3. **Fuites GPU et travail inutile** : materiaux clones de PlanetRenderer jamais disposes lors des transitions de systeme, `setColorAt()` appele chaque frame dans XPOrbRenderer/HealGemRenderer pour des couleurs statiques, `posAttr.needsUpdate = true` chaque frame dans WormholeRenderer en etat dormant, `useBoss()` subscription dans GameplayScene qui force la reconciliation de ~25 composants enfants.

---

## Stories

### Story 43.1 — Spawn/Eviction Path Zero-Allocation Refactor

As a player,
I want enemy spawning to never cause a visible frame stutter,
So that combat remains fluid even when the enemy pool is full and new enemies need to replace old ones.

**Acceptance Criteria:**

1. **Given** `useEnemies.spawnEnemies()` with a full enemy pool requiring eviction
   **When** `slotsNeeded > 0`
   **Then** the eviction path does NOT call `.filter()`, `.sort()`, `.slice()`, `.map()`, or construct a `new Set()`
   **And** instead iterates `currentEnemies` once with a `for` loop, selecting the first `slotsNeeded` non-boss/non-ELITE enemies (exploiting insertion order = age order, since `numericId` is monotonically increasing)
   **And** marks them for removal via a boolean flag (`e._evict = true`) on the enemy object
   **And** the final array is built with a single `for` loop that skips evicted enemies and appends the new batch

2. **Given** the sort comparator in the eviction path
   **When** sorting is needed (if the insertion-order approach is insufficient)
   **Then** uses `a.numericId - b.numericId` instead of `parseInt(a.id.slice(6), 10) - parseInt(b.id.slice(6), 10)`

3. **Given** `useEnemies.damageEnemiesBatch()`
   **When** an enemy is killed and its data needs to be captured for drops/explosions
   **Then** captures only the 4 fields used downstream: `{ x: enemy.x, z: enemy.z, typeId: enemy.typeId, color: enemy.color }` instead of `{ ...enemy }` (full 15-property shallow copy)

4. **Given** `useEnemies.consumeTeleportEvents()`
   **When** teleport events exist
   **Then** uses a double-buffer swap pattern (module-level `_teleportBuffer` and `_teleportEvents`) instead of `.slice()` to avoid array allocation

5. **Given** `vitest run`
   **When** the story is implemented
   **Then** all existing tests pass — including `useEnemies.poolEviction.test.js`, `useEnemies.leash.test.js`, and `useEnemies.knockback.test.js`

**Technical Notes:**
- The key insight is that enemies are already in insertion order in the `enemies` array. Since `nextId` is monotonically increasing, the oldest enemies are always at the front. No sort is needed — just iterate from index 0 and pick the first N evictable.
- For the final array construction: `const result = []; for (let i = 0; i < currentEnemies.length; i++) { if (!currentEnemies[i]._evict) result.push(currentEnemies[i]) }; for (let i = 0; i < batch.length; i++) result.push(batch[i])`
- Clean up `_evict` flag after building the array (set it back to `undefined` on evicted enemies that were removed, or simply don't — they're gone).
- For teleport events double-buffer: `let _activeBuffer = []; let _readBuffer = []; function consume() { const tmp = _readBuffer; _readBuffer = _activeBuffer; _activeBuffer = tmp; _activeBuffer.length = 0; return _readBuffer; }`
- damageEnemiesBatch minimal capture: the callers in GameLoop only use `event.enemy.x`, `.z`, `.color`, `.typeId` — verify with grep before reducing.

**Files:**
| File | Changes |
|------|---------|
| `src/stores/useEnemies.jsx` | Refactor `spawnEnemies` eviction, `damageEnemiesBatch` kill capture, `consumeTeleportEvents` double-buffer |

---

### Story 43.2 — GameLoop Residual Allocations Cleanup

As a player,
I want zero JavaScript object allocations per frame in the GameLoop,
So that GC pauses never coincide with spawn/combat spikes.

**Acceptance Criteria:**

1. **Given** `composedWeaponMods` object in GameLoop (currently line ~304)
   **When** the frame tick runs
   **Then** `composedWeaponMods` is a module-level object mutated in-place (`_composedWeaponMods.damageMultiplier = ...`) instead of a new object literal each frame

2. **Given** the shockwave `stillPending = []` pattern (currently line ~661)
   **When** pending arcs exist
   **Then** uses an in-place compaction (swap-to-end or write-index) instead of allocating a new `stillPending` array each frame
   **And** the `shockwaveArcs.filter(a => a.active)` pruning (line ~745) uses the same in-place compaction pattern

3. **Given** `new Set()` allocated per shockwave arc (currently line ~688)
   **When** a new arc is created
   **Then** reuses arc objects from a pool with `arc.hitEnemies.clear()` instead of allocating a fresh `Set` per arc
   **And** the pool has a fixed size matching `poolLimit * 3` (the pruning threshold)

4. **Given** `_dnEntries` used separately per weapon system (shockwave, mine, tactical, magnetic, projectile)
   **When** each weapon system generates damage numbers
   **Then** all systems accumulate into a single `_dnEntries` array across the entire frame
   **And** `spawnDamageNumbers(_dnEntries)` is called once at the end of section 7 (after all weapon damage is resolved), not after each weapon type
   **And** this reduces `useDamageNumbers.set()` calls from up to 5 per frame to exactly 1

5. **Given** the player contact damage section (currently line ~1046)
   **When** `aliveEnemies.find(e => e.id === playerHits[i].id)` is called
   **Then** uses a `for` loop with direct ID comparison instead of `.find()` callback allocation
   **And** the same pattern applies to `shockwaves.find()` (line ~1064) and `enemyProj.find()` (line ~1082)

6. **Given** `vitest run`
   **When** the story is implemented
   **Then** all existing tests pass

**Technical Notes:**
- Module-level `_composedWeaponMods`: `const _composedWeaponMods = { damageMultiplier: 1, cooldownMultiplier: 1, critChance: 0, critMultiplier: 2, projectileSpeedMultiplier: 1, zoneMultiplier: 1 }` — mutate fields, pass the same reference each frame.
- Shockwave in-place compaction: `let writeIdx = 0; for (let i = 0; i < arr.length; i++) { if (condition) arr[writeIdx++] = arr[i] }; arr.length = writeIdx` — no allocation.
- Arc pool: `const _arcPool = []; function _getArc() { for (let i = 0; i < _arcPool.length; i++) { if (!_arcPool[i].active) { _arcPool[i].hitEnemies.clear(); return _arcPool[i] } } const a = { ..., hitEnemies: new Set() }; _arcPool.push(a); return a }`
- DN batching: clear `_dnEntries.length = 0` once at the start of section 7, accumulate from all weapon types, then call `spawnDamageNumbers` once at the end.
- `.find()` replacement: `let enemy = null; for (let k = 0; k < arr.length; k++) { if (arr[k].id === id) { enemy = arr[k]; break } }`

**Files:**
| File | Changes |
|------|---------|
| `src/GameLoop.jsx` | composedWeaponMods module-level, shockwave compaction, arc pool, DN batching, find→for loop |

---

### Story 43.3 — Separation System Object Pool & usePlayer set() Optimization

As a player,
I want enemy separation and player tick to produce zero transient objects,
So that the combined per-frame GC pressure from stores and systems is eliminated.

**Acceptance Criteria:**

1. **Given** `separationSystem.js` calling `spatialHash.insert({ id, numericId, x, z, radius })` per enemy
   **When** 100 enemies are alive
   **Then** uses a module-level pool of stub objects (`_sepStubs`) mutated in-place instead of creating 100 new objects per frame
   **And** the pool grows lazily (only allocates new stubs when enemy count exceeds pool size) and never shrinks

2. **Given** `usePlayer.tick()` building a `changed = {}` object each frame
   **When** checking `Object.keys(changed).length > 0` to decide whether to call `set()`
   **Then** uses a boolean `let hasChange = false` flag set to `true` at each field assignment into `changed`
   **And** the `Object.keys()` call is removed entirely

3. **Given** `usePlayerCamera.jsx` suppressing shake during pause
   **When** `isPaused && playerState.cameraShakeTimer > 0`
   **Then** passes `0` directly to `computeCameraFrame` as the shake timer value instead of spreading `{ ...playerState, cameraShakeTimer: 0 }`
   **And** `computeCameraFrame` receives `shakeTimerOverride` as a parameter (or the caller sets `effectiveShakeTimer = 0` and passes it)

4. **Given** `vitest run`
   **When** the story is implemented
   **Then** all existing tests pass — including `usePlayer.movement.test.js`, `usePlayer.inertiaPhysics.test.js`, `usePlayer.conditionalSet.test.js`, `separationSystem.test.js`

**Technical Notes:**
- Separation stubs: `const _sepStubs = []; function _getStub(i) { if (i >= _sepStubs.length) _sepStubs.push({ id: '', numericId: 0, x: 0, z: 0, radius: 0 }); const s = _sepStubs[i]; return s; }` — assign fields in-place before `spatialHash.insert(s)`.
- usePlayer changed: replace `if (Object.keys(changed).length > 0) set(changed)` with `if (hasChange) set(changed)` — `hasChange` is set in each individual `if (field !== state.field) { changed.field = field; hasChange = true }` block.
- usePlayerCamera: modify `computeCameraFrame` signature to accept individual values instead of the whole playerState object, OR add a `shakeTimer` parameter override. Simplest approach: `const effectiveShakeTimer = isPaused ? 0 : playerState.cameraShakeTimer; computeCameraFrame(state.camera, smoothedPosition.current, { ...playerState }, delta, ...)` — but that STILL spreads. Instead, destructure what's needed: `computeCameraFrame` already destructures `{ position, cameraShakeTimer, cameraShakeIntensity }` from playerState. So: pass `cameraShakeTimer: isPaused ? 0 : playerState.cameraShakeTimer` as a direct argument.

**Files:**
| File | Changes |
|------|---------|
| `src/systems/separationSystem.js` | Pool of stub objects for spatialHash.insert() |
| `src/stores/usePlayer.jsx` | Replace `Object.keys(changed).length > 0` with boolean flag |
| `src/hooks/usePlayerCamera.jsx` | Eliminate `{ ...playerState }` spread during pause |

---

### Story 43.4 — PlanetRenderer Material Disposal & GPU Memory Leaks

As a player,
I want system transitions to release GPU memory from previous planets,
So that late-game performance doesn't degrade after visiting multiple systems.

**Acceptance Criteria:**

1. **Given** the `Planet` component in `PlanetRenderer.jsx`
   **When** the component unmounts (system transition replaces planets)
   **Then** all cloned materials are disposed via a `useEffect` cleanup
   **And** the cleanup traverses `clonedScene` and calls `.dispose()` on every cloned material
   **And** the original GLB materials (shared via `useGLTF` cache) are NOT disposed

2. **Given** `WormholeRenderer.jsx`
   **When** the wormhole unmounts (state transitions to `'hidden'` or component conditionally returns null)
   **Then** the `riftMaterial` (created via `useMemo`) is disposed in the existing cleanup `useEffect`
   **And** any additional materials created outside the JSX scene graph (e.g., pointsMaterial for particles) are also disposed

3. **Given** `WormholeRenderer.jsx` particle position buffer
   **When** the wormhole is in `'visible'` state (dormant, small wormhole)
   **Then** `posAttr.needsUpdate = true` is only set when the particle positions actually change (i.e., during `'approaching'` and `'active'` states)
   **And** in `'visible'` state, particle animation is throttled or skipped entirely

4. **Given** `vitest run`
   **When** the story is implemented
   **Then** all existing tests pass

**Technical Notes:**
- Planet cleanup: add `useEffect(() => { return () => { clonedScene.traverse((child) => { if (child.isMesh) { const mats = Array.isArray(child.material) ? child.material : [child.material]; mats.forEach(m => { if (m !== originalMat) m.dispose() }) } }) } }, [clonedScene])`. The key is to only dispose cloned materials, not the original GLB cache materials. Since `mat.clone()` creates a new instance, we can safely dispose all materials in the clone.
- WormholeRenderer: check the existing `useEffect` cleanup at line ~141-145 — it currently disposes `riftMaterial` only. Add `pointsMaterialRef.current?.dispose()` if a custom points material is used.
- For the needsUpdate guard: `if (wormholeState !== 'visible') { posAttr.needsUpdate = true }` — simple conditional.

**Files:**
| File | Changes |
|------|---------|
| `src/renderers/PlanetRenderer.jsx` | Add material disposal useEffect cleanup |
| `src/renderers/WormholeRenderer.jsx` | Fix material disposal, conditional needsUpdate |

---

### Story 43.5 — Renderer Static Color Upload & Unnecessary Work Reduction

As a player,
I want renderers to skip GPU uploads when nothing has changed,
So that the GPU bus bandwidth is preserved for actual visual updates.

**Acceptance Criteria:**

1. **Given** `XPOrbRenderer.jsx` calling `setColorAt()` each frame for every orb
   **When** orb colors are static after spawn (cyan for standard, gold for rare)
   **Then** `setColorAt()` is only called when a new orb appears or the active count changes
   **And** `instanceColor.needsUpdate` is guarded by a `prevCountRef` comparison
   **And** colors are initialized once per orb slot and not re-written each frame

2. **Given** `HealGemRenderer.jsx` with the same `setColorAt()` each frame pattern
   **When** gem colors are static
   **Then** applies the same optimization as XPOrbRenderer — color upload only on count change

3. **Given** 5 weapon renderers (`LaserCrossRenderer`, `MagneticFieldRenderer`, `ShockwaveWeaponRenderer`, `TacticalShotRenderer`, `MineAroundRenderer`)
   **When** each calls `activeWeapons.find(w => w.weaponId === 'X')` in `useFrame`
   **Then** replaces `.find()` with a `for` loop and `break` — no callback allocation per frame

4. **Given** `EnemyRenderer.jsx` calling `performance.now()` per enemy type each frame
   **When** R3F provides `state.clock.elapsedTime` in `useFrame`
   **Then** replaces `performance.now()` with `state.clock.elapsedTime * 1000` for hit flash timing
   **And** updates `enemy.lastHitTime` in `useEnemies` to use `clock.elapsedTime * 1000` instead of `performance.now()`

5. **Given** `GameplayScene.jsx` subscribing to `useBoss()` at top level
   **When** the boss spawns, changes phase, or dies
   **Then** the boss subscription is isolated in a dedicated `<BossLayer>` sub-component
   **And** `GameplayScene` itself has zero store subscriptions and never re-renders after mount

6. **Given** `vitest run`
   **When** the story is implemented
   **Then** all existing tests pass

**Technical Notes:**
- XPOrbRenderer color guard: track `prevStandardCountRef` and `prevRareCountRef`. Only call `setColorAt()` for NEW slots (indices between prevCount and currentCount). Set `needsUpdate = true` only when counts differ.
- Weapon renderer find→for: `let weapon = null; const aw = activeWeapons; for (let i = 0; i < aw.length; i++) { if (aw[i].weaponId === 'LASER_CROSS') { weapon = aw[i]; break } }`
- BossLayer isolation:
  ```jsx
  function BossLayer() {
    const { isActive, bossDefeated } = useBoss()
    if (!isActive && !bossDefeated) return null
    return <><BossRenderer /><BossProjectileRenderer /></>
  }
  ```
  Replace the `useBoss()` call and conditional in `GameplayScene` with `<BossLayer />`.
- EnemyRenderer clock: `useFrame((state) => { const now = state.clock.elapsedTime * 1000; ... })` — this is consistent across frames and avoids the `performance.now()` syscall. Requires updating `lastHitTime` in `useEnemies.damageEnemiesBatch` and `damageEnemy` to also use clock time — pass `clockTime` as parameter from GameLoop.

**Files:**
| File | Changes |
|------|---------|
| `src/renderers/XPOrbRenderer.jsx` | Color upload guard |
| `src/renderers/HealGemRenderer.jsx` | Color upload guard |
| `src/renderers/LaserCrossRenderer.jsx` | find→for |
| `src/renderers/MagneticFieldRenderer.jsx` | find→for |
| `src/renderers/ShockwaveWeaponRenderer.jsx` | find→for |
| `src/renderers/TacticalShotRenderer.jsx` | find→for |
| `src/renderers/MineAroundRenderer.jsx` | find→for |
| `src/renderers/EnemyRenderer.jsx` | performance.now→clock.elapsedTime |
| `src/stores/useEnemies.jsx` | lastHitTime to use clock time |
| `src/scenes/GameplayScene.jsx` | BossLayer isolation |

---

### Story 43.6 — Leva Debug Controls Production Guard & spawnSystem Cache

As a developer,
I want debug tools stripped from production builds and spawn-time allocations minimized,
So that debug overhead doesn't affect player experience and spawn frames are lighter.

**Acceptance Criteria:**

1. **Given** `usePlayerCamera.jsx` using `useControls("Camera Follow", { ... })`
   **When** the game runs in production (`import.meta.env.PROD === true`)
   **Then** `useControls` is not called — default values are used directly as constants
   **And** in development mode, `useControls` continues to work normally for tuning

2. **Given** `spawnSystem.js` calling `getAvailableEnemyTypes(phase)` each spawn tick
   **When** the function spreads `{ ...enemy, adjustedWeight: ... }` for every enemy type in the registry
   **Then** the result is cached per `(systemNum, phaseIndex)` key
   **And** the cache is invalidated when `systemNum` or `phaseIndex` changes
   **And** spawn ticks reuse the cached array instead of re-spreading

3. **Given** `FragmentGemRenderer.jsx` computing `pulsePhase = elapsed * PULSE_SPEED` identically for every gem inside the `for` loop
   **When** 20+ gems are active
   **Then** `pulsePhase` and `pulse` are computed once outside the loop and reused

4. **Given** `vitest run`
   **When** the story is implemented
   **Then** all existing tests pass

**Technical Notes:**
- Leva guard pattern:
  ```js
  const DEFAULTS = { offsetY: 120, posSmooth: 20 }
  // In component:
  const controls = import.meta.env.PROD ? DEFAULTS : useControls("Camera Follow", { ... })
  ```
  This is a conditional hook call, which technically violates Rules of Hooks. To avoid that, use a wrapper: `const useDebugControls = import.meta.env.PROD ? () => DEFAULTS : () => useControls(...)` defined at module level. Or: always call useControls but ignore the result in prod — Leva's `hidden` option hides the panel but the hook still runs. Safest: keep the hook call, add `{ collapsed: true, hidden: import.meta.env.PROD }` to suppress the panel.
- spawnSystem cache: `let _cachedTypes = null; let _cacheKey = ''; function getAvailableEnemyTypes(phase, systemNum) { const key = systemNum + '_' + phase; if (key === _cacheKey) return _cachedTypes; _cachedTypes = Object.values(ENEMIES).filter(...).map(e => ({ ...e, adjustedWeight })); _cacheKey = key; return _cachedTypes }`
- FragmentGemRenderer: move `const pulsePhase = elapsed * SPEED; const pulse = Math.sin(pulsePhase) * 0.15 + 1.0` before the `for` loop.

**Files:**
| File | Changes |
|------|---------|
| `src/hooks/usePlayerCamera.jsx` | Leva production guard |
| `src/systems/spawnSystem.js` | Enemy type cache per system/phase |
| `src/renderers/FragmentGemRenderer.jsx` | Hoist pulse computation out of loop |

---

## Dependencies

- Epic 41 (Performance Optimization) — prerequisite, provides the pre-allocation foundation this epic builds upon
- Story 41.1 — `_dnEntries`, `_swHits`, etc. pre-allocated arrays are extended in Story 43.2
- Story 41.2 — `_damageMap`, `_killIds` are already module-level; Story 43.1 adds minimal-capture
- Story 41.3 — separation system stubs (Story 43.3) extend the integer-key pattern

## Execution Order

**Story 43.1 first** (spawn/eviction) — highest user-visible impact, root cause of reported freezes.
**Story 43.2 second** (GameLoop residuals) — builds on 43.1 patterns, addresses secondary GC source.
**Stories 43.3 through 43.6** are independent and can be parallelized.

## Success Metrics

- Zero observable freeze during spawn bursts with 100 enemies + pool eviction active (reproducible via debug console: spawn 100 enemies, force eviction cycle)
- Zero new arrays/objects allocated per frame in GameLoop (verifiable via Chrome DevTools > Performance > Allocation timeline)
- No GPU memory growth across 5+ system transitions (verifiable via Chrome DevTools > Performance > GPU memory)
- `vitest run` passes at 100%
- FPS stable >= 55 with 100 enemies, 6 weapons active, 50+ orbs on mid-range hardware
