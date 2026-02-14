# Story 19.3: Fragment Drops

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want enemies to sometimes drop Fragment gems (purple) that I can spend on permanent upgrades in the tunnel,
so that I earn tunnel currency through combat and have more agency over my progression.

## Acceptance Criteria

1. **Given** an enemy dies, **when** the death is processed, **then** there is a configurable chance (FRAGMENT_DROP_CHANCE in gameConfig.js, default 0.12 = 12%) that a Fragment gem drops.

2. **Given** a Fragment gem drops, **when** it spawns, **then** the gem is worth a configurable amount of Fragments (FRAGMENT_DROP_AMOUNT in gameConfig.js, default 1). The value can scale with enemy type or system level in future stories.

3. **Given** the Fragment gem is rendered, **when** it appears on the field, **then** the gem uses a distinct purple color (#cc66ff), is visually distinguishable from XP orbs (cyan) and rare XP gems (gold), and has a subtle pulse/sparkle animation.

4. **Given** Fragment gems use the same pool-based system pattern as XP orbs, **when** rendered, **then** they use a separate InstancedMesh with their own pool (MAX_FRAGMENT_GEMS in gameConfig.js, default 20) for performance.

5. **Given** the player collects a Fragment gem, **when** pickup collision is detected, **then** usePlayer.fragments increases by the gem's Fragment value (applying fragmentMult from upgradeStats and boon modifiers), and a distinct SFX plays (fragment_pickup, crystalline chime sound).

6. **Given** Fragment gem magnetization, **when** the player is within magnetization radius, **then** Fragment gems are attracted toward the player using the same XP_MAGNET_RADIUS (15) and XP_MAGNET_SPEED (120) as XP orbs.

7. **Given** the HUD displays Fragments, **when** the player collects a Fragment gem, **then** the Fragment count in the top stats display updates immediately. **And** the Fragment icon color in the HUD is purple (#cc66ff), not cyan.

## Tasks / Subtasks

- [ ] Task 1: Add Fragment gem config to gameConfig.js (AC: #1, #2, #4)
  - [ ] Add FRAGMENT_DROP_CHANCE: 0.12
  - [ ] Add FRAGMENT_DROP_AMOUNT: 1
  - [ ] Add FRAGMENT_GEM_COLOR: "#cc66ff"
  - [ ] Add FRAGMENT_GEM_SCALE: [1.0, 1.0, 1.0]
  - [ ] Add FRAGMENT_GEM_PULSE_SPEED: 2.5
  - [ ] Add MAX_FRAGMENT_GEMS: 20
  - [ ] Add FRAGMENT_GEM_PICKUP_RADIUS: 2.0

- [ ] Task 2: Create fragmentGemSystem.js (AC: #1, #2, #6)
  - [ ] Follow the exact same pool pattern as xpOrbSystem.js (pre-allocated array, activeCount, swap-to-end removal)
  - [ ] Gem data structure: `{ x, z, fragmentValue, elapsedTime, isMagnetized }`
  - [ ] `spawnGem(x, z, fragmentValue)` — adds gem to pool, recycles oldest if full
  - [ ] `collectGem(index)` — returns fragmentValue, removes gem via swap-to-end
  - [ ] `updateMagnetization(px, pz, delta)` — same magnetization logic as xpOrbSystem (XP_MAGNET_RADIUS, XP_MAGNET_SPEED, acceleration curve)
  - [ ] `getActiveGems()` / `getActiveCount()` — read access for renderer and GameLoop
  - [ ] `reset()` — clear all gems (called on game reset)

- [ ] Task 3: Create FragmentGemRenderer.jsx (AC: #3, #4)
  - [ ] Follow XPOrbRenderer.jsx pattern: InstancedMesh with SphereGeometry(1, 8, 8)
  - [ ] Material: MeshStandardMaterial with color #cc66ff, emissive #cc66ff, emissiveIntensity 2, toneMapped false
  - [ ] Scale from FRAGMENT_GEM_SCALE config
  - [ ] Bobbing Y animation matching XPOrbRenderer pattern
  - [ ] Pulse animation: scale oscillation using sin(elapsed * FRAGMENT_GEM_PULSE_SPEED) * 0.15 + 1.0
  - [ ] Update instance matrices each frame based on active gem count
  - [ ] Render in GameplayScene.jsx alongside XPOrbRenderer

- [ ] Task 4: Integrate Fragment drops in GameLoop.jsx (AC: #1, #5, #6)
  - [ ] In the death event loop (~lines 471-490), after existing XP orb spawn:
    - Roll Math.random() < FRAGMENT_DROP_CHANCE
    - If success: fragmentGemSystem.spawnGem(enemy.x, enemy.z, FRAGMENT_DROP_AMOUNT)
  - [ ] Add magnetization update call in the GameLoop tick (near XP orb magnetization ~line 560+)
  - [ ] Add spatial hash registration for fragment gems (new category CATEGORY_FRAGMENT_GEM)
  - [ ] Add collision detection for fragment gem pickup (same pattern as XP orb collection ~lines 579-603)
  - [ ] On collection: apply fragment multiplier (fragmentMult from upgradeStats + boon modifier), call usePlayer.getState().addFragments(value)
  - [ ] Play SFX on collection: playSFX('fragment_pickup')
  - [ ] Call fragmentGemSystem.reset() alongside xpOrbSystem.reset() in game reset flow

- [ ] Task 5: Add Fragment pickup SFX entry (AC: #5)
  - [ ] Add 'fragment_pickup' to SFX_CATEGORY_MAP in audioManager.js (category: 'sfxFeedbackPositive')
  - [ ] Add 'fragment_pickup' to SFX_MAP in useAudio.jsx for preloading

- [ ] Task 6: Fix Fragment HUD color (AC: #7)
  - [ ] In Interface.jsx, change Fragment AnimatedStat colorClass from "text-cyan-400" to inline style or custom class using #cc66ff
  - [ ] Verify the Fragment icon ◆ displays in purple consistently

- [ ] Task 7: Write tests (AC: all)
  - [ ] Test fragmentGemSystem: spawnGem creates gem with correct data
  - [ ] Test fragmentGemSystem: collectGem returns fragmentValue and removes gem
  - [ ] Test fragmentGemSystem: pool capacity MAX_FRAGMENT_GEMS respected, oldest recycled
  - [ ] Test fragmentGemSystem: magnetization moves gems toward player position
  - [ ] Test fragmentGemSystem: reset() clears all active gems
  - [ ] Test drop chance logic: verify roll produces fragment gems at expected rate

## Dev Notes

### Architecture Alignment

This story creates a new parallel system for Fragment gems, following the same proven pattern as xpOrbSystem.js. The 6-layer architecture is preserved:

- **Config Layer** (`gameConfig.js`): New FRAGMENT_* constants
- **Systems Layer** (`fragmentGemSystem.js`): New pool-based gem management (mirrors xpOrbSystem.js)
- **GameLoop** (`GameLoop.jsx`): Drop chance roll in enemy death handling + collection logic
- **Rendering Layer** (`FragmentGemRenderer.jsx`): Separate InstancedMesh for fragment gems
- **Stores Layer** (`usePlayer.jsx`): Existing `addFragments()` action — no changes needed
- **UI Layer** (`Interface.jsx`): Fix Fragment icon color to purple

### Key Source Files to Modify

| File | Change | Layer |
|------|--------|-------|
| `src/config/gameConfig.js` | Add FRAGMENT_DROP_*, FRAGMENT_GEM_*, MAX_FRAGMENT_GEMS constants | Config |
| `src/systems/fragmentGemSystem.js` | **NEW** — Pool-based fragment gem management (mirror xpOrbSystem.js) | Systems |
| `src/renderers/FragmentGemRenderer.jsx` | **NEW** — InstancedMesh rendering for fragment gems | Rendering |
| `src/GameLoop.jsx` | Drop roll on enemy death, magnetization, spatial hash, collection | GameLoop |
| `src/scenes/GameplayScene.jsx` | Add FragmentGemRenderer component | Rendering |
| `src/audio/audioManager.js` | Add fragment_pickup SFX entry | Audio |
| `src/audio/useAudio.jsx` | Add fragment_pickup to SFX_MAP | Audio |
| `src/ui/Interface.jsx` | Fix Fragment icon color from cyan to purple (#cc66ff) | UI |

### Why a Separate System (Not Extending xpOrbSystem)

Fragment gems are a fundamentally different collectible type:
- They add to `usePlayer.fragments` (not XP)
- They apply `fragmentMult` modifier (not `xpMultiplier`)
- They have different visual properties (purple, not cyan)
- They have their own pool capacity (20 vs 50 for XP orbs)
- Mixing them into xpOrbSystem would add complexity and coupling

A separate `fragmentGemSystem.js` keeps each system simple and focused. The code is nearly identical to xpOrbSystem.js — copy the pattern, change the data fields.

### Existing Fragment Infrastructure

The fragment economy already exists in the codebase:
- **usePlayer.fragments** (line 46): Fragment counter, initialized to 0
- **usePlayer.addFragments(amount)** (lines 232-234): Increments fragments by rounded amount
- **upgradeStats.fragmentMult** (DEFAULT_UPGRADE_STATS): Multiplier from tunnel upgrades
- **useBoons modifiers.fragmentMultiplier**: Boon-based multiplier
- **Boss reward** (GameLoop ~line 139): `BOSS_FRAGMENT_REWARD = 100` with both multipliers applied
- **resetForNewSystem()**: Preserves fragments across system transitions
- **reset()**: Clears fragments to 0 for new game

### XP Orb System Pattern to Mirror

The xpOrbSystem.js pattern (to copy for fragmentGemSystem.js):
- Pre-allocated flat array with `MAX_FRAGMENT_GEMS` capacity
- `activeCount` tracks live gems
- Swap-to-end O(1) removal on collection
- Oldest gem recycled when pool is full
- Magnetization: quadratic ease-in acceleration toward player within `XP_MAGNET_RADIUS`
- No GC pressure — zero allocations during gameplay

### Spatial Hash Integration

Fragment gems need a new collision category:
- Register in spatial hash with `CATEGORY_FRAGMENT_GEM` (new constant)
- Check collisions with `CATEGORY_PLAYER:CATEGORY_FRAGMENT_GEM`
- Same pickup radius pattern as XP orbs (FRAGMENT_GEM_PICKUP_RADIUS = 2.0)
- Spatial hash categories are defined in the collision system — add the new category there

### Fragment Multiplier Application

When a Fragment gem is collected, apply both multipliers (same pattern as boss Fragment reward in GameLoop ~line 139):
```
const fragMult = (useBoons.getState().modifiers.fragmentMultiplier ?? 1.0) * usePlayer.getState().upgradeStats.fragmentMult
usePlayer.getState().addFragments(Math.round(fragmentValue * fragMult))
```

### HUD Color Fix

In `src/ui/Interface.jsx` line 352, the Fragment AnimatedStat uses `colorClass="text-cyan-400"`. This should be changed to purple (#cc66ff) to match the Fragment gem visual and the epic design spec. Use an inline style `style={{ color: '#cc66ff' }}` or a custom Tailwind class.

### Audio Files Note

All SFX files in `public/audio/sfx/` are placeholder-missing. audioManager.js handles missing files gracefully with `console.warn`. Add the `fragment_pickup` entry to both audioManager's SFX_CATEGORY_MAP and useAudio.jsx's SFX_MAP.

### Testing Standards

- Tests use Vitest with `describe/it/expect`
- Store tests use `store.getState()` and `store.setState()` patterns
- **CRITICAL**: Reset all system state between tests to prevent pollution
- New test file: `src/systems/__tests__/fragmentGemSystem.test.js`
- Mirror test structure from `src/systems/__tests__/xpOrbSystem.test.js`

### Performance Notes

- MAX_FRAGMENT_GEMS = 20 is sufficient (12% drop rate, enemies die in batches, gems get collected)
- Separate InstancedMesh is one additional draw call — negligible impact
- Pool-based system ensures zero GC pressure
- Total collectible budget: 50 XP orbs + 20 fragment gems = 70 instances (well within budget)

### Project Structure Notes

- New files follow existing directory structure (systems/, renderers/, __tests__/)
- No new directories needed
- Fragment gem system is self-contained with minimal integration points

### References

- [Source: src/systems/xpOrbSystem.js] — Pool pattern to mirror for fragmentGemSystem
- [Source: src/renderers/XPOrbRenderer.jsx] — InstancedMesh rendering pattern to mirror
- [Source: src/GameLoop.jsx#L471-490] — Enemy death handling, drop roll location
- [Source: src/GameLoop.jsx#L579-603] — XP orb collection pattern to replicate for fragments
- [Source: src/GameLoop.jsx#L139-140] — Boss fragment reward with multiplier pattern
- [Source: src/stores/usePlayer.jsx#L46] — fragments state field
- [Source: src/stores/usePlayer.jsx#L232-234] — addFragments() action
- [Source: src/config/gameConfig.js#L24-30] — XP orb/magnet config constants
- [Source: src/ui/Interface.jsx#L352] — Fragment HUD display (color fix needed)
- [Source: src/audio/audioManager.js] — SFX_CATEGORY_MAP for new entry
- [Source: src/audio/useAudio.jsx] — SFX_MAP for preloading
- [Source: _bmad-output/planning-artifacts/epic-19-enemy-loot-system.md] — Epic context
- [Source: _bmad-output/implementation-artifacts/19-1-rare-xp-gem-drops.md] — Sister story pattern

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
