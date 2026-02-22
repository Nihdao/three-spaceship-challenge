# Epic 36: Enemy Pressure Systems

Ajout d'un système de laisse (leash) qui téléporte les ennemis trop éloignés du joueur, et d'un mécanisme d'éviction de pool pour que les nouvelles vagues remplacent les anciennes quand le pool est saturé. Ces deux systèmes garantissent que le joueur fait toujours face à des ennemis proches, même en explorant activement la carte.

## Epic Goals

- Implémenter un leash system dans `useEnemies.tick()` : les ennemis de type `chase`, `shockwave`, `sniper_mobile` qui s'éloignent de plus de 750 unités du joueur se téléportent à portée de spawn
- Réutiliser l'infrastructure `_teleportEvents` existante pour les effets visuels de téléportation
- Modifier `spawnEnemies()` pour évincer les ennemis les plus vieux non-élites quand le pool est plein
- Désactiver le leash pendant le boss fight

## Epic Context

Avec 15 planètes réparties sur 4000×4000 unités, le joueur va nécessairement s'éloigner d'ennemis apparus loin de sa position actuelle. Sans leash, les vagues s'accumulent dans des zones abandonnées tandis que le joueur explore librement. Le result : densité locale faible, pression nulle. Avec le leash à 1.5× MINIMAP_VISIBLE_RADIUS (750u), tout ennemi qui "perd" le joueur réapparaît dans sa zone. La tension est maintenue sans nécessiter d'IA pathfinding complexe. L'éviction de pool empêche les vagues anciennes de bloquer le spawn des nouvelles en fin de session intensive.

## Stories

### Story 36.1: Enemy Leash / Teleport System

As a player,
I want enemies to teleport near me if I move too far away,
So that I can never fully escape combat by running away.

**Acceptance Criteria:**

**Given** `useEnemies.tick(delta, playerPosition, options)` where `options.leashEnabled`
**When** an enemy of behavior `chase`, `shockwave`, or `sniper_mobile` has distance to player > `LEASH_DISTANCE` (750 units)
**Then** that enemy is relocated to a random position at spawn distance (80–120 units) from the player
**And** a teleport departure event is pushed (old position) and a teleport arrival event (new position) via `_teleportEvents` (same format as existing TELEPORT enemy behavior)
**And** the enemy's position is updated in-place (no new object allocation)

**Given** leash during boss fight
**When** `options.leashEnabled === false`
**Then** no enemy is leashed regardless of distance

**Given** enemy types excluded from leash
**When** an enemy of behavior `sweep`, `sniper_fixed`, or any boss entity is at leash distance
**Then** it is NOT teleported (sweep has its own despawn, sniper_fixed is stationary by design)

**Given** `GameLoop.jsx`
**When** calling `useEnemies.getState().tick(clampedDelta, playerPos)`
**Then** `leashEnabled: !bossActive` is passed as option

**Given** `LEASH_DISTANCE`
**When** defined
**Then** it equals `GAME_CONFIG.MINIMAP_VISIBLE_RADIUS * 1.5` (750 units for default config)
**And** it is exported from `gameConfig.js` as `ENEMY_LEASH_DISTANCE` (or computed inline)

**Given** teleport arrival position
**When** the leash fires
**Then** spawn position is random angle, distance ∈ [80, 120] units from player, clamped to play area bounds

### Story 36.2: Enemy Pool Eviction on Overflow

As a developer,
I want new enemy waves to always spawn even when the pool is full,
So that late-game tension never stalls due to stale old-wave enemies.

**Acceptance Criteria:**

**Given** `spawnEnemies(instructions)` called when `enemies.length >= MAX_ENEMIES_ON_SCREEN`
**When** the overflow would otherwise silently discard the new batch
**Then** the oldest non-elite, non-boss enemies are removed to free exactly `instructions.length` slots (or as many as needed)
**And** "oldest" = lowest numeric ID suffix (first spawned = first evicted)
**And** enemies with `behavior === 'boss'` or `tier === 'ELITE'` are NEVER evicted

**Given** evicted enemies
**When** removed
**Then** they are silently despawned (no death explosion, no XP drop, no loot) — they simply disappear
**And** no `_teleportEvents` are emitted for evictions (silent removal, different from leash)

**Given** the new batch
**When** pool was full and oldest enemies evicted
**Then** the new enemies spawn at their intended positions as normal

**Given** `MAX_ENEMIES_ON_SCREEN`
**When** reviewed post-story
**Then** the value remains 100 (no change to cap, only the "full → discard" behavior changes to "full → evict oldest")

## Technical Notes

**Leash in tick() — insertion point:**
```js
// After existing behavior switch (chase, sweep, sniper...), before shockwave tick
// Only for leash-eligible behaviors:
const LEASH_ELIGIBLE = new Set(['chase', 'shockwave', 'sniper_mobile'])

for (let i = 0; i < enemies.length; i++) {
  const e = enemies[i]
  if (!leashEnabled) break  // skip entire loop if boss active
  if (!LEASH_ELIGIBLE.has(e.behavior)) continue
  const dx = px - e.x, dz = pz - e.z
  if (dx * dx + dz * dz > LEASH_DIST_SQ) {
    // record old pos for teleport VFX
    _teleportEvents.push({ oldX: e.x, oldZ: e.z, newX: 0, newZ: 0 })
    // relocate
    const angle = Math.random() * Math.PI * 2
    const dist = 80 + Math.random() * 40
    e.x = Math.max(-bound, Math.min(bound, px + Math.cos(angle) * dist))
    e.z = Math.max(-bound, Math.min(bound, pz + Math.sin(angle) * dist))
    _teleportEvents[_teleportEvents.length - 1].newX = e.x
    _teleportEvents[_teleportEvents.length - 1].newZ = e.z
  }
}
```

**Pool eviction sort — performance note:**
- Sort by ID suffix is O(n log n) but runs infrequently (only when pool is full)
- The ID format is `enemy_${nextId}` — parse the suffix as integer for comparison
- Limit eviction to exactly the number of slots needed (min eviction)

**LEASH_DIST_SQ:**
```js
const ENEMY_LEASH_DISTANCE = GAME_CONFIG.MINIMAP_VISIBLE_RADIUS * 1.5  // 750
const LEASH_DIST_SQ = ENEMY_LEASH_DISTANCE * ENEMY_LEASH_DISTANCE       // 562500
```

**Files touched:**
- `src/stores/useEnemies.jsx` — tick() leash check, spawnEnemies() pool eviction (36.1, 36.2)
- `src/GameLoop.jsx` — passer `leashEnabled: !bossActive` à tick() (36.1)
- `src/config/gameConfig.js` — `ENEMY_LEASH_DISTANCE` constant (36.1)

## Dependencies

- Epic 2 (Enemy System) — useEnemies.tick() et _teleportEvents infrastructure existante
- Story 16.2 (Enemy Behaviors) — les behaviors chase/sweep/sniper_fixed/shockwave existants
- Epic 34 — spawn point aléatoire joueur (le leash cible playerPos, cohérent avec spawn random)

## Success Metrics

- Un ennemi placé à 800u du joueur en console reapparaît dans les 2 secondes à < 150u (QA: debug spawn)
- Le boss et les ELITE ne sont jamais leashés ni évincés (QA: 3 boss fights consécutifs)
- Les sweep enemies ne sont jamais leashés (QA: observer leur trajectoire)
- Une session de 10 minutes sans death maintient une densité d'ennemis constante autour du joueur (QA: ressenti)
- Quand pool = 100, un nouveau spawn éjecte le plus vieil ennemi non-elite (QA: log enemies.length constant)
