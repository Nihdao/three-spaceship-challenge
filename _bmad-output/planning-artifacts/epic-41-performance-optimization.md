# Epic 41: Performance Optimization — GC Pressure, Re-renders & Future-Proof Renderers

Audit complet des performances du jeu : élimination de la pression GC dans le GameLoop et les systèmes, réduction drastique des re-renders React inutiles dans le HUD/stores, et préparation de l'architecture de rendu pour supporter des géométries complexes (gems, cristaux) sans régression de performance.

## Epic Goals

- Supprimer toutes les allocations par frame dans le GameLoop (tableaux, strings, Maps, Sets)
- Garder les `set()` Zustand strictement conditionnels — ne notifier React que quand l'état change réellement
- Réduire les re-renders du HUD de ~60/s à ~1-2/s en conditions normales
- Préparer l'architecture InstancedMesh pour supporter des géométries custom (gems facettées, cristaux) sans casser le batching

## Epic Context

Le jeu tourne bien en début de partie, mais les FPS chutent en combat dense (100+ ennemis, 200+ projectiles, 6 armes actives, 50+ orbes XP). L'audit a identifié trois catégories de problèmes : (1) la pression GC causée par des centaines d'allocations temporaires par frame dans le GameLoop et les systèmes, (2) les `set()` Zustand inconditionnels qui déclenchent des cascades de re-renders React dans le HUD même quand rien ne change visuellement, et (3) des micro-inefficacités dans les renderers (uploads GPU inutiles, itérateurs, lookups O(N) dans des boucles de hits). De plus, le système d'instancing actuel utilise des SphereGeometry simples pour les orbes/gems — une architecture future-proof doit permettre de passer à des géométries facettées (IcosahedronGeometry, custom BufferGeometry) sans perdre le batching.

## Stories

### Story 41.1: GameLoop Hot Path — Zero-Allocation Frame Tick

As a player,
I want smooth 60 FPS during intense combat with 100+ enemies and multiple weapons active,
So that the game never stutters from garbage collection pauses.

**Acceptance Criteria:**

**Given** the GameLoop `useFrame` callback
**When** processing a full frame with all weapon types active and 100 enemies alive
**Then** zero new arrays, objects, strings, Maps or Sets are allocated during the frame tick
**And** all temporary collections (`projectileHits`, `laserCrossHits`, `magHits`, `swHits`, `mineHits`, `uniqueHits`, `tacticalHits`, `dnEntries`) are module-level pre-allocated arrays cleared with `.length = 0`

**Given** the weapon lookup pattern in sections 7a-bis through 7a-sexies
**When** the frame tick starts
**Then** `activeWeapons` is iterated once at the top with a single bucketing pass, storing each weapon type in a dedicated local variable (`lcWeapon`, `magWeapon`, `swWeapon`, `mineWeapon`, `tactWeapon`)
**And** the individual `.find()` calls on `activeWeapons` in each section are removed

**Given** the hit-processing loops (shockwave, mine_around, tactical_shot sections)
**When** an enemy is hit and damage numbers need a position
**Then** the enemy position (`x`, `z`) is stored in the hit object at creation time (like magnetic_field already does)
**And** the O(N) `enemies.find(ev => ev.id === ...)` lookups are removed

**Given** intermediate `.map()` calls that create new arrays (shockwave hitsBatch, mine uniqueHits.map)
**When** building damage number entries
**Then** the final format is built directly in the hit-collection loop, eliminating the extra `.map()` pass

**Given** `useGame.getState()` and `useWeapons.getState()`
**When** called multiple times in the same frame for the same store
**Then** each store is read via `getState()` at most once per logical section, with the result cached in a local variable

**Technical Notes:**
- Pre-allocate arrays at module level (outside the component): `const _projectileHits = []`, `const _dnEntries = []`, etc.
- Clear with `_projectileHits.length = 0` at the start of each section, not `= []`
- For weapon bucketing, iterate `activeWeapons` once with a `for` loop and `switch` or `if/else` on `WEAPONS[w.weaponId]?.weaponType`
- Store enemy position in hit objects: `{ enemyId, damage, isCrit, x: enemy.x, z: enemy.z }` — already done for magnetic_field, replicate to shockwave/mine/tactical

### Story 41.2: Store Tick Guards — Conditional set() & Stable References

As a player,
I want the game to avoid unnecessary React re-renders caused by store updates that don't change anything visible,
So that the UI layer stays responsive even during heavy combat.

**Acceptance Criteria:**

**Given** `usePlayer.tick()` calling `set()` every frame
**When** the player position hasn't changed (ship is stationary or delta is zero)
**Then** `set()` is not called at all — no Zustand notification is emitted

**Given** `usePlayer.tick()` updating `position`
**When** the position values change
**Then** `position` is stored as a persistent array (ref or `Float32Array`) with values mutated in-place rather than creating `[px, 0, pz]` each frame
**And** `set()` is called with a shallow-compare guard: only include fields whose values actually differ from current state
**And** if no fields differ, `set()` is skipped entirely

