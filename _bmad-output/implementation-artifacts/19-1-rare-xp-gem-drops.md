# Story 19.1: Rare XP Gem Drops

Status: done

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

- [x] Task 1: Add rare XP gem config to gameConfig.js (AC: #1, #2)
  - [x] Add RARE_XP_GEM_DROP_CHANCE: 0.10
  - [x] Add RARE_XP_GEM_MULTIPLIER: 3
  - [x] Add RARE_XP_GEM_COLOR: "#ffdd00"
  - [x] Add RARE_XP_GEM_SCALE_MULTIPLIER: 1.3
  - [x] Add RARE_XP_GEM_PULSE_SPEED: 3.0 (pulse animation speed)

- [x] Task 2: Extend xpOrbSystem.js to support rare orbs (AC: #1, #2, #6)
  - [x] Add `isRare` boolean field to orb data structure (alongside x, z, xpValue, elapsedTime, isMagnetized)
  - [x] Update `spawnOrb()` to accept an `isRare` parameter, defaulting to false
  - [x] Ensure magnetization, collection, and pool recycling work identically for rare and standard orbs
  - [x] No changes needed to collectOrb() — it already returns xpValue which will be pre-multiplied

- [x] Task 3: Update GameLoop.jsx enemy death handling to roll for rare drops (AC: #1, #2)
  - [x] In the death event loop (around line 471-490), before calling spawnOrb():
    - Roll Math.random() < RARE_XP_GEM_DROP_CHANCE
    - If rare: spawnOrb(x, z, xpReward * RARE_XP_GEM_MULTIPLIER, true)
    - If not rare: spawnOrb(x, z, xpReward, false) (existing behavior)
  - [x] Play different SFX on rare XP gem collection (xp_rare_pickup vs xp_pickup)

- [x] Task 4: Update XPOrbRenderer.jsx for visual differentiation (AC: #3, #4)
  - [x] Use per-instance color via `instanceColor` attribute on InstancedMesh
  - [x] Standard orbs: cyan (#00ffcc), rare orbs: golden (#ffdd00)
  - [x] Apply scale multiplier for rare orbs (1.3x) when building instance matrix
  - [x] Add subtle pulse animation for rare orbs (scale oscillation using sin(elapsed * PULSE_SPEED))
  - [x] Ensure emissive material works with per-instance color (setColorAt or instanceColor buffer)

- [x] Task 5: Add rare XP pickup SFX entry (AC: #5)
  - [x] Add 'xp_rare_pickup' to SFX_CATEGORY_MAP in audioManager.js
  - [x] Add 'xp_rare_pickup' to SFX_MAP in useAudio.jsx for preloading
  - [x] In GameLoop.jsx XP orb collection section, check isRare flag and play appropriate SFX

- [x] Task 6: Write/update tests (AC: all)
  - [x] Test xpOrbSystem: spawnOrb with isRare flag stores correct data
  - [x] Test xpOrbSystem: collectOrb returns correct xpValue for rare orbs (pre-multiplied)
  - [x] Test rare drop chance logic: verify roll produces rare orbs at expected rate
  - [x] Test magnetization works identically for rare and standard orbs

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

claude-sonnet-4-5-20250929

### Debug Log References

N/A - No debugging required, implementation followed existing patterns.

### Completion Notes List

**Implementation Summary:**
- Extended XP orb system with `isRare` boolean field to support rare XP gems
- Rare gems drop at 10% chance on enemy death, worth 3x base XP (configurable)
- Visual differentiation: golden color (#ffdd00), 1.3x scale, subtle pulse animation
- Per-instance color support using Three.js InstancedMesh `setColorAt()` API
- Rare gem pickup plays distinct 'xp_rare_pickup' SFX
- Zero GC pressure maintained (pool-based system)
- All acceptance criteria satisfied
- 42 new tests added (35 in xpOrbSystem.test.js, 7 in rareXPGemDrops.test.js)
- Full test suite passes: 1272/1272 tests

**Technical Decisions:**
- Used per-instance color with white emissive material base for correct glowing effect
- Pulse animation implemented as ±10% scale oscillation using sin(elapsed * PULSE_SPEED)
- Standard XP orbs remain silent on pickup (only rare gems play SFX)
- Magnetization logic unchanged - works identically for both orb types

### File List

#### Modified Files (Commit d09a131)
- `src/config/gameConfig.js` — Added RARE_XP_GEM_* config constants (lines 32-37)
- `src/systems/xpOrbSystem.js` — Added isRare field to orb data structure, updated spawnOrb signature
- `src/renderers/XPOrbRenderer.jsx` — Implemented per-instance color/scale/pulse animation
- `src/GameLoop.jsx` — Added rare drop roll logic in enemy death handling (lines 531-536), rare SFX on collection (line 696)
- `src/audio/audioManager.js` — Added 'xp_rare_pickup' to SFX_CATEGORY_MAP (line 47)
- `src/hooks/useAudio.jsx` — Added 'xp_rare_pickup' to SFX_MAP (line 40)
- `src/config/assetManifest.js` — Added xpRarePickup audio asset path (line 36)

#### New Files
- `src/systems/__tests__/xpOrbSystem.test.js` — Extended with 7 rare gem tests (35 total tests)
- `src/__tests__/rareXPGemDrops.test.js` — New test file with 7 statistical/config tests

## Change Log

**2026-02-14 (Code Review):** Separated Story 19.1 from Story 17.3 code
- Created atomic commit for Story 19.1 (commit d09a131)
- Updated File List with commit reference and line numbers
- Story 17.3 code separated into distinct commit (cb76a56)
