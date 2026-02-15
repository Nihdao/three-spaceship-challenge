# Story 26.4: Complete SFX Placeholder Mapping

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want all game actions to have corresponding sound effects,
So that the game feels polished and responsive.

## Acceptance Criteria

**Given** all existing placeholder .wav files in public/audio/sfx/
**When** mapped to game events
**Then** the following sounds are correctly integrated:
  - UI-Message.wav → (currently unmapped, reserve for future UI notifications)
  - beam-fire.wav → already mapped (Story 11.3)
  - boss-defeat.wav → already mapped
  - boss_phase.wav → already mapped (note: boss-phase vs boss_phase naming)
  - button-click.wav → already mapped
  - button-hover.wav → already mapped
  - damage-taken.wav → already mapped
  - dash-ready.wav → already mapped
  - dash-whoosh.wav → already mapped
  - dilemma-accept.wav → already mapped
  - dilemma-refuse.wav → already mapped
  - drone-fire.wav → already mapped (Story 11.3)
  - explosion.wav → already mapped
  - explosive-fire.wav → already mapped (Story 11.3)
  - fragment-pickup.wav → already mapped (Story 19.3)
  - game-over-impact.wav → already mapped
  - laser-fire.wav → already mapped
  - railgun-fire.wav → already mapped (Story 11.3)
  - satellite-fire.wav → already mapped (Story 11.3)
  - scan-complete.wav → already mapped
  - scan-start.wav → remapped to loop system (Story 26.3)
  - shotgun-fire.wav → already mapped (Story 11.3)
  - trishot-fire.wav → already mapped (Story 11.3)
  - tunnel_exit.wav → already mapped
  - upgrade-purchase.wav → already mapped
  - wormhole-activate.wav → already mapped
  - wormhole-spawn.wav → already mapped
  - xp-rare-pickup.wav → already mapped (Story 19.1)

**And** all file extensions are verified in ASSET_MANIFEST (.wav vs .mp3)

**Given** the current ASSET_MANIFEST
**When** reviewed for correctness
**Then** all SFX entries point to .wav files (not .mp3)
**And** paths match actual file locations in public/audio/sfx/

## Tasks / Subtasks

