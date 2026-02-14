# Story 19.2: Heal Gem Drops

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want enemies to rarely drop small heal gems that restore my HP,
so that I have an additional survival resource and am rewarded for aggressive play.

## Acceptance Criteria

1. **Given** an enemy dies, **When** the death is processed, **Then** there is a 4% chance (configurable in gameConfig.js as `HEAL_GEM_DROP_CHANCE`) that a heal gem drops at the enemy's death position.

2. **Given** a heal gem drops, **When** it spawns, **Then** the gem restores a fixed amount of HP (`HEAL_GEM_RESTORE_AMOUNT = 20` HP, configurable in gameConfig.js).

3. **Given** the heal gem is rendered, **When** it appears on the field, **Then** the gem uses a red-pink color (`#ff3366`) with emissive glow material, has a gentle pulse animation (scale oscillates ±10%, ~2Hz cycle), and uses InstancedMesh for efficient rendering.

4. **Given** the player collects a heal gem, **When** pickup collision is detected via spatial hashing, **Then** `usePlayer.currentHP` increases by `HEAL_GEM_RESTORE_AMOUNT`, capped at `maxHP` (no overhealing), and a distinct sound effect plays (`playSFX('hp-recover')`).

5. **Given** heal gems on the field, **When** the player is within magnetization radius, **Then** heal gems are attracted toward the player using the same magnetization radius (`XP_MAGNET_RADIUS = 15.0`) and speed (`XP_MAGNET_SPEED = 120`) as XP orbs.

6. **Given** heal gems on the field, **When** the player is at full HP, **Then** heal gems remain on the field and can be collected (they still heal, capped at maxHP). Heal gems do NOT despawn on a timer.

7. **Given** the heal gem pool, **When** the pool is full (`MAX_HEAL_GEMS = 30`), **Then** no additional heal gems spawn until existing ones are collected, following the same pattern as XP orb pool management.

## Tasks / Subtasks

