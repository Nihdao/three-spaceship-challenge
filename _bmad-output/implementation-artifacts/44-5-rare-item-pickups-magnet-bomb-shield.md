# Story 44.5: Rare Item Pickups — Magnet, Bomb, Shield

Status: done

## Story

As a player,
I want rare items to occasionally drop from enemies and grant powerful temporary effects when collected,
So that finding a Magnet, Bomb, or Shield creates exciting moments of opportunity.

## Acceptance Criteria

### Partie A — Système & Configuration

1. **Given** `src/config/gameConfig.js`
   **When** it is opened
   **Then** the following new constants exist in a `// Rare Items (Story 44.5)` section:
   ```
   MAX_RARE_ITEMS: 5,
   RARE_ITEM_PICKUP_RADIUS: 2.5,
   MAGNET_ITEM_DROP_CHANCE: 0.025,
   BOMB_ITEM_DROP_CHANCE: 0.008,
   SHIELD_ITEM_DROP_CHANCE: 0.015,
   SHIELD_ITEM_DURATION: 6.0,
   BOMB_ITEM_RADIUS: 18.0,
   BOMB_ITEM_BOSS_DAMAGE_PERCENT: 0.25,
   ```

2. **Given** `src/systems/rareItemSystem.js` (new file)
   **When** it is created
   **Then** it follows the pre-allocated pool pattern of `healGemSystem.js`:
   - Each item: `{ x: 0, z: 0, type: 'MAGNET'|'BOMB'|'SHIELD', isMagnetized: false, active: false }`
   - Exports: `spawnRareItem(x, z, type)`, `updateRareItemMagnetization(px, pz, delta, pickupRadiusMultiplier)`, `collectRareItem(index)`, `getRareItems()`, `getActiveRareItemCount()`, `resetRareItems()`, `forceActivateMagnetRareItems()`

3. **Given** `src/systems/collisionSystem.js`
   **When** a new category is needed
   **Then** `export const CATEGORY_RARE_ITEM = 'rareItem'` is added
   **And** `${CATEGORY_PLAYER}:${CATEGORY_RARE_ITEM}` is added to the `COLLISION_PAIRS` Set

4. **Given** `src/systems/lootSystem.js`
   **When** rare item loot types are registered
   **Then** three `registerLootType` calls are added at the bottom:
   ```js
   registerLootType('MAGNET_ITEM', {
     dropChanceKey: 'MAGNET_ITEM_DROP_CHANCE',
     spawnFn: (x, z) => spawnRareItem(x, z, 'MAGNET'),
   })
   registerLootType('BOMB_ITEM', {
     dropChanceKey: 'BOMB_ITEM_DROP_CHANCE',
     spawnFn: (x, z) => spawnRareItem(x, z, 'BOMB'),
   })
   registerLootType('SHIELD_ITEM', {
     dropChanceKey: 'SHIELD_ITEM_DROP_CHANCE',
     spawnFn: (x, z) => spawnRareItem(x, z, 'SHIELD'),
   })
   ```
   **And** `spawnRareItem` and `resetRareItems` are imported from `'./rareItemSystem.js'`
   **And** `resetAll()` calls `resetRareItems()`

### Partie B — GameLoop Integration

5. **Given** `src/GameLoop.jsx` — section 8a (magnetization, ~line 1380)
   **When** magnetization runs
   **Then** `updateRareItemMagnetization(playerPos[0], playerPos[2], clampedDelta, composedPickupRadius)` is called immediately after the fragment gem magnetization line

6. **Given** `src/GameLoop.jsx` — section 8b (spatial hash registration)
   **When** entities are registered
   **Then** rare items are registered after fragment gems:
   ```js
   const rareItemArray = getRareItems()
   const rareItemCount = getActiveRareItemCount()
   for (let i = 0; i < rareItemCount; i++) {
     if (!pool[idx]) pool[idx] = { id: '', x: 0, z: 0, radius: 0, category: '' }
     assignEntity(pool[idx], _rareItemIds[i], rareItemArray[i].x, rareItemArray[i].z, GAME_CONFIG.RARE_ITEM_PICKUP_RADIUS, CATEGORY_RARE_ITEM)
     cs.registerEntity(pool[idx++])
   }
   ```
   **And** a module-level pre-allocated array `_rareItemIds` exists:
   ```js
   const _rareItemIds = []
   for (let i = 0; i < GAME_CONFIG.MAX_RARE_ITEMS; i++) {
     _rareItemIds[i] = `ritem_${i}`
   }
   ```