**Given** `useLevel.scanningTick()` during a planet scan
**When** updating scan progress each frame
**Then** the `scanProgress` field is mutated directly on the planet object in the existing array
**And** `set()` is only called when the scan starts (0→>0) and when it completes (→1.0), not every frame
**And** a `scanProgressDirty` flag or ref signals the renderer to re-read, rather than replacing the planets array

**Given** `useDamageNumbers.spawnDamageNumbers()`
**When** called multiple times per frame during dense combat
**Then** uses a ring buffer (fixed-size array with head/tail indices) instead of `[...spread]` + `.slice()` to avoid allocations

**Given** `useEnemies.damageEnemiesBatch()`
**When** called 3-4 times per frame with different weapon hit results
**Then** the internal `damageMap` is a module-level `Map` cleared with `.clear()` between calls, not a `new Map()` each time

**Given** `useWeapons.fire()` with `poolLimit` check
**When** counting projectiles per weapon
**Then** maintains a per-weapon counter incremented on spawn and decremented on deactivation, instead of `projectiles.filter(p => p.weaponId === ...).length`

**Technical Notes:**
- For `usePlayer.tick()`, compare each computed field against `get()` before calling `set()`. Example: `const s = get(); const changed = {}; if (px !== s.position[0]) { s.position[0] = px; changed.position = s.position; }` — mutate the existing array, only include in `set()` if changed.
- For `useLevel.scanningTick()`, the key insight is that `PlanetRenderer` reads planets via `getState()` in `useFrame` (imperatively), so it doesn't need a React re-render to see mutations. Only call `set({ planets })` on scan start/end for UI components (HUD minimap dots) that need React notification.
- Ring buffer for damage numbers: `const pool = new Array(MAX_COUNT).fill(null); let head = 0;` — write at `pool[head % MAX_COUNT]`, increment head.

### Story 41.3: Spatial Systems — Integer Keys & Pre-allocated Structures

As a player,
I want collision detection and separation to run without allocating memory,
So that dense enemy encounters (100+ enemies) don't trigger GC pauses.

**Acceptance Criteria:**

**Given** `spatialHash.js` `_key(cx, cz)` function
**When** computing cell keys for entity insertion and querying
**Then** returns an integer `((cx & 0xFFFF) << 16) | (cz & 0xFFFF)` instead of a template string
**And** the backing `Map` uses integer keys throughout

**Given** `separationSystem.js` `applySeparation()` called each frame
**When** tracking processed pairs
**Then** uses a module-level `Set` cleared with `.clear()` at the start of each call, not `new Set()` each frame

**Given** pair keys in `separationSystem.js`
**When** computing pair identity for two enemies
**Then** uses an integer pair key (e.g., `minId * 100000 + maxId` or bit-packed) instead of template string `${idA}_${idB}`

**Given** the separation spatial hash and the collision spatial hash
**When** both are rebuilt each frame with the same enemy positions
**Then** document in code comments that sharing is a possible future optimization, but keep separate for now (different cell sizes may be needed)

**Given** `for...of` loops on arrays in `PlanetAuraRenderer.jsx` and `useLevel.scanningTick()`
**When** iterating planets or entities in hot paths
**Then** use indexed `for (let i = 0; i < arr.length; i++)` to avoid iterator allocation

**Technical Notes:**
- Integer key: `CELL_SIZE=2` and `PLAY_AREA_SIZE=2000` means cell coords range from -1000 to +1000, well within 16-bit signed range (±32767).
- For pair keys: enemy IDs are formatted `enemy_N`. Parse once on spawn and store as `numericId` on the enemy object. Then pair key = `Math.min(a,b) * 100000 + Math.max(a,b)`.
- Pre-allocated Set: `const _processedPairs = new Set()` at module level. In `applySeparation()`: `_processedPairs.clear()` then use normally.

### Story 41.4: HUD Re-render Reduction — Timer Throttle & Minimap Extraction

As a player,
I want the HUD to update only when visible information changes,
So that React reconciliation doesn't eat CPU budget during gameplay.

**Acceptance Criteria:**

**Given** `systemTimer` displayed in the HUD as seconds
**When** subscribing to the game store
**Then** the selector rounds to the nearest second: `useGame((s) => Math.floor(s.systemTimer))`
**And** the HUD only re-renders for the timer once per second instead of 60 times

**Given** `playerPosition` and `playerRotation` used only by the minimap
**When** rendering the HUD
**Then** the minimap is extracted into a dedicated `<MinimapPanel />` sub-component with its own store selectors
**And** position/rotation updates only trigger re-renders of `MinimapPanel`, not the entire HUD

**Given** `planets.filter((p) => isWithinMinimapRadius(...))` in HUD render
**When** playerPosition or planets change
**Then** the filtered list is wrapped in `useMemo` with `[planets, playerPosition]` dependencies
**And** the filter only re-runs when its dependencies actually change (not on unrelated HUD re-renders)

**Given** the overall HUD component
**When** profiled with React DevTools during gameplay
**Then** re-renders are ≤5/s during normal gameplay (combat without timer/position changes in same second)

