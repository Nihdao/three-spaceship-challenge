# Story 19.1: Rare XP Gem Drops

Status: ready-for-dev

## Story

As a player,
I want enemies to occasionally drop rare XP gems worth significantly more experience,
so that I'm rewarded for staying engaged in combat and have exciting "jackpot" moments.

## Acceptance Criteria

1. **Given** an enemy dies, **when** the death is processed, **then** there is a configurable chance (RARE_XP_GEM_DROP_CHANCE in gameConfig.js, default 0.10 = 10%) that a rare XP gem drops instead of a standard XP orb.

2. **Given** a rare XP gem drops, **when** it spawns, **then** the gem is worth 3x the enemy's base xpReward (configurable as RARE_XP_GEM_MULTIPLIER in gameConfig.js). For example, FODDER_BASIC (12 XP) drops a gem worth 36 XP.

3. **Given** the rare XP gem is rendered, **when** XPOrbRenderer displays it, **then** the gem uses a distinct golden-yellow color (#ffdd00) instead of the standard cyan (#00ffcc), is visually larger (e.g., 1.3x scale), and has a subtle pulse animation to distinguish it.

4. **Given** the rare XP gem uses the same InstancedMesh system as standard orbs, **when** rendered, **then** both standard and rare orbs share the same pool and InstancedMesh capacity (MAX_XP_ORBS) for performance, differentiated by per-instance color.

5. **Given** the player collects a rare XP gem, **when** pickup collision is detected, **then** the full 3x XP value is added to usePlayer.currentXP and a distinct SFX plays (xp_rare_pickup, higher pitch or "ding" sound different from standard XP pickup).

6. **Given** rare XP gems and XP magnetization (Story 11.1), **when** the player is within magnetization radius, **then** rare XP gems are also magnetized using the same radius (XP_MAGNET_RADIUS = 15) and speed (XP_MAGNET_SPEED = 120) as standard orbs.

## Tasks / Subtasks

- [ ] Task 1: Add rare XP gem config to gameConfig.js (AC: #1, #2)
  - [ ] Add RARE_XP_GEM_DROP_CHANCE: 0.10
  - [ ] Add RARE_XP_GEM_MULTIPLIER: 3
  - [ ] Add RARE_XP_GEM_COLOR: "#ffdd00"
  - [ ] Add RARE_XP_GEM_SCALE_MULTIPLIER: 1.3
  - [ ] Add RARE_XP_GEM_PULSE_SPEED: 3.0 (pulse animation speed)

- [ ] Task 2: Extend xpOrbSystem.js to support rare orbs (AC: #1, #2, #6)
  - [ ] Add `isRare` boolean field to orb data structure (alongside x, z, xpValue, elapsedTime, isMagnetized)
  - [ ] Update `spawnOrb()` to accept an `isRare` parameter, defaulting to false
  - [ ] Ensure magnetization, collection, and pool recycling work identically for rare and standard orbs
  - [ ] No changes needed to collectOrb() — it already returns xpValue which will be pre-multiplied

- [ ] Task 3: Update GameLoop.jsx enemy death handling to roll for rare drops (AC: #1, #2)
  - [ ] In the death event loop (around line 471-490), before calling spawnOrb():
    - Roll Math.random() < RARE_XP_GEM_DROP_CHANCE
    - If rare: spawnOrb(x, z, xpReward * RARE_XP_GEM_MULTIPLIER, true)
    - If not rare: spawnOrb(x, z, xpReward, false) (existing behavior)
  - [ ] Play different SFX on rare XP gem collection (xp_rare_pickup vs xp_pickup)

- [ ] Task 4: Update XPOrbRenderer.jsx for visual differentiation (AC: #3, #4)
  - [ ] Use per-instance color via `instanceColor` attribute on InstancedMesh
  - [ ] Standard orbs: cyan (#00ffcc), rare orbs: golden (#ffdd00)
  - [ ] Apply scale multiplier for rare orbs (1.3x) when building instance matrix
  - [ ] Add subtle pulse animation for rare orbs (scale oscillation using sin(elapsed * PULSE_SPEED))
  - [ ] Ensure emissive material works with per-instance color (setColorAt or instanceColor buffer)

- [ ] Task 5: Add rare XP pickup SFX entry (AC: #5)
  - [ ] Add 'xp_rare_pickup' to SFX_CATEGORY_MAP in audioManager.js
  - [ ] Add 'xp_rare_pickup' to SFX_MAP in useAudio.jsx for preloading
  - [ ] In GameLoop.jsx XP orb collection section, check isRare flag and play appropriate SFX

- [ ] Task 6: Write/update tests (AC: all)
  - [ ] Test xpOrbSystem: spawnOrb with isRare flag stores correct data
  - [ ] Test xpOrbSystem: collectOrb returns correct xpValue for rare orbs (pre-multiplied)
  - [ ] Test rare drop chance logic: verify roll produces rare orbs at expected rate
  - [ ] Test magnetization works identically for rare and standard orbs

## Dev Notes

### Architecture Alignment

This story extends the existing XP orb system with minimal architectural changes. The 6-layer architecture is preserved:

- **Config Layer** (`gameConfig.js`): New RARE_XP_GEM_* constants
- **Systems Layer** (`xpOrbSystem.js`): Extended orb data structure with `isRare` field
- **GameLoop** (`GameLoop.jsx`): Drop chance roll in enemy death handling
- **Rendering Layer** (`XPOrbRenderer.jsx`): Per-instance color/scale differentiation
- **No new stores needed** — rare orbs use the same XP orb pool

### Key Source Files to Modify

| File | Change | Layer |
|------|--------|-------|
| `src/config/gameConfig.js` | Add RARE_XP_GEM_* constants | Config |
| `src/systems/xpOrbSystem.js` | Add `isRare` to orb data, update spawnOrb signature | Systems |
| `src/GameLoop.jsx` | Roll drop chance on enemy death, pass isRare to spawnOrb | GameLoop |
| `src/renderers/XPOrbRenderer.jsx` | Per-instance color + scale for rare orbs | Rendering |
| `src/audio/audioManager.js` | Add xp_rare_pickup SFX entry | Audio |
| `src/audio/useAudio.jsx` | Add xp_rare_pickup to SFX_MAP | Audio |

### Existing XP Orb System Overview

The XP orb system is pool-based with zero GC pressure:

- **xpOrbSystem.js**: Manages a flat pool of orbs with `{ x, z, xpValue, elapsedTime, isMagnetized }`. Pool capacity: MAX_XP_ORBS (50). Uses swap-to-end removal pattern for O(1) despawn. `updateMagnetization()` moves orbs toward player within XP_MAGNET_RADIUS (15 units) using quadratic ease-in acceleration.

- **XPOrbRenderer.jsx**: InstancedMesh with SphereGeometry(1, 8, 8), MeshStandardMaterial emissive #00ffcc. Updates instance matrices each frame based on active orb count. Bobbing Y animation per orb.

- **GameLoop.jsx death flow** (lines ~471-490): `damageEnemiesBatch()` returns `deathEvents` → for each: spawn explosion, play SFX, read `xpReward` from `ENEMIES[typeId]`, call `spawnOrb(x, z, xpReward)`.

- **Collection** (lines ~579-603): Spatial hash collision `CATEGORY_PLAYER:CATEGORY_XP_ORB`, pickup radius 2.0. `collectOrb()` returns xpValue, `addXP(xpValue * xpMult)` applied with boon multiplier.

### InstancedMesh Per-Instance Color Strategy

Three.js InstancedMesh supports per-instance color via `instanceColor` attribute:
```javascript
mesh.setColorAt(index, color)
mesh.instanceColor.needsUpdate = true
```
The material must NOT have a hardcoded `color` that overrides instance colors. Use `emissive` with per-instance color, or switch to a material that respects `instanceColor`. The current material uses `emissiveIntensity: 2` and `toneMapped: false` — verify that `instanceColor` interacts correctly with emissive, or use the `color` attribute with `emissive` set per-instance.

**Alternative approach**: If per-instance color proves complex with emissive materials, use two separate InstancedMesh instances (one for standard, one for rare) with different materials. This is simpler but uses two draw calls instead of one. Given MAX_XP_ORBS = 50, performance impact is negligible.

### Audio Files Note

All SFX files in `public/audio/sfx/` are placeholder-missing. audioManager.js handles missing files gracefully with `console.warn`. Add the `xp_rare_pickup` entry to both audioManager's SFX_CATEGORY_MAP and useAudio.jsx's SFX_MAP.

### Testing Standards

- Tests use Vitest with `describe/it/expect`
- Store tests use `store.getState()` and `store.setState()` patterns
- **CRITICAL**: Reset all store state between tests to prevent pollution
- xpOrbSystem already has tests in `src/systems/__tests__/xpOrbSystem.test.js` — extend these
- Test files go in `__tests__/` subdirectory next to source file

### Project Structure Notes

- All changes align with existing project structure (no new directories needed)
- `isRare` field extends existing orb data structure without breaking existing code
- GameLoop drop roll is a minimal addition to existing death event loop
- XPOrbRenderer color change is the most technically involved part

### References

- [Source: src/systems/xpOrbSystem.js] — Orb pool, spawnOrb, collectOrb, updateMagnetization
- [Source: src/renderers/XPOrbRenderer.jsx] — InstancedMesh rendering, bobbing animation
- [Source: src/GameLoop.jsx#L471-490] — Enemy death handling, xpReward lookup, spawnOrb call
- [Source: src/GameLoop.jsx#L579-603] — XP orb collision detection and collection
- [Source: src/config/gameConfig.js] — MAX_XP_ORBS, XP_MAGNET_*, XP_ORB_* constants
- [Source: src/stores/usePlayer.jsx#L320-341] — addXP() method with multi-level handling
- [Source: src/entities/enemyDefs.js] — Enemy xpReward values per type
- [Source: _bmad-output/planning-artifacts/epic-19-enemy-loot-system.md] — Epic context
- [Source: _bmad-output/planning-artifacts/architecture.md] — 6-layer architecture, InstancedMesh pattern

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