- [x] Update all SFX file extensions from .mp3 to .wav in assetManifest.js (AC: 1, 2)
  - [x] Update gameplay.audio section (lines 23-46): change ALL .mp3 extensions to .wav
  - [x] Update tier2.audio section (lines 62-72): change ALL .mp3 extensions to .wav
  - [x] Preserve music file extensions (.mp3 for music files - don't change those!)
- [x] Fix filename inconsistencies for actual file matches (AC: 2)
  - [x] Line 66: `bossPhase: 'audio/sfx/boss-phase.mp3'` → change to `'audio/sfx/boss_phase.wav'` (underscore not dash)
  - [x] Line 71: `tunnelExit: 'audio/sfx/tunnel-exit.mp3'` → change to `'audio/sfx/tunnel_exit.wav'` (underscore not dash)
- [x] Add UI-Message.wav to manifest for future use (AC: 1)
  - [x] Add new entry in gameplay.audio section: `uiMessage: 'audio/sfx/UI-Message.wav'`
  - [x] Do NOT add to SFX_MAP in useAudio.jsx yet (reserved for future)
  - [x] Do NOT add to SFX_CATEGORY_MAP in audioManager.js yet (reserved for future)
- [x] Verify graceful audio error handling (AC: existing functionality)
  - [x] Confirm audioManager.js already has onloaderror callback in preloadSounds() (line 150-152)
  - [x] No code changes needed — document current behavior in completion notes

## Dev Notes

### CRITICAL BUG DISCOVERED: All SFX Extensions are Wrong!

**Current State Analysis (2026-02-15):**

Actual files in `public/audio/sfx/`:
```bash
$ ls -1 public/audio/sfx/*.wav
UI-Message.wav
beam-fire.wav
boss-defeat.wav
boss_phase.wav       ← UNDERSCORE (not dash!)
button-click.wav
button-hover.wav
damage-taken.wav
dash-ready.wav
dash-whoosh.wav
dilemma-accept.wav
dilemma-refuse.wav
drone-fire.wav
explosion.wav
explosive-fire.wav
fragment-pickup.wav
game-over-impact.wav
laser-fire.wav
railgun-fire.wav
satellite-fire.wav
scan-complete.wav
scan-start.wav
shotgun-fire.wav
trishot-fire.wav
tunnel_exit.wav      ← UNDERSCORE (not dash!)
upgrade-purchase.wav
wormhole-activate.wav
wormhole-spawn.wav
xp-rare-pickup.wav
```

**CRITICAL:** ALL SFX files are `.wav` (not `.mp3`), but `assetManifest.js` references ALL SFX with `.mp3` extensions!

**Why hasn't this crashed the game?**
- Howler.js graceful error handling via `onloaderror` callback (audioManager.js line 150-152)
- All SFX loading failures are silently logged as warnings, not crashes
- Game continues without sound for failed loads

**Impact:**
- Currently, ALL SFX are failing to load but game doesn't crash
- Players are playing with NO sound effects at all (music still works because music files are correctly referenced as .mp3)
- This is a SILENT BUG that's been present since Story 11.3 (weapon SFX)

### Implementation Strategy

**Step 1: Systematic Extension Update**

Update ALL SFX entries in `src/config/assetManifest.js`:

**Gameplay audio section (lines 23-46):**
```javascript
// Before (WRONG):
laserFire: 'audio/sfx/laser-fire.mp3',
explosion: 'audio/sfx/explosion.mp3',
damageTaken: 'audio/sfx/damage-taken.mp3',
// ... (all .mp3)

// After (CORRECT):
laserFire: 'audio/sfx/laser-fire.wav',
explosion: 'audio/sfx/explosion.wav',
damageTaken: 'audio/sfx/damage-taken.wav',
// ... (all .wav)
```

**Tier2 audio section (lines 62-72):**
```javascript
// Before (WRONG):
wormholeSpawn: 'audio/sfx/wormhole-spawn.mp3',
wormholeActivate: 'audio/sfx/wormhole-activate.mp3',
// ... (all .mp3)

// After (CORRECT):
wormholeSpawn: 'audio/sfx/wormhole-spawn.wav',
wormholeActivate: 'audio/sfx/wormhole-activate.wav',
// ... (all .wav)
```

**IMPORTANT:** Do NOT change music file extensions — music files are correctly referenced as `.mp3`:
- `menuMusic: 'audio/music/Michett - Snackmix.mp3'` ✓ (correct)
- `gameplayMusic: 'audio/music/Creo - Rock Thing.mp3'` ✓ (correct)
- `bossMusic: 'audio/music/boss-theme.mp3'` ✓ (correct, even though file is missing)
- `tunnelMusic: 'audio/music/tunnel-theme.mp3'` ✓ (correct, even though file is missing)

**Step 2: Fix Filename Inconsistencies**

Two files use underscores instead of dashes:
1. `boss_phase.wav` (underscore) → manifest currently references `boss-phase.mp3` (dash + wrong extension)
2. `tunnel_exit.wav` (underscore) → manifest currently references `tunnel-exit.mp3` (dash + wrong extension)

Fix:
```javascript
// Line 66 (tier2.audio):
bossPhase: 'audio/sfx/boss_phase.wav',  // ← underscore not dash

// Line 71 (tier2.audio):
tunnelExit: 'audio/sfx/tunnel_exit.wav',  // ← underscore not dash
```

**Step 3: Add UI-Message.wav (Reserved for Future)**

Add new entry to `gameplay.audio` section for future UI notifications:
```javascript
// Add after existing SFX entries (around line 46):
uiMessage: 'audio/sfx/UI-Message.wav',
```

**Do NOT add to `useAudio.jsx` SFX_MAP yet** — this file is reserved for future use (e.g., notifications, alerts, messages). Only add to manifest so it's documented and ready when needed.

**Do NOT add to `audioManager.js` SFX_CATEGORY_MAP yet** — no category assignment needed until it's actually used.

### Architecture Compliance

**6-Layer Architecture:**
1. ✓ **Config**: `src/config/assetManifest.js` — Update ALL SFX file extensions to .wav, fix filename inconsistencies, add uiMessage entry
2. ○ **Systems**: No changes (audioManager.js already handles graceful failures)
3. ○ **Stores**: No changes
4. ○ **GameLoop**: No changes
5. ○ **Rendering**: No changes
6. ○ **UI**: No changes

**This is a pure config fix** — update asset paths to match actual files, no code logic changes needed.

### Graceful Audio Error Handling (Already Implemented)

**Current Implementation in `audioManager.js` (lines 150-152):**
```javascript
onloaderror: (id, err) => {
  console.warn(`Audio: failed to load "${key}":`, err)
},
```

**Behavior:**
- When Howler.js fails to load a sound file (wrong path, missing file, wrong extension):
  - Console warning is logged with the SFX key and error details
  - Game continues without the sound (silent failure)
  - No crash, no thrown error
- When `playSFX(key)` is called for a failed/missing sound:
  - `sfxPool[key]` is undefined or in error state
  - Graceful check in `playSFX()` (line 159): `if (!sound) return`
  - Function exits early, no crash

**Fallback Behavior for Missing Music Files:**
- `boss-theme.mp3` missing → Howler logs warning, gameplay music continues (no crossfade)
- `tunnel-theme.mp3` missing → Howler logs warning, silence during tunnel (or previous music continues)
- This is acceptable degradation — game doesn't crash

**Testing Notes:**
After fixing extensions, verify in browser console:
- ✓ No more "Audio: failed to load" warnings for SFX files
- ✓ Warnings only for genuinely missing files (boss-theme.mp3, tunnel-theme.mp3, level-up.mp3, etc.)
- ✓ All SFX play correctly during gameplay

### Testing Requirements

**Manual Test Cases:**
1. Load game → check browser console for audio load warnings
   - BEFORE FIX: Expect ~28 warnings for .mp3 → .wav mismatches
   - AFTER FIX: Expect only warnings for genuinely missing files (boss-theme, tunnel-theme, level-up, boss-attack, boss-hit, hp-recover, high-score)
2. Play through gameplay:
   - ✓ Laser fire sound on shooting (laser-fire.wav)
   - ✓ Explosion sound on enemy death (explosion.wav)
   - ✓ Damage sound when hit (damage-taken.wav)
   - ✓ Dash whoosh on dash activation (dash-whoosh.wav)
   - ✓ Scan sound loop during planet scan (scan-start.wav loop via Story 26.3)
   - ✓ Scan complete sound when scan finishes (scan-complete.wav)
   - ✓ All weapon SFX audible (railgun, trishot, shotgun, satellite, drone, beam, explosive)
3. UI interactions:
   - ✓ Button hover sound (button-hover.wav)
   - ✓ Button click sound (button-click.wav)
4. Boss phase:
   - ✓ Boss phase transition sound (boss_phase.wav — note underscore!)
   - ✓ Boss defeat sound (boss-defeat.wav)
5. Wormhole/tunnel:
   - ✓ Wormhole spawn sound (wormhole-spawn.wav)
   - ✓ Wormhole activate sound (wormhole-activate.wav)
   - ✓ Tunnel exit sound (tunnel_exit.wav — note underscore!)
6. Upgrades/dilemmas:
   - ✓ Upgrade purchase sound (upgrade-purchase.wav)
   - ✓ Dilemma accept sound (dilemma-accept.wav)
   - ✓ Dilemma refuse sound (dilemma-refuse.wav)
7. Pickups:
   - ✓ Fragment pickup sound (fragment-pickup.wav)
   - ✓ Rare XP gem pickup sound (xp-rare-pickup.wav)
8. Game over:
   - ✓ Game over impact sound (game-over-impact.wav)

**No Unit Tests Required:**
- This is a pure config change (asset path corrections)
- Manual playtesting is sufficient validation
- Audio system testing is cosmetic, not gameplay-critical

### Previous Story Intelligence (Story 26.3)

**Key Learnings from Story 26.3:**
- Scan loop implementation required separate Howl instance (not in sfxPool)
- GameLoop.jsx Section 7g handles scan audio control (not useAudio.jsx)
- assetManifest.js scan sound paths had wrong extensions (.mp3 → .wav) — fixed in Story 26.3
- Story 26.3 was marked `ready-for-dev` but NOT YET IMPLEMENTED (check sprint-status.yaml)

**Pattern to Adopt:**
- Module-scoped variables in audioManager.js for special audio state (e.g., scanLoopHowl)
- Direct file paths in audioManager.js (ASSET_MANIFEST is not imported there, used in useAudio.jsx)
- Defensive cleanup in GameLoop phase reset logic to prevent audio leaks

**Relevance to Story 26.4:**
- Story 26.3 fixes scan sound extensions (.mp3 → .wav) as part of scan loop implementation
- Story 26.4 fixes ALL remaining SFX extensions (.mp3 → .wav) systematically
- If Story 26.3 is implemented first, scan sound paths will already be correct (skip those in 26.4)
- If Story 26.4 is implemented first, include scan sound paths in the extension update

**Recommended Implementation Order:**
- Story 26.4 can be implemented BEFORE 26.3 (independent config fix)
- Update ALL SFX extensions in one pass (including scan sounds) to avoid partial fixes

### Git Intelligence Summary

**Recent Commits (Last 10):**
```
adf8beb feat: implement permanent upgrades meta stats with code review fixes (Story 20.5)
37eb314 feat: implement permanent upgrades utility stats with code review fixes (Story 20.4)
35bfa93 feat: universe background enhancement with code review fixes (Story 24.2)
628f6b3 feat: display Fragment count on main menu with code review fixes (Story 20.3)
ad04e1d feat: implement minimap follow player & zoom with code review fixes (Story 24.1)
44ebb67 feat: implement Upgrades Menu Screen with code review fixes (Story 20.2)
de1b5eb feat: implement permanent upgrades system with code review fixes (Story 20.1)
7462488 chore: add Epics 20-25 to sprint status and brainstorming session
2d7ad98 chore: code review completion for Stories 17.5 and 17.6
0ed5364 fix: code review fixes for Story 19.5 (loot system extensibility)
```

**Observed Patterns:**
- Commit message format: `feat: <description> with code review fixes (Story X.Y)`
- Stories follow workflow: implementation → review → fixes → done
- Recent work focused on Epic 20 (permanent upgrades) and Epic 24 (visual polish)
- No recent changes to audioManager.js, useAudio.jsx, or assetManifest.js
- Last audio-related work was Stories 19.1 (xp-rare-pickup) and 19.3 (fragment-pickup)

**Files Modified Recently (Not Audio-Related):**
- usePlayer.jsx, useUpgrades.jsx (permanent upgrades system)
- useLevel.jsx (minimap follow player)
- Background3D.jsx (universe background enhancement)
- MainMenu.jsx (fragment count display)

**No Conflicts Expected:**
- Story 26.4 only modifies `assetManifest.js` (config file)
- No overlap with recent work on stores, UI, or rendering
- Safe to implement independently

### Project Structure Notes

**File to Modify:**
- `src/config/assetManifest.js` — Update ALL SFX file extensions (.mp3 → .wav), fix filename inconsistencies, add uiMessage entry

**No New Files Needed.**

**No Changes Needed to:**
- `src/audio/audioManager.js` — Already handles graceful errors via onloaderror
- `src/hooks/useAudio.jsx` — SFX_MAP will automatically use updated paths from ASSET_MANIFEST
- `src/GameLoop.jsx` — No changes (already calls playSFX with correct keys)

**Architecture Boundary Compliance:**
- ✓ Config layer isolation maintained (assetManifest.js is pure data)
- ✓ No circular dependencies (assetManifest → useAudio → audioManager)
- ✓ Single source of truth for asset paths (ASSET_MANIFEST)

### References

- [Source: epic-26-audio-integration.md#Story 26.4 — Complete SFX Placeholder Mapping]
- [Source: src/config/assetManifest.js — Current asset manifest with WRONG .mp3 extensions for all SFX]
- [Source: src/audio/audioManager.js — Graceful error handling via onloaderror (lines 150-152)]
- [Source: src/hooks/useAudio.jsx — SFX_MAP preloading all sounds on mount]
- [Source: public/audio/sfx/ directory — ALL actual SFX files are .wav (verified via ls command)]
- [Source: Story 26.3 Dev Notes — Scan sound extension bug identified and fixed in scan loop story]
- [Source: Story 11.3 — Weapon SFX added with wrong .mp3 extensions (introduced bug)]
- [Source: Story 19.1 — Rare XP pickup SFX added with wrong .mp3 extension]
- [Source: Story 19.3 — Fragment pickup SFX added with wrong .mp3 extension]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

No debugging required - straightforward config update.

### Completion Notes List

**Implementation Summary:**

**IMPORTANT CLARIFICATION:** The bulk of this story's acceptance criteria (fixing SFX extensions from .mp3 → .wav) was already completed in Story 26.1's code review fixes (commit ad39414, Feb 15 2026). Story 26.4's actual implementation work was limited to adding the `uiMessage` entry.

**What was completed in Story 26.4:**

1. ✅ **Added UI-Message.wav to manifest** (NEW work in this story)
   - Added `uiMessage: 'audio/sfx/UI-Message.wav'` in gameplay.audio section
   - Reserved for future use (not added to SFX_MAP or SFX_CATEGORY_MAP)
   - File verified to exist: 123KB, created Mar 2021

2. ✅ **Verified all SFX extensions are .wav** (COMPLETED in Story 26.1, verified here)
   - gameplay.audio section: All 19 SFX entries use `.wav` ✓
   - tier2.audio section: All 9 SFX entries use `.wav` ✓
   - Music files correctly use `.mp3` or `.wav` ✓
   - Git evidence: Story 26.1 commit message explicitly states "Code review fixes: corrected all SFX file extensions from .mp3 to .wav"

3. ✅ **Verified filename inconsistencies are fixed** (COMPLETED in Story 26.1, verified here)
   - `bossPhase: 'audio/sfx/boss_phase.wav'` uses underscore ✓
   - `tunnelExit: 'audio/sfx/tunnel_exit.wav'` uses underscore ✓
   - Fixed in Story 26.1 alongside extension corrections

4. ✅ **Verified graceful audio error handling** (already implemented in earlier stories)
   - Confirmed `audioManager.js` lines 152-154 have `onloaderror` callback
   - Console warnings logged for missing files, no crashes
   - Game continues without sound for failed loads (acceptable degradation)

**Testing:**
- Dev server started successfully with new manifest entry
- No compilation errors
- All asset paths correctly point to existing files

**Architecture Compliance:**
- ✓ Config layer isolation maintained (assetManifest.js is pure data)
- ✓ No circular dependencies
- ✓ Single source of truth for asset paths (ASSET_MANIFEST)

### File List

- `src/config/assetManifest.js` (modified - added uiMessage entry)
- `src/config/gameConfig.js` (modified - CONTAMINATION from Story 21.3: PLAYER_MAX_BANK_ANGLE 0.4→0.25, unrelated to Story 26.4)

## Change Log

- 2026-02-15: Added UI-Message.wav to assetManifest.js for future UI notifications (Story 26.4)
- 2026-02-15: Code review corrections applied - clarified that SFX extension fixes were completed in Story 26.1, not Story 26.4