7. **Given** `src/GameLoop.jsx` — collision resolution (after fragmentGem hits, before 8e)
   **When** `cs.queryCollisions(pool[0], CATEGORY_RARE_ITEM)` returns hits
   **Then** for each hit, `collectRareItem(index)` is called and returns `{ type }`
   **And** per type:
   - `'MAGNET'`: calls `forceActivateMagnet()` on xpOrbSystem + `forceActivateMagnetHealGems()` on healGemSystem + `forceActivateMagnetFragments()` on fragmentGemSystem
   - `'BOMB'`: iterates `useEnemies.getState().enemies`, filters by `BOMB_ITEM_RADIUS`, calls `useEnemies.getState().damageEnemiesBatch(hits)` where each hit is `{ enemyId: e.id, damage: Infinity }`, then if `useBoss.getState().isActive`, calls `useBoss.getState().damageBoss(useBoss.getState().boss.maxHp * GAME_CONFIG.BOMB_ITEM_BOSS_DAMAGE_PERCENT)`
   - `'SHIELD'`: calls `usePlayer.getState().activateShield(GAME_CONFIG.SHIELD_ITEM_DURATION)`
   **And** `playSFX('rare-item-collect')` is called for every collected item

### Partie C — Effects in Systems

8. **Given** `src/systems/xpOrbSystem.js`
   **When** the Magnet effect fires
   **Then** a new exported function `forceActivateMagnet()` sets `isMagnetized = true` for all active orbs

9. **Given** `src/systems/healGemSystem.js`
   **When** the Magnet effect fires
   **Then** a new exported function `forceActivateMagnetHealGems()` sets `isMagnetized = true` for all active heal gems

10. **Given** `src/systems/fragmentGemSystem.js`
    **When** the Magnet effect fires
    **Then** a new exported function `forceActivateMagnetFragments()` sets `isMagnetized = true` for all active fragment gems

11. **Given** `src/stores/usePlayer.jsx`
    **When** the Shield effect is triggered
    **Then** `shieldTimer: 0` exists in initial state, `resetForNewSystem()`, and `reset()`
    **And** `activateShield(duration)` action exists: `set({ isInvulnerable: true, shieldTimer: duration })`
    **And** in `tick(delta)`, after the invulnerabilityTimer section, a shield timer block runs:
    ```js
    let shieldTimer = state.shieldTimer
    if (shieldTimer > 0) {
      shieldTimer = Math.max(0, shieldTimer - delta)
      if (shieldTimer <= 0 && !isDashing && invulnerabilityTimer <= 0) {
        isInvulnerable = false
      }
    }
    ```
    **And** `shieldTimer` is included in the changed-fields conditional set guard

### Partie D — Shield Visual on PlayerShip

12. **Given** `src/renderers/PlayerShip.jsx`
    **When** `shieldTimer > 0` in player state
    **Then** a shield mesh is present: `<sphereGeometry args={[2.2, 20, 14]} />` with `<meshBasicMaterial color="#4499ff" transparent opacity={0.25} toneMapped={false} />`
    **And** in `useFrame`, the material opacity pulses: `shieldMaterialRef.current.opacity = 0.18 + Math.sin(elapsed * 4) * 0.1`
    **And** the shield mesh visibility is driven by `usePlayer.getState().shieldTimer > 0` read in `useFrame` (no Zustand subscription)
    **And** when `shieldTimer === 0`, the shield mesh has `visible={false}`

### Partie E — RareItemRenderer

