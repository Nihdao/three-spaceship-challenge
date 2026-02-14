# Story 19.2: Heal Gem Drops

Status: review

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

- [x] Task 1: Add heal gem config to gameConfig.js (AC: #1, #2, #7)
  - [x] Add `HEAL_GEM_DROP_CHANCE: 0.04` to a `LOOT_DROPS` section
  - [x] Add `HEAL_GEM_RESTORE_AMOUNT: 20`
  - [x] Add `HEAL_GEM_COLOR: '#ff3366'`
  - [x] Add `MAX_HEAL_GEMS: 30`
  - [x] Add `HEAL_GEM_PICKUP_RADIUS: 2.0`

- [x] Task 2: Create healGemSystem.js (AC: #1, #2, #5, #6, #7)
  - [x] Pre-allocated pool of 30 heal gems: `{ x, z, healAmount, elapsedTime, isMagnetized }`
  - [x] `spawnHealGem(x, z, healAmount)` — adds gem to pool, returns false if full
  - [x] `collectHealGem(index)` — swap-to-end removal, returns healAmount
  - [x] `updateHealGemMagnetization(playerX, playerZ, delta, pickupRadiusMult)` — same logic as xpOrbSystem
  - [x] `getHealGems()` / `getActiveHealGemCount()` / `resetHealGems()` exports

- [x] Task 3: Add CATEGORY_HEAL_GEM to collisionSystem.js (AC: #4)
  - [x] Export `CATEGORY_HEAL_GEM = 'healGem'`
  - [x] Add collision pair `player:healGem` to `COLLISION_PAIRS`

- [x] Task 4: Add healFromGem action to usePlayer.jsx (AC: #4)
  - [x] `healFromGem(healAmount)` — `Math.min(maxHP, currentHP + healAmount)`, returns actual HP healed

- [x] Task 5: Integrate heal gems into GameLoop.jsx (AC: #1, #4, #5)
  - [x] Import healGemSystem functions
  - [x] In death event processing (section 7c): roll `Math.random() < HEAL_GEM_DROP_CHANCE`, call `spawnHealGem(enemy.x, enemy.z, HEAL_GEM_RESTORE_AMOUNT)`
  - [x] In magnetization section: call `updateHealGemMagnetization(playerX, playerZ, delta, pickupRadiusMult)`
  - [x] Register heal gems in spatial hash (section 7d pattern): loop active gems, `cs.registerEntity(...)` with `CATEGORY_HEAL_GEM`
  - [x] Query heal gem collisions: `cs.queryCollisions(playerEntity, CATEGORY_HEAL_GEM)`
  - [x] On pickup: `collectHealGem(index)`, `healFromGem(healAmount)`, `playSFX('hp-recover')`
  - [x] In reset section: call `resetHealGems()`

- [x] Task 6: Create HealGemRenderer.jsx (AC: #3)
  - [x] InstancedMesh with SphereGeometry (similar to XPOrbRenderer)
  - [x] MeshBasicMaterial with toneMapped: false for bright glow effect
  - [x] Pulse animation in useFrame: `scale = 0.9 + 0.1 * Math.sin(elapsed * 4)`
  - [x] Bobbing Y animation: same pattern as XP orbs
  - [x] Proper disposal in useEffect cleanup

- [x] Task 7: Mount HealGemRenderer in GameplayScene.jsx (AC: #3)
  - [x] Add `<HealGemRenderer />` alongside `<XPOrbRenderer />`

- [x] Task 8: Write tests for healGemSystem.js (AC: all)
  - [x] Test spawn adds gem to pool with correct position/healAmount
  - [x] Test collect returns healAmount and removes from pool (swap-to-end)
  - [x] Test pool full behavior (no spawn beyond MAX_HEAL_GEMS)
  - [x] Test magnetization moves gems toward player position
  - [x] Test reset clears all active gems

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
claude-sonnet-4-5-20250929

### Debug Log References
None

### Completion Notes List
- ✅ Heal gem system implemented following exact xpOrbSystem.js blueprint
- ✅ All 8 tasks completed with 13 comprehensive tests written (all passing)
- ✅ 4% drop chance on enemy death (configurable via HEAL_GEM_DROP_CHANCE)
- ✅ Heals 20 HP per gem (configurable via HEAL_GEM_RESTORE_AMOUNT)
- ✅ Red-pink color (#ff3366) with pulse animation (±10%, ~2Hz)
- ✅ Uses same magnetization system as XP orbs (15.0 radius, 120 speed)
- ✅ Pre-allocated pool of 30 gems (zero GC pressure)
- ✅ Spatial hash collision detection with CATEGORY_HEAL_GEM
- ✅ MeshBasicMaterial with toneMapped: false for proper glow effect
- ✅ Full reset integration in both system transition and game restart flows
- ✅ 'hp-recover' SFX plays on pickup (audio file placeholder-missing, handled gracefully)
- ✅ No despawn timer — gems remain on field until collected (pool cap naturally limits accumulation)
- ✅ All acceptance criteria validated

### Code Review Fixes Applied (2026-02-14)
- 🔧 Fixed pulse animation frequency: Changed from `elapsed * 4` (0.64Hz) to `elapsed * Math.PI * 4` (2Hz) to match AC#3 specification
- 📝 Git history note: gameConfig.js, GameLoop.jsx, GameplayScene.jsx were modified for this story but committed under Story 17.4 (commit 713e031) during development. New files (healGemSystem.js, HealGemRenderer.jsx, tests) committed separately under Story 19.2.
- ✅ All new files properly staged and committed
- ✅ All tests passing (13/13)

### File List
- src/config/gameConfig.js
- src/systems/healGemSystem.js (new)
- src/systems/__tests__/healGemSystem.test.js (new)
- src/systems/collisionSystem.js
- src/stores/usePlayer.jsx
- src/GameLoop.jsx
- src/renderers/HealGemRenderer.jsx (new)
- src/scenes/GameplayScene.jsx
