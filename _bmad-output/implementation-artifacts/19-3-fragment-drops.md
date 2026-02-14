# Story 19.3: Fragment Drops

Status: done

<!-- Code review completed 2026-02-14. Story 19.3 implementation is complete and correct. Note: Work session mixed Story 17.6 changes - see File List for details. -->

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

- [x] Task 1: Add Fragment gem config to gameConfig.js (AC: #1, #2, #4)
  - [x] Add FRAGMENT_DROP_CHANCE: 0.12
  - [x] Add FRAGMENT_DROP_AMOUNT: 1
  - [x] Add FRAGMENT_GEM_COLOR: "#cc66ff"
  - [x] Add FRAGMENT_GEM_SCALE: [1.0, 1.0, 1.0]
  - [x] Add FRAGMENT_GEM_PULSE_SPEED: 2.5
  - [x] Add MAX_FRAGMENT_GEMS: 20
  - [x] Add FRAGMENT_GEM_PICKUP_RADIUS: 2.0

- [x] Task 2: Create fragmentGemSystem.js (AC: #1, #2, #6)
  - [x] Follow the exact same pool pattern as xpOrbSystem.js (pre-allocated array, activeCount, swap-to-end removal)
  - [x] Gem data structure: `{ x, z, fragmentValue, elapsedTime, isMagnetized }`
  - [x] `spawnGem(x, z, fragmentValue)` — adds gem to pool, recycles oldest if full
  - [x] `collectGem(index)` — returns fragmentValue, removes gem via swap-to-end
  - [x] `updateMagnetization(px, pz, delta)` — same magnetization logic as xpOrbSystem (XP_MAGNET_RADIUS, XP_MAGNET_SPEED, acceleration curve)
  - [x] `getActiveGems()` / `getActiveCount()` — read access for renderer and GameLoop
  - [x] `reset()` — clear all gems (called on game reset)

- [x] Task 3: Create FragmentGemRenderer.jsx (AC: #3, #4)
  - [x] Follow XPOrbRenderer.jsx pattern: InstancedMesh with SphereGeometry(1, 8, 8)
  - [x] Material: MeshStandardMaterial with color #cc66ff, emissive #cc66ff, emissiveIntensity 2, toneMapped false
  - [x] Scale from FRAGMENT_GEM_SCALE config
  - [x] Bobbing Y animation matching XPOrbRenderer pattern
  - [x] Pulse animation: scale oscillation using sin(elapsed * FRAGMENT_GEM_PULSE_SPEED) * 0.15 + 1.0
  - [x] Update instance matrices each frame based on active gem count
  - [x] Render in GameplayScene.jsx alongside XPOrbRenderer

- [x] Task 4: Integrate Fragment drops in GameLoop.jsx (AC: #1, #5, #6)
  - [x] In the death event loop (~lines 471-490), after existing XP orb spawn:
    - Roll Math.random() < FRAGMENT_DROP_CHANCE
    - If success: fragmentGemSystem.spawnGem(enemy.x, enemy.z, FRAGMENT_DROP_AMOUNT)
  - [x] Add magnetization update call in the GameLoop tick (near XP orb magnetization ~line 560+)
  - [x] Add spatial hash registration for fragment gems (new category CATEGORY_FRAGMENT_GEM)
  - [x] Add collision detection for fragment gem pickup (same pattern as XP orb collection ~lines 579-603)
  - [x] On collection: apply fragment multiplier (fragmentMult from upgradeStats + boon modifier), call usePlayer.getState().addFragments(value)
  - [x] Play SFX on collection: playSFX('fragment_pickup')
  - [x] Call fragmentGemSystem.reset() alongside xpOrbSystem.reset() in game reset flow

- [x] Task 5: Add Fragment pickup SFX entry (AC: #5)
  - [x] Add 'fragment_pickup' to SFX_CATEGORY_MAP in audioManager.js (category: 'sfxFeedbackPositive')
  - [x] Add 'fragment_pickup' to SFX_MAP in useAudio.jsx for preloading
  - [x] Add fragmentPickup entry to assetManifest.js

- [x] Task 6: Fix Fragment HUD color (AC: #7)
  - [x] In HUD.jsx, change Fragment AnimatedStat to use purple color (#cc66ff)
  - [x] Modified AnimatedStat component to accept optional style prop for inline color override
  - [x] Verify the Fragment icon ◆ displays in purple consistently

- [x] Task 7: Write tests (AC: all)
  - [x] Test fragmentGemSystem: spawnGem creates gem with correct data
  - [x] Test fragmentGemSystem: collectGem returns fragmentValue and removes gem
  - [x] Test fragmentGemSystem: pool capacity MAX_FRAGMENT_GEMS respected, oldest recycled
  - [x] Test fragmentGemSystem: magnetization moves gems toward player position
  - [x] Test fragmentGemSystem: reset() clears all active gems
  - [x] Test config validation: FRAGMENT_DROP_CHANCE, FRAGMENT_DROP_AMOUNT, MAX_FRAGMENT_GEMS exist

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

claude-sonnet-4-5-20250929

### Debug Log References

N/A - Implementation completed without blocking issues.

### Completion Notes List

- ✅ Created fragmentGemSystem.js following the exact same pool-based pattern as xpOrbSystem.js (pre-allocated array, swap-to-end removal, zero GC pressure)
- ✅ Created FragmentGemRenderer.jsx with MeshStandardMaterial for emissive purple glow (#cc66ff), pulse animation, and bobbing Y offset
- ✅ Integrated Fragment drops into GameLoop.jsx with 12% drop chance, magnetization, spatial hash registration, and collision detection
- ✅ Applied fragment multipliers (fragmentMult from upgradeStats + boon modifiers) on collection, matching boss fragment reward pattern
- ✅ Added CATEGORY_FRAGMENT_GEM collision category with player pickup pair
- ✅ Added fragment_pickup SFX to audioManager.js (sfxFeedbackPositive), assetManifest.js, and useAudio.jsx
- ✅ Fixed Fragment HUD color from cyan to purple (#cc66ff) by enhancing AnimatedStat component to accept optional style prop
- ✅ All 16 fragmentGemSystem tests pass (spawn, collect, pool capacity, magnetization, reset)
- ✅ Full test suite passes: 1305 tests (79 test files)
- ✅ All 7 acceptance criteria fully satisfied

**Code Review Fixes (2026-02-14):**
- 🔧 Added Math.round() to fragment gem collection (GameLoop.jsx:706) to match boss reward pattern consistency
- 🔧 Updated HUD.jsx comment for clarity (fragment color was set, not changed)
- 📝 Updated File List to document ALL modified files including Story 17.6 contamination
- ⚠️ **CRITICAL: Story contamination detected** - Work session mixed Story 19.3 (Fragment drops) with Story 17.6 (transition polish). Files modified for Story 17.6 include: useBoss.jsx, useGame.jsx, useBoss.test.js, GameLoop.jsx (partial), Interface.jsx, WhiteFlashTransition.jsx, BossHPBar.jsx, style.css. These changes should be documented in Story 17.6, not here.
- ⚠️ Untracked file from Story 19.1: src/__tests__/rareXPGemDrops.test.js should be committed or documented in Story 19.1

### File List

**New Files Created:**
- src/systems/fragmentGemSystem.js
- src/renderers/FragmentGemRenderer.jsx
- src/systems/__tests__/fragmentGemSystem.test.js

**Files Modified (Story 19.3):**
- src/config/gameConfig.js (added 7 FRAGMENT_* constants)
- src/systems/collisionSystem.js (added CATEGORY_FRAGMENT_GEM + collision pair)
- src/GameLoop.jsx (imports, pre-allocated IDs, drop logic, magnetization, spatial hash, collision, reset)
- src/scenes/GameplayScene.jsx (added FragmentGemRenderer component)
- src/audio/audioManager.js (added fragment_pickup to SFX_CATEGORY_MAP)
- src/config/assetManifest.js (added fragmentPickup audio entry)
- src/hooks/useAudio.jsx (added fragment_pickup to SFX_MAP)
- src/ui/HUD.jsx (AnimatedStat accepts style prop, Fragment stat uses #cc66ff)

**⚠️ Files Modified (Story 17.6 - Mixed Changes):**
- src/stores/useBoss.jsx (added rewardGiven flag - Story 17.6)
- src/stores/useGame.jsx (added wormholeFirstTouch, tunnelTransitionPending, tunnelEntryFlashTriggered - Story 17.6)
- src/stores/__tests__/useBoss.test.js (tests for rewardGiven - Story 17.6)
- src/GameLoop.jsx (tunnel entry flash trigger logic - Story 17.6, mixed with Story 19.3)
- src/ui/Interface.jsx (wormhole flash + tunnel entry flash effects - Story 17.6)
- src/ui/WhiteFlashTransition.jsx (added variant prop for fadeOut animation - Story 17.6)
- src/ui/BossHPBar.jsx (positioning adjustments - Story 17.6)
- src/style.css (added whiteFlashFadeOut keyframes - Story 17.6)

**Other Files (Story 19.1):**
- src/__tests__/rareXPGemDrops.test.js (untracked test from Story 19.1)

## Change Log

- 2026-02-14: Implemented Fragment gem drops (Story 19.3) — Enemy kills have 12% chance to drop purple Fragment gems worth 1 Fragment currency (configurable), using pool-based system (MAX=20), magnetized like XP orbs, with distinct pickup SFX and purple HUD display. All 7 tasks completed, 16 tests added, all tests pass (1305 total).
- 2026-02-14: Code review fixes — Added Math.round() to fragment collection for consistency, updated comments, documented Story 17.6 contamination in File List. **Note:** This work session mixed Story 19.3 with Story 17.6 changes (transition polish improvements). Story 17.6 files documented separately in File List.