13. **Given** `src/renderers/RareItemRenderer.jsx` (new file)
    **When** rare items are active
    **Then** it uses **3 separate InstancedMesh components**, one per type (MAX=5 each):
    - `MAGNET`: `TorusGeometry(0.28, 0.07, 8, 24)`, color `#00eeff`
    - `BOMB`: `IcosahedronGeometry(0.35, 0)`, color `#ff3300`
    - `SHIELD`: `OctahedronGeometry(0.32, 0)`, color `#44aaff`
    **And** all three use `MeshBasicMaterial({ toneMapped: false })`
    **And** in `useFrame`, each active item gets rotation + vertical oscillation:
    - MAGNET: `rotation.set(0, elapsed * 3.0, 0)`, Y oscillation
    - BOMB: `rotation.set(elapsed * 1.5, elapsed * 2.0, 0)`, Y oscillation
    - SHIELD: `rotation.set(elapsed * 1.0, elapsed * 1.5, elapsed * 0.5)`, Y oscillation
    - Oscillation: `position.y = Math.sin(elapsed * 2.5 + i * 1.2) * 0.15`

14. **Given** `src/scenes/GameplayScene.jsx`
    **When** renderers are listed
    **Then** `<RareItemRenderer />` is present and imported from `'../renderers/RareItemRenderer.jsx'`

15. **Given** `vitest run`
    **When** the story is implemented
    **Then** all existing tests pass
    **And** a new file `src/stores/__tests__/usePlayer.shield.test.js` exists with:
    - `activateShield(5)` → `shieldTimer = 5`, `isInvulnerable = true`
    - `tick(3)` → `shieldTimer = 2`, `isInvulnerable = true`
    - `tick(3)` → `shieldTimer = 0`, `isInvulnerable = false`
    - `reset()` → `shieldTimer = 0`

## Tasks / Subtasks