**Technical Notes:**
- `Math.floor(s.systemTimer)` as selector equality: Zustand uses `Object.is()` by default, so `Math.floor(3.14) === Math.floor(3.99)` → both return 3, no re-render. When it ticks to 4.0, the selector returns 4 → re-render. Exactly 1/s.
- `MinimapPanel` should subscribe to: `usePlayer((s) => s.position)`, `usePlayer((s) => s.rotation)`, `useLevel((s) => s.planets)`, `useEnemies` via the existing `setInterval` pattern (already correct).
- Move the minimap JSX block (canvas + dots) entirely into `MinimapPanel`. The parent HUD passes no props — `MinimapPanel` reads everything from stores.
- `useMemo` for planets filter: `const visiblePlanets = useMemo(() => planets.filter(p => isWithinMinimapRadius(p, pos, radius)), [planets, pos[0], pos[2]])` — note: subscribe to individual coords if position is an array, to avoid reference issues.

### Story 41.5: Renderer Micro-Optimizations & Geometry-Ready Architecture

As a developer,
I want renderers to avoid unnecessary GPU uploads and be structured for future custom geometries,
So that switching XP orbs/gems from spheres to faceted crystals doesn't require an architectural rewrite.

**Acceptance Criteria:**

**Given** `XPOrbRenderer` setting `instanceColor.needsUpdate = true` every frame
**When** orb colors (cyan vs gold) are static after spawn and never change
**Then** `instanceColor.needsUpdate` is only set to `true` when the active orb count changes or a new orb appears
**And** a simple `prevActiveCount` ref tracks whether an upload is needed

**Given** `WormholeRenderer` creating `new THREE.Color()` at component body level
**When** the component re-renders (from `useLevel` state change)
**Then** the colors are defined as module-level constants (outside the component) or wrapped in `useMemo`

**Given** `EnemyRenderer` and other renderers calling `performance.now()`
**When** R3F provides `state.clock.elapsedTime` via `useFrame((state, delta) => ...)`
**Then** replace `performance.now()` with `state.clock.elapsedTime * 1000` to avoid the syscall

**Given** each `Planet` component has its own `useFrame` for rotation
**When** 7 planets are mounted
**Then** consider documenting this as a future consolidation opportunity (7 useFrame callbacks is minor, not blocking)

**Given** the current `XPOrbRenderer` using `SphereGeometry` for all orbs
**When** the architecture is reviewed for future-proofing
**Then** the geometry is passed via a `useRef` or `useMemo` that can be swapped to `IcosahedronGeometry`, `OctahedronGeometry`, or a custom `BufferGeometry` without changing the instancing logic
**And** rare orbs (gold) can use a different geometry ref than standard orbs (cyan) by having two `InstancedMesh` groups — one per geometry type
**And** the same pattern is documented/applied to `FragmentGemRenderer` and `HealGemRenderer` for future shape upgrades
**And** a code comment marks the geometry swap point: `// GEOMETRY: swap here for custom gem shape`

**Given** `Math.sin()` called per-orb each frame for Y-axis bobbing
**When** 50+ orbs are active
**Then** this is acceptable (3000 sin/s is trivial on modern CPUs) — no change needed, but document that a LUT is available if orb counts grow past 200

**Technical Notes:**
- For the dual-geometry InstancedMesh pattern in XPOrbRenderer:
  ```jsx
  const standardGeo = useMemo(() => new THREE.IcosahedronGeometry(0.3, 1), [])
  const rareGeo = useMemo(() => new THREE.OctahedronGeometry(0.4, 0), [])
  // Two InstancedMesh: one for standard orbs, one for rare
  ```
  This splits the single InstancedMesh into two, each with its own geometry. The instance count per mesh is lower but the draw calls go from 1→2, which is negligible.
- For `instanceColor.needsUpdate` guard:
  ```js
  const prevCountRef = useRef(0)
  // In useFrame:
  if (activeCount !== prevCountRef.current) {
    instanceColor.needsUpdate = true
    prevCountRef.current = activeCount
  }
  ```
- Module-level colors for WormholeRenderer:
  ```js
  const WORMHOLE_COLOR = new THREE.Color('#5518aa')
  const WORMHOLE_COLOR2 = new THREE.Color('#bb88ff')
  ```
  Move outside the component function body.

## Dependencies

- Story 2.1 (Spatial Hash) — Story 41.3 modifie `spatialHash.js`
- Story 23.2 (Enemy Collision / Separation) — Story 41.3 modifie `separationSystem.js`
- Story 4.2 (HUD) — Story 41.4 restructure le HUD
- Story 3.1 (XP Orbs) — Story 41.5 prépare le renderer pour des géométries custom
- Story 19.1 (Rare XP Gems) — Story 41.5 sépare les InstancedMesh standard/rare

## Success Metrics

- Zero GC-visible allocations par frame dans le GameLoop (mesurable via Chrome DevTools > Performance > Memory timeline)
- HUD re-renders ≤5/s pendant le gameplay normal (mesurable via React DevTools Profiler)
- Aucune régression de comportement gameplay — tous les tests existants passent
- FPS stable ≥55 avec 100 ennemis + 6 armes actives + 50 orbes sur hardware mid-range
- Architecture prête pour swap de géométrie orbes/gems sans refactor