- [ ] Task 1: Add heal gem config to gameConfig.js (AC: #1, #2, #7)
  - [ ] Add `HEAL_GEM_DROP_CHANCE: 0.04` to a `LOOT_DROPS` section
  - [ ] Add `HEAL_GEM_RESTORE_AMOUNT: 20`
  - [ ] Add `HEAL_GEM_COLOR: '#ff3366'`
  - [ ] Add `MAX_HEAL_GEMS: 30`
  - [ ] Add `HEAL_GEM_PICKUP_RADIUS: 2.0`

- [ ] Task 2: Create healGemSystem.js (AC: #1, #2, #5, #6, #7)
  - [ ] Pre-allocated pool of 30 heal gems: `{ x, z, healAmount, elapsedTime, isMagnetized }`
  - [ ] `spawnHealGem(x, z, healAmount)` — adds gem to pool, returns false if full
  - [ ] `collectHealGem(index)` — swap-to-end removal, returns healAmount
  - [ ] `updateHealGemMagnetization(playerX, playerZ, delta, pickupRadiusMult)` — same logic as xpOrbSystem
  - [ ] `getHealGems()` / `getActiveHealGemCount()` / `resetHealGems()` exports

- [ ] Task 3: Add CATEGORY_HEAL_GEM to collisionSystem.js (AC: #4)
  - [ ] Export `CATEGORY_HEAL_GEM = 'healGem'`
  - [ ] Add collision pair `player:healGem` to `COLLISION_PAIRS`

- [ ] Task 4: Add healFromGem action to usePlayer.jsx (AC: #4)
  - [ ] `healFromGem(healAmount)` — `Math.min(maxHP, currentHP + healAmount)`, returns actual HP healed

- [ ] Task 5: Integrate heal gems into GameLoop.jsx (AC: #1, #4, #5)
  - [ ] Import healGemSystem functions
  - [ ] In death event processing (section 7c): roll `Math.random() < HEAL_GEM_DROP_CHANCE`, call `spawnHealGem(enemy.x, enemy.z, HEAL_GEM_RESTORE_AMOUNT)`
  - [ ] In magnetization section: call `updateHealGemMagnetization(playerX, playerZ, delta, pickupRadiusMult)`
  - [ ] Register heal gems in spatial hash (section 7d pattern): loop active gems, `cs.registerEntity(...)` with `CATEGORY_HEAL_GEM`
  - [ ] Query heal gem collisions: `cs.queryCollisions(playerEntity, CATEGORY_HEAL_GEM)`
  - [ ] On pickup: `collectHealGem(index)`, `healFromGem(healAmount)`, `playSFX('hp-recover')`
  - [ ] In reset section: call `resetHealGems()`

- [ ] Task 6: Create HealGemRenderer.jsx (AC: #3)
  - [ ] InstancedMesh with SphereGeometry (similar to XPOrbRenderer)
  - [ ] Emissive MeshStandardMaterial: color `#ff3366`, emissiveIntensity 2-3
  - [ ] Pulse animation in useFrame: `scale = 0.9 + 0.1 * Math.sin(elapsed * 4)`
  - [ ] Bobbing Y animation: same pattern as XP orbs
  - [ ] Proper disposal in useEffect cleanup

- [ ] Task 7: Mount HealGemRenderer in GameplayScene.jsx (AC: #3)
  - [ ] Add `<HealGemRenderer />` alongside `<XPOrbRenderer />`

- [ ] Task 8: Write tests for healGemSystem.js (AC: all)
  - [ ] Test spawn adds gem to pool with correct position/healAmount
  - [ ] Test collect returns healAmount and removes from pool (swap-to-end)
  - [ ] Test pool full behavior (no spawn beyond MAX_HEAL_GEMS)
  - [ ] Test magnetization moves gems toward player position
  - [ ] Test reset clears all active gems

## Dev Notes

### Architecture Compliance — 6-Layer Pattern

| Layer | Component | Action |
|-------|-----------|--------|
| Config/Data | `gameConfig.js` | Add `LOOT_DROPS` section with heal gem constants |
| Systems | `healGemSystem.js` (new) | Object pool, spawn, collect, magnetization |
| Systems | `collisionSystem.js` | Add `CATEGORY_HEAL_GEM` + collision pair |
| Stores | `usePlayer.jsx` | Add `healFromGem(amount)` action |
| GameLoop | `GameLoop.jsx` | Drop roll, collision registration, pickup handling |
| Rendering | `HealGemRenderer.jsx` (new) | InstancedMesh rendering with pulse |
| Rendering | `GameplayScene.jsx` | Mount `<HealGemRenderer />` |

### Blueprint: Follow xpOrbSystem.js Pattern Exactly

The heal gem system is a **direct mirror** of `src/systems/xpOrbSystem.js`. Key patterns:

1. **Pre-allocated pool** — Array of N objects, `activeCount` tracker, zero GC
2. **Swap-to-end removal** — `collectHealGem(index)` swaps with last active, decrements count
3. **InstancedMesh rendering** — Single draw call, per-instance transform via `setMatrixAt()`
4. **Spatial hash registration** — Each active gem registered per frame in GameLoop
5. **Magnetization** — Same radius/speed/acceleration curve as XP orbs

### Existing HP Healing Patterns in usePlayer.jsx

- **HP Regen (boons)**: `currentHP = Math.min(currentHP + hpRegenRate * delta, maxHP)` — passive, delta-based
- **HP Sacrifice**: `currentHP = Math.min(maxHP, currentHP + 25)` — instant heal, Fragment cost
- **Heal gem**: Same instant pattern as sacrifice, no cost

### Audio

SFX `'hp-recover'` already exists in `useAudio.jsx` SFX_MAP (mapped to `ASSET_MANIFEST.tier2.audio.hpRecover`). Audio files are placeholder-missing but handled gracefully by audioManager.

### GameLoop Integration Points

Enemy death processing is at **section 7c** in GameLoop.jsx (~line 473-490):
```javascript
// Current pattern:
for (const event of deathEvents) {
  if (event.killed) {
    addExplosion(event.enemy.x, event.enemy.z, event.enemy.color)
    playSFX('explosion')
    spawnOrb(event.enemy.x, event.enemy.z, xpReward)
    // ADD HERE: heal gem drop roll
  }
}
```

XP orb collision detection is at **section 7d** (~line 579-603). Follow exact same pattern for heal gems.

### Performance Budget

- MAX_HEAL_GEMS = 30 (+ MAX_XP_ORBS = 50 = 80 total collectibles, well within 100 budget)
- One additional InstancedMesh draw call (negligible)
- Spatial hash handles additional entities efficiently (cell size = 2)

### Design Decision: No Despawn Timer

Per AC #6, heal gems remain on field indefinitely until collected. This is simpler and more player-friendly than a 15-20 second despawn timer. The pool cap (30) naturally limits accumulation.

### Project Structure Notes

- New files follow naming conventions: `healGemSystem.js` (systems), `HealGemRenderer.jsx` (renderers)
- Test file: `src/systems/__tests__/healGemSystem.test.js`
- Config constants use SCREAMING_SNAKE_CASE
- System functions are pure exports (no class, no store)

### References

- [Source: src/systems/xpOrbSystem.js] — Complete blueprint for pool, spawn, collect, magnetization
- [Source: src/renderers/XPOrbRenderer.jsx] — InstancedMesh rendering pattern with bobbing animation
- [Source: src/systems/collisionSystem.js] — CATEGORY constants and COLLISION_PAIRS whitelist
- [Source: src/stores/usePlayer.jsx] — HP state (currentHP, maxHP), existing heal patterns (regen, sacrifice)
- [Source: src/GameLoop.jsx#section7c] — Enemy death processing, XP orb spawning
- [Source: src/GameLoop.jsx#section7d] — XP orb collision registration and pickup handling
- [Source: src/hooks/useAudio.jsx] — SFX_MAP with 'hp-recover' entry
- [Source: _bmad-output/planning-artifacts/epic-19-enemy-loot-system.md] — Epic context and all stories

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