- [x] Task 1 — Configuration (AC: #1)
  - [x] Add 8 `RARE_ITEMS` constants to `gameConfig.js`

- [x] Task 2 — `rareItemSystem.js` (AC: #2, #8, #9, #10 partial)
  - [x] Create `src/systems/rareItemSystem.js` with pre-allocated pool
  - [x] Export: `spawnRareItem`, `updateRareItemMagnetization`, `collectRareItem`, `getRareItems`, `getActiveRareItemCount`, `resetRareItems`
  - [x] Add `forceActivateMagnet()` to `xpOrbSystem.js`
  - [x] Add `forceActivateMagnetHealGems()` to `healGemSystem.js`
  - [x] Add `forceActivateMagnetFragments()` to `fragmentGemSystem.js`

- [x] Task 3 — collisionSystem.js (AC: #3)
  - [x] Add `CATEGORY_RARE_ITEM = 'rareItem'`
  - [x] Add the pair to `COLLISION_PAIRS`

- [x] Task 4 — lootSystem.js (AC: #4)
  - [x] Import `spawnRareItem`, `resetRareItems` from `rareItemSystem.js`
  - [x] Register `MAGNET_ITEM`, `BOMB_ITEM`, `SHIELD_ITEM`
  - [x] Add `resetRareItems()` to `resetAll()`

- [x] Task 5 — GameLoop.jsx integration (AC: #5, #6, #7)
  - [x] Import `updateRareItemMagnetization`, `getRareItems`, `getActiveRareItemCount`, `collectRareItem` from rareItemSystem
  - [x] Import `CATEGORY_RARE_ITEM` from collisionSystem
  - [x] Import `forceActivateMagnet` from xpOrbSystem, `forceActivateMagnetHealGems` from healGemSystem, `forceActivateMagnetFragments` from fragmentGemSystem
  - [x] Add `_rareItemIds` module-level array
  - [x] Add magnetization call in section 8a
  - [x] Add pool registration in section 8b
  - [x] Add collision query + effect dispatch after fragment gem hits

- [x] Task 6 — usePlayer.jsx shield (AC: #11)
  - [x] Add `shieldTimer: 0` to initial state
  - [x] Add `activateShield(duration)` action
  - [x] Add shield tick logic
  - [x] Add `shieldTimer` to changed-fields guard
  - [x] Add `shieldTimer: 0` to `reset()` and `resetForNewSystem()`

- [x] Task 7 — PlayerShip.jsx shield visual (AC: #12)
  - [x] Add shield sphere mesh
  - [x] Wire opacity pulse in useFrame via `usePlayer.getState()`

- [x] Task 8 — RareItemRenderer.jsx (AC: #13)
  - [x] Create new renderer with 3 InstancedMesh (Magnet/Bomb/Shield)
  - [x] Animate rotation + Y oscillation

- [x] Task 9 — GameplayScene.jsx (AC: #14)
  - [x] Import and render `<RareItemRenderer />`

- [x] Task 10 — Tests (AC: #15)
  - [x] Create `usePlayer.shield.test.js`
  - [x] Run `vitest run` and confirm 100%

## Dev Notes

### Critical Corrections vs. Epic Spec

**⚠️ COLLISION CATEGORY**: The epic spec says `1 << 9` (bit flag), but `collisionSystem.js` uses **string categories**, not bit flags. `CATEGORY_HEAL_GEM = 'healGem'`, `CATEGORY_FRAGMENT_GEM = 'fragmentGem'`. Add: `export const CATEGORY_RARE_ITEM = 'rareItem'` and add `'player:rareItem'` (or its sorted form) to `COLLISION_PAIRS`.

**⚠️ BOSS DAMAGE FUNCTION**: The epic says `useBoss.getState().takeDamage(...)` — this function does NOT exist. The correct function is `useBoss.getState().damageBoss(amount)`. The boss maxHP field is `boss.maxHp` (lowercase `p`):
```js
const bossState = useBoss.getState()
if (bossState.isActive && bossState.boss) {
  bossState.damageBoss(bossState.boss.maxHp * GAME_CONFIG.BOMB_ITEM_BOSS_DAMAGE_PERCENT)
}
```

**⚠️ `damageEnemiesBatch` API**: Takes `Array<{ enemyId, damage }>`, not individual calls. Build the hits array from `useEnemies.getState().enemies`:
```js
const enemies = useEnemies.getState().enemies
const bombRadSq = GAME_CONFIG.BOMB_ITEM_RADIUS * GAME_CONFIG.BOMB_ITEM_RADIUS
const bombHits = []
for (let i = 0; i < enemies.length; i++) {
  const e = enemies[i]
  const dx = e.x - playerPos[0], dz = e.z - playerPos[2]
  if (dx * dx + dz * dz <= bombRadSq) bombHits.push({ enemyId: e.id, damage: Infinity })
}
if (bombHits.length > 0) useEnemies.getState().damageEnemiesBatch(bombHits)
```

### rareItemSystem.js — Exact Pool Pattern

Mirror `healGemSystem.js` exactly. Key differences from xpOrbSystem:
- `spawnRareItem` returns `false` (pool full) rather than recycling oldest
- Pool object shape: `{ x: 0, z: 0, type: 'MAGNET', isMagnetized: false, active: false }`
- `collectRareItem(index)` returns `{ type }` (not a numeric value)
- Export name for reset: `resetRareItems` (not bare `reset`)

```js
export function collectRareItem(index) {
  const type = rareItems[index].type
  activeCount--
  if (index < activeCount) {
    const temp = rareItems[index]
    rareItems[index] = rareItems[activeCount]
    rareItems[activeCount] = temp
  }
  return { type }
}
```

- `updateRareItemMagnetization` must use **sticky magnetization** (44.3 pattern — once `isMagnetized = true`, never reset to false for this story). Since 44.3 is backlog and may not yet be implemented, implement the sticky pattern directly here:
```js
if (distSq <= magnetRadiusSq) {
  item.isMagnetized = true
}
// NO else { isMagnetized = false } — sticky by design
```

### GameLoop.jsx — _rareItemIds ID Format

The existing pattern for healGem is `_healGemIds[i] = 'healGem_${i}'` and index is extracted with `parseInt(hit.id.split('_')[1], 10)`. Use `ritem_${i}` — `'ritem_0'.split('_')` = `['ritem', '0']`, so `split('_')[1]` correctly gives the index.

```js
const _rareItemIds = []
for (let i = 0; i < GAME_CONFIG.MAX_RARE_ITEMS; i++) {
  _rareItemIds[i] = `ritem_${i}`
}
```

Place this near lines 57–65 where `_healGemIds` and `_fragmentGemIds` are defined.

### usePlayer.jsx — shieldTimer Tick Logic

Insert the shield timer block **after** the invulnerabilityTimer block and **before** the dashTimer block (~line 223). This ensures the priority is:
1. `invulnerabilityTimer` manages i-frames from damage
2. `shieldTimer` manages shield-item invulnerability
3. `isDashing` manages dash invulnerability

The resolution for `isInvulnerable = false` must only trigger when **all three** sources have expired:
```js
// --- Shield timer (Story 44.5) ---
let shieldTimer = state.shieldTimer
if (shieldTimer > 0) {
  shieldTimer = Math.max(0, shieldTimer - delta)
  if (shieldTimer <= 0 && invulnerabilityTimer <= 0 && !state.isDashing) {
    isInvulnerable = false
  }
}
```

Add to `changed` guard: `if (shieldTimer !== state.shieldTimer) changed.shieldTimer = shieldTimer`

**Both `reset()` and `resetForNewSystem()` need `shieldTimer: 0`**. `resetForNewSystem` is around line 555 — check it!

### PlayerShip.jsx — Shield Visual Pattern

Read shield state via `usePlayer.getState()` in `useFrame`, not a Zustand hook (no re-render):
```jsx
const shieldMeshRef = useRef()
const shieldMaterialRef = useRef()
// In useFrame:
const shieldActive = usePlayer.getState().shieldTimer > 0
shieldMeshRef.current.visible = shieldActive
if (shieldActive) {
  shieldMaterialRef.current.opacity = 0.18 + Math.sin(state.clock.elapsedTime * 4) * 0.1
}
```

Use `<meshBasicMaterial ref={shieldMaterialRef} color="#4499ff" transparent opacity={0.25} toneMapped={false} />` with `<sphereGeometry args={[2.2, 20, 14]} />`.

### RareItemRenderer.jsx — 3 InstancedMesh Pattern

Since there are 3 different geometries (Torus, Icosahedron, Octahedron), use **3 separate `instancedMesh` JSX elements** with `MAX_RARE_ITEMS` capacity each (5 total per type — pooled items are sparse across types). In `useFrame`, iterate `getRareItems()` and dispatch per type to the correct mesh. Track indices separately per type.

```jsx
// Per-type index tracking in useFrame:
let magnetIdx = 0, bombIdx = 0, shieldIdx = 0
for (let i = 0; i < count; i++) {
  const item = items[i]
  if (item.type === 'MAGNET') {
    // set matrix on magnetMeshRef, magnetIdx++
  } else if (item.type === 'BOMB') { ... }
  else if (item.type === 'SHIELD') { ... }
}
magnetMeshRef.current.count = magnetIdx
// ...
```

Memory management: dispose geometry/material in `useEffect` cleanup.

### forceActivateMagnet Functions — Naming

Keep names distinct per system to avoid import conflicts:
- `xpOrbSystem.js`: `export function forceActivateMagnet()`
- `healGemSystem.js`: `export function forceActivateMagnetHealGems()`
- `fragmentGemSystem.js`: `export function forceActivateMagnetFragments()`

The epic spec uses the same name for all three, but since they're imported together in GameLoop.jsx, they need distinct names.

### Project Structure Notes

- New system file: `src/systems/rareItemSystem.js` — mirrors `healGemSystem.js`
- New renderer: `src/renderers/RareItemRenderer.jsx` — mirrors `HealGemRenderer.jsx`
- New test file: `src/stores/__tests__/usePlayer.shield.test.js`
- All new files in same directories as their peers — no new directories needed

### References

- Loot registry pattern: `src/systems/lootSystem.js#registerLootType` [Source: lootSystem.js:24]
- Pool pattern reference: `src/systems/healGemSystem.js` [full file]
- GameLoop collision section: `src/GameLoop.jsx:1370-1470`
- Collision category strings: `src/systems/collisionSystem.js:5-14`
- COLLISION_PAIRS Set: `src/systems/collisionSystem.js:18-29`
- `damageEnemiesBatch` API: `src/stores/useEnemies.jsx:524` — takes `Array<{enemyId, damage}>`
- `damageBoss` function: `src/stores/useBoss.jsx:141`
- Boss `maxHp` field (lowercase): `src/stores/useBoss.jsx:25`
- usePlayer tick structure: `src/stores/usePlayer.jsx:210-298`
- usePlayer reset locations: `src/stores/usePlayer.jsx:555-610` (both `reset` and `resetForNewSystem`)
- _healGemIds pattern: `src/GameLoop.jsx:57-65`
- HealGemRenderer renderer template: `src/renderers/HealGemRenderer.jsx` [full file]
- GameplayScene renderer list: `src/scenes/GameplayScene.jsx:1-20`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

No blockers encountered.

### Completion Notes List

- Created `rareItemSystem.js` with pre-allocated pool pattern mirroring `healGemSystem.js`. Exposes `spawnRareItem`, `collectRareItem` (returns `{type}`), `updateRareItemMagnetization` (sticky pattern), `forceActivateMagnetRareItems`, `getRareItems`, `getActiveRareItemCount`, `resetRareItems`.
- Added `forceActivateMagnet()` to xpOrbSystem, `forceActivateMagnetHealGems()` to healGemSystem, `forceActivateMagnetFragments()` to fragmentGemSystem.
- Added `CATEGORY_RARE_ITEM = 'rareItem'` + `player:rareItem` collision pair in collisionSystem.
- Registered 3 loot types (MAGNET_ITEM, BOMB_ITEM, SHIELD_ITEM) in lootSystem + `resetRareItems()` in `resetAll()`.
- GameLoop: `_rareItemIds` pre-allocated array, magnetization call in section 8a, pool registration in section 8b, collision query + per-type effect dispatch (MAGNET→force-magnetize all, BOMB→AoE enemy + boss damage, SHIELD→activateShield).
- usePlayer: `shieldTimer` in initial state, `activateShield(duration)` action, shield tick logic after invulnerabilityTimer, changed-fields guard, `shieldTimer: 0` in both `reset()` and `resetForNewSystem()`.
- PlayerShip: shield sphere mesh (`sphereGeometry 2.2, 20, 14`), opacity pulse via `usePlayer.getState()` in useFrame (no Zustand subscription).
- RareItemRenderer: 3 InstancedMesh (Torus/Icosahedron/Octahedron), per-type rotation + Y oscillation animation, geometry/material disposal in useEffect cleanup.
- All 159 test files, 2704 tests pass — zero regressions.

### File List

- `src/config/gameConfig.js`
- `src/systems/rareItemSystem.js` (new)
- `src/systems/collisionSystem.js`
- `src/systems/lootSystem.js`
- `src/systems/xpOrbSystem.js`
- `src/systems/healGemSystem.js`
- `src/systems/fragmentGemSystem.js`
- `src/stores/usePlayer.jsx`
- `src/GameLoop.jsx`
- `src/renderers/RareItemRenderer.jsx` (new)
- `src/renderers/PlayerShip.jsx`
- `src/scenes/GameplayScene.jsx`
- `src/stores/__tests__/usePlayer.shield.test.js` (new)

## Senior Developer Review (AI)

**Reviewer:** Adam — 2026-02-25
**Outcome:** Approved with fixes applied

**Issues fixed (6):**
- [HIGH] `rare-item-collect` SFX absent de `useAudio.jsx` SFX_MAP et `audioManager.js` SFX_CATEGORY_MAP et `assetManifest.js` — ajout des 3 entrées pour preloading correct
- [MEDIUM] `forceActivateMagnetRareItems()` exportée mais jamais appelée — import ajouté dans GameLoop + appel dans le bloc MAGNET (cohérence avec les 3 autres systèmes force-magnétisés)
- [MEDIUM] `collectRareItem()` ne remettait pas `active = false` sur l'item collecté — flag réinitialisé après le swap-remove
- [LOW] Code redondant dans `RareItemRenderer.jsx` MAGNET color setting (if/else avec branches identiques) — simplifié

**Files modified by review:** `src/config/assetManifest.js`, `src/hooks/useAudio.jsx`, `src/audio/audioManager.js`, `src/GameLoop.jsx`, `src/systems/rareItemSystem.js`, `src/renderers/RareItemRenderer.jsx`

## Change Log

- 2026-02-25: Story 44.5 implemented — Rare item pickups (Magnet, Bomb, Shield) with drop system, GameLoop integration, shield timer in usePlayer, shield visual on PlayerShip, RareItemRenderer with 3 InstancedMesh. 159 test files / 2704 tests pass.
- 2026-02-25: Code review — 6 issues fixed (SFX preloading, forceActivateMagnetRareItems branchement, active flag cleanup, redundant code). 159 test files / 2705 tests pass.
