# Performance Review — Feb 2026

## Freeze Root Cause Analysis

User reports occasional freezes during enemy spawn bursts.

Primary suspects confirmed:

### 1. spawnEnemies() eviction path — useEnemies.jsx:106-113
- Executes on EVERY spawnEnemies() call when pool is full (common in late game)
- `.filter()` + `.sort()` + `.slice().map()` + Set construction + `.filter()` = 4 array allocations + O(n log n) sort
- Uses `parseInt(a.id.slice(6))` for sort key — string parsing inside sort comparator
- FIX: use `a.numericId` (already exists on enemy objects, line 138) instead of parseInt
- FIX: replace double-filter with single-pass eviction loop

### 2. Damage number set() cascade — multiple GameLoop sections
- Each weapon system (7a-bis through 7a-sexies) calls spawnDamageNumbers() independently
- _dnEntries is reset to length 0 before each system, forcing separate set() calls
- On a large wave death: projectiles (7b) + laser cross (7a-bis) + magnetic (7a-ter) = 3 set() on useDamageNumbers
- FIX: accumulate ALL _dnEntries across all weapon systems, call spawnDamageNumbers() ONCE at end of section 7

### 3. enemies.find() in damageEnemiesBatch — useEnemies.jsx:532
- Inner loop: `enemies.find((e) => e.id === enemyId)` — O(n) per hit, O(n×m) total
- With 100 enemies and 30 hits: 3000 string comparisons per batch call
- FIX: build temporary Map<id, enemy> before the loop, or maintain persistent Map in store

### 4. Object.keys(changed).length — usePlayer.jsx:296
- `Object.keys()` allocates array at 60 FPS = 3600 allocs/min
- FIX: use `let hasChange = false` boolean flag, set to true on each `changed.X = ...` assignment

### 5. [...currentEnemies, ...batch] spread — useEnemies.jsx:163
- Copies full 100-enemy array on every spawn event
- FIX: ideally use fixed-size pool array (like useDamageNumbers), or at minimum Array.concat()

### 6. getAvailableEnemyTypes() — spawnSystem.js:30-38
- Object.values(ENEMIES) + spread per enemy on each spawn batch
- Called once per batch (not per pick, MED-1 fix already applied)
- FIX: cache by (systemNum, phaseKey) with change detection

## What's Already Well Optimized

- useDamageNumbers ring buffer: zero GC in hot path
- _projCountByWeapon Map: avoids O(N) filter for pool limit check
- Pre-allocated _projectileHits, _dnEntries, _damageMap, _killIds, _seenEnemies arrays
- Pre-allocated entity descriptor pool in GameLoop (entityPoolRef)
- Pre-allocated _orbIds, _healGemIds, _fragmentGemIds for spatial hash
- usePlayer tick: conditional set() with changed-only dict
- System scaling cache (systemScalingCacheKeyRef) — recomputed only on system transition
- Fog update throttled to every 10 frames
- delta clamped to 0.1s (tab-return protection)
