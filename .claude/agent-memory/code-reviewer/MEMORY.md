# Code Reviewer Memory — three-spaceship-challenge

## Architecture

- 6-layer: Config → Systems → Stores (Zustand) → GameLoop (useFrame) → Renderers (R3F) → UI (HTML)
- Single GameLoop component (GameLoop.jsx), deterministic tick order sections 1-9
- Stores: usePlayer, useEnemies, useWeapons, useLevel, useDamageNumbers, useBoons, useBoss, useGame, useArmory, useCompanion, useShipProgression, useUpgrades
- No Supabase — client-only game, no backend/RLS concerns
- R3F with instanced meshes for enemies/projectiles — useGLTF + Drei

## Key Store Patterns

- `tick()` mutates objects in-place (no set()) for hot paths — renderers use getState() in useFrame
- `set(changed)` called only with diff object when fields actually change (usePlayer pattern)
- Pre-allocated module-level arrays for zero-GC: `_projectileHits`, `_dnEntries`, `_seenEnemies`, `_damageMap`, `_killIds`
- Ring buffer in useDamageNumbers: `_pool[MAX]` + `_writeIdx`, no spread/slice in hot path
- `_projCountByWeapon` Map avoids O(N) filter in poolLimit checks (Story 41.2)

## Known Performance Issues (from Feb 2026 review)

See `performance-review.md` for full details. Top issues:
1. spawnEnemies eviction: sort O(n log n) + double filter instead of using existing `numericId` field
2. Multiple set() cascades on enemy death wave (dnEntries not batched across weapon systems)
3. Object.keys(changed).length allocates array at 60 FPS in usePlayer.tick() — use boolean flag instead
4. enemies.find() O(n) in damageEnemiesBatch inner loop — should use Map(id → enemy)
5. shockwaveArcs grows unbounded until poolLimit×3 before array.filter prune
6. getAvailableEnemyTypes() rebuilds Object.values(ENEMIES) each spawn batch

## Tables / Entity Counts

- MAX_ENEMIES_ON_SCREEN: 100
- MAX_PROJECTILES: 200
- MAX_XP_ORBS: 50, MAX_HEAL_GEMS: 30, MAX_FRAGMENT_GEMS: 20
- DAMAGE_NUMBERS.MAX_COUNT: 50
- Enemy types: FODDER_BASIC, FODDER_TANK, FODDER_SWARM, SHOCKWAVE_BLOB, SNIPER_MOBILE, SNIPER_FIXED, TELEPORTER

## R3F Patterns

- EnemyRenderer: one EnemyTypeMesh per typeId, each uses InstancedMesh with MAX pre-allocated slots
- Geometries cloned from GLTF scene with matrixWorld baked in (useMemo), disposed in useEffect cleanup
- frustumCulled={false} on all instanced meshes (enemies can be anywhere in large arena)
- TODO known in EnemyRenderer: O(enemies × types) loop — needs pre-bucketing by type

## Recurring Anti-Patterns to Check

- `enemies.find()` in hot paths (GameLoop contact damage, boss projectiles vs player)
- Spread allocation in set(): `[...currentEnemies, ...batch]` at each spawn
- Multiple getState() calls reading same slice (enemies read at lines 416 and 1043 in GameLoop)
- Separate spawnDamageNumbers() calls per weapon system instead of one batched call per frame
