# Story 26.2: main-menu-tunnel-music-integration

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want to hear distinct music in the menu and tunnel hub,
So that each game phase has its own atmosphere.

## Acceptance Criteria

**Given** the main menu
**When** the player is on the menu screen
**Then** mainMenu.mp3 plays in loop
**And** the music crossfades when transitioning to gameplay

**Given** the tunnel hub
**When** the player enters the tunnel after defeating a boss
**Then** Wormhole_Loop.wav plays in loop
**And** the music crossfades from boss music (or gameplay music if boss music is missing)

**Given** the tunnel exit
**When** the player selects a system and exits the tunnel
**Then** the tunnel music crossfades to the new system's randomly selected gameplay music

## Tasks / Subtasks

- [x] Update ASSET_MANIFEST.critical.audio.menuMusic to point to 'audio/music/mainMenu.mp3' (AC: 1)
  - [x] Change from 'Michett - Snackmix.mp3' to 'mainMenu.mp3' in assetManifest.js
  - [x] Verify path matches actual file location in public/audio/music/
- [x] Update ASSET_MANIFEST.tier2.audio.tunnelMusic to point to 'audio/music/Wormhole_Loop.wav' (AC: 2)
  - [x] Change from 'tunnel-theme.mp3' to 'Wormhole_Loop.wav' in assetManifest.js
  - [x] Note: .wav extension instead of .mp3
- [x] Test menu music integration (AC: 1)
  - [x] Verify mainMenu.mp3 plays on menu screen
  - [x] Verify crossfade to gameplay music works (Story 26.1 random selection)
  - [x] Verify returning to menu from gameOver/victory crossfades back to mainMenu.mp3
- [x] Test tunnel music integration (AC: 2, 3)
  - [x] Verify Wormhole_Loop.wav plays when entering tunnel after boss defeat
  - [x] Verify crossfade from boss music (or gameplay music if boss music missing)
  - [x] Verify tunnel → gameplay transition crossfades to randomly selected system music
  - [x] Verify loop works correctly (no gaps or stuttering)
- [x] Fix browser autoplay policy blocking menu music (unplanned)
  - [x] Add autoplay unlock handler in useAudio.jsx
  - [x] Restart menu music after first user interaction
- [x] Adjust music trigger timing for phase transitions (unplanned)
  - [x] Change gameplay music trigger from 'gameplay' phase to 'systemEntry' phase
  - [x] Account for shipSelect intermediate phase in transition logic

## Dev Notes

### Current Audio System State (Post Story 26.1)

**Recent Changes from Story 26.1:**
- `selectRandomGameplayMusic()` function added to audioManager.js
- `getCurrentGameplayTrack()` getter added for debugging
- ASSET_MANIFEST.gameplay.audio.gameplayMusic changed from single string to array of 3 tracks
- useAudio.jsx updated to call selectRandomGameplayMusic() on gameplay phase transitions
- Random music selection working: Creo - Rock Thing, Guifrog - Frog Punch, Michett - Snackmix

**Current Menu Music:**
- Path: `ASSET_MANIFEST.critical.audio.menuMusic = 'audio/music/Michett - Snackmix.mp3'`
- Used by useAudio.jsx at lines 68, 71 (menu phase transitions)
- File size: 9.1 MB
- **Issue:** Michett - Snackmix.mp3 is now a gameplay track (Story 26.1), creating overlap confusion

**Current Tunnel Music:**
- Path: `ASSET_MANIFEST.tier2.audio.tunnelMusic = 'audio/music/tunnel-theme.mp3'`
- Used by useAudio.jsx at line 90 (tunnel phase transition)
- **Issue:** tunnel-theme.mp3 file is **missing** from public/audio/music/
- Fallback: Howler.js onloaderror gracefully logs warning and continues without music

**Available Music Files in public/audio/music/:**
- ✓ Creo - Rock Thing.mp3 (7.8 MB) — gameplay track
- ✓ Guifrog - Frog Punch.mp3 (8.4 MB) — gameplay track
- ✓ Michett - Snackmix.mp3 (9.1 MB) — gameplay track
- ✓ **mainMenu.mp3 (6.5 MB)** — target menu music for this story
- ✓ **Wormhole_Loop.wav (3.7 MB)** — target tunnel music for this story

### Implementation Strategy

**This story requires ONLY manifest path updates — no code changes in audioManager.js or useAudio.jsx.**

The audio system already handles:
- Phase-based music transitions (useAudio.jsx lines 62-96)
- Crossfade logic (audioManager.js crossfadeMusic function)
- Loop playback (Howl `loop: true` option)
- Missing file graceful fallback (Howler onloaderror)

**Step 1: Update Menu Music Path**
```javascript
// src/config/assetManifest.js — Line 10
// Before:
menuMusic: 'audio/music/Michett - Snackmix.mp3',

// After:
menuMusic: 'audio/music/mainMenu.mp3',
```

**Step 2: Update Tunnel Music Path**
```javascript
// src/config/assetManifest.js — Line 61
// Before:
tunnelMusic: 'audio/music/tunnel-theme.mp3',

// After:
tunnelMusic: 'audio/music/Wormhole_Loop.wav',
```

**Critical Notes:**
- Wormhole_Loop.wav uses .wav extension, not .mp3
- Howler.js handles .wav files natively (browser support: MP3, WAV, OGG)
- File paths are relative to public/ directory
- No changes needed to useAudio.jsx — it reads from ASSET_MANIFEST

### Architecture Compliance

**6-Layer Architecture:**
1. ✓ **Config**: assetManifest.js updated with new paths (ONLY file modified)
2. ✓ **Systems**: audioManager.js unchanged (already handles crossfades, loops, errors)
3. ✓ **Stores**: No changes (audio system is store-independent)
4. ✓ **GameLoop**: No changes (music transitions are phase-based, not tick-based)
5. ✓ **Rendering**: No changes
6. ✓ **UI**: useAudio.jsx unchanged (already reads from manifest and handles all phase transitions)

**Boundary Rules:**
- Config layer is data-only ✓
- No new dependencies introduced ✓
- Existing phase-based transition logic reused ✓

### Music Transition Flow (Already Implemented in useAudio.jsx)

**Menu Phase:**
- Initial load: `playMusic(ASSET_MANIFEST.critical.audio.menuMusic)` — line 71
- Return from gameOver/victory: `crossfadeMusic(ASSET_MANIFEST.critical.audio.menuMusic, 500)` — line 68
- **Effect of this story:** mainMenu.mp3 will play instead of Michett - Snackmix.mp3

**Gameplay Phase:**
- From menu: `crossfadeMusic(selectedTrack, 1000)` — line 76 (Story 26.1 random selection)
- From tunnel: `crossfadeMusic(selectedTrack, 1000)` — line 82 (Story 26.1 random selection)
- **Effect of this story:** Crossfade FROM mainMenu.mp3 or Wormhole_Loop.wav TO random gameplay track

**Tunnel Phase:**
- From boss: `crossfadeMusic(ASSET_MANIFEST.tier2.audio.tunnelMusic, 1000)` — line 90
- **Effect of this story:** Wormhole_Loop.wav will play instead of missing tunnel-theme.mp3

### Testing Requirements

**Manual Test Cases:**
1. **Menu Music Test:**
   - Start game → Verify mainMenu.mp3 plays on menu screen
   - Click "Play" → Verify crossfade to random gameplay music (Story 26.1)
   - Die → Return to menu → Verify crossfade back to mainMenu.mp3
   - Win → Return to menu → Verify crossfade back to mainMenu.mp3

2. **Tunnel Music Test:**
   - Complete system 1 → Defeat boss → Enter tunnel → Verify Wormhole_Loop.wav plays
   - Verify loop is seamless (no gap or stutter at loop point)
   - Select next system → Verify crossfade to random gameplay music
   - Complete system 2 → Defeat boss → Enter tunnel again → Verify Wormhole_Loop.wav plays again

3. **Crossfade Quality Test:**
   - Verify all crossfades are smooth (no abrupt volume jumps)
   - Verify crossfade durations match spec (500ms for menu return, 1000ms for others)
   - Verify old tracks stop and unload after fade (no memory leak)

**No Unit Tests Required:**
- This story is configuration-only (no new logic)
- Manual playtesting is sufficient validation
- Howler.js handles file format differences (.mp3 vs .wav) transparently

### Fallback & Error Handling (Already Implemented)

**Graceful Degradation:**
- audioManager.js `onloaderror` callback logs warnings for missing files (line 150-152)
- If mainMenu.mp3 or Wormhole_Loop.wav fail to load, game continues without music
- Console warning will indicate which file failed
- No crashes or gameplay disruption

**File Format Support:**
- Howler.js supports: MP3, MPEG, OPUS, OGG, OGA, WAV, AAC, CAF, M4A, M4B, MP4, WEBA, WEBM, DOLBY, FLAC
- Wormhole_Loop.wav is natively supported
- Browser fallback: if .wav unsupported, Howler logs error but game continues

### Performance Considerations

**Asset Loading:**
- mainMenu.mp3 (6.5 MB) is in ASSET_MANIFEST.critical — loaded upfront before menu shows
- Wormhole_Loop.wav (3.7 MB) is in ASSET_MANIFEST.tier2 — loaded on-demand when tunnel phase starts
- Both files are smaller than Michett - Snackmix.mp3 (9.1 MB) currently used for menu
- **Net effect:** Faster initial load (6.5 MB vs 9.1 MB for menu music)

**Memory Impact:**
- Only 1 music track in memory at a time (Howler behavior)
- Crossfade briefly holds 2 tracks (old fading out, new fading in)
- Old track unloaded via `unload()` after fade completes (audioManager.js line 110)
- No memory leak risk from this change

**Audio Format Considerations:**
- .wav files are uncompressed → larger file size but lower decode overhead
- Wormhole_Loop.wav (3.7 MB) as .wav is acceptable for tunnel music (short loop)
- .mp3 files are compressed → smaller file size but higher decode overhead
- Howler.js handles both formats efficiently with browser-native decoders

### Project Structure Notes

**Files to modify:**
1. `src/config/assetManifest.js` — Update 2 paths (lines 10 and 61)

**No new files needed.**
**No code logic changes needed.**

### Previous Story Intelligence (Story 26.1)

**Key Learnings from 26.1:**
- Random music selection was implemented in audioManager.js via `selectRandomGameplayMusic()`
- ASSET_MANIFEST.gameplay.audio.gameplayMusic was converted from string to array
- useAudio.jsx was updated to call selectRandomGameplayMusic() for gameplay phase transitions
- All 3 gameplay tracks verified working: Creo - Rock Thing, Guifrog - Frog Punch, Michett - Snackmix
- Crossfade logic already handles transitions smoothly

**Impact on Story 26.2:**
- Menu → gameplay transition will now crossfade to **randomly selected** gameplay music (not fixed Creo - Rock Thing)
- Tunnel → gameplay transition will also use random selection
- This story's menu music change (mainMenu.mp3) will integrate seamlessly with Story 26.1's random gameplay music

### References

- [Source: epic-26-audio-integration.md#Story 26.2]
- [Source: architecture.md#Audio Decision — Howler.js]
- [Source: src/audio/audioManager.js — Music management functions]
- [Source: src/hooks/useAudio.jsx — Phase-based music transitions]
- [Source: src/config/assetManifest.js — Asset path definitions]
- [Source: 26-1-random-gameplay-music-per-system.md — Previous story learnings]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

**Runtime Issues Discovered:**
1. Browser autoplay policy blocked menu music on initial load
2. Phase transitions included intermediate phases (shipSelect, systemEntry) not documented in story
3. Gameplay music transition needed to trigger at systemEntry phase, not gameplay phase

**Console errors found during testing:**
- Audio files correctly marked as missing loaded gracefully (level-up, boss-hit, etc.)
- THREE.WebGLRenderer: Context Lost (unrelated GPU issue, not caused by this story)

### Completion Notes List

✅ **Configuration Updates Completed**
- Updated `ASSET_MANIFEST.critical.audio.menuMusic` from 'Michett - Snackmix.mp3' to 'mainMenu.mp3'
- Updated `ASSET_MANIFEST.tier2.audio.tunnelMusic` from 'tunnel-theme.mp3' to 'Wormhole_Loop.wav'
- Verified both audio files exist at specified paths:
  - public/audio/music/mainMenu.mp3 (6.5 MB) ✓
  - public/audio/music/Wormhole_Loop.wav (3.7 MB) ✓
- Build passes successfully with no errors

⚠️ **Additional Code Changes Required (Story Deviation)**

**Issue 1: Browser Autoplay Policy**
- **Problem:** Menu music didn't play on initial page load (blocked by browser autoplay policy)
- **Root cause:** AudioContext remains suspended until first user interaction
- **Fix:** Modified useAudio.jsx to restart menu music after unlockAudioContext() on first click
- **Impact:** Menu music now plays correctly after first user interaction

**Issue 2: Missing Phase Transitions**
- **Problem:** Gameplay music never started, menu music continued playing during gameplay
- **Root cause:** Phase flow is menu → shipSelect → systemEntry → gameplay (not menu → gameplay)
- **Original code assumption:** `if (prevPhase === 'menu')` to trigger gameplay music
- **Reality:** When reaching gameplay, prevPhase is 'systemEntry', not 'menu'
- **Fix:** Moved gameplay music trigger to systemEntry phase instead of gameplay phase
- **Impact:** Music now crossfades from menu to gameplay track during system entry animation
- **User preference:** Music starts at systemEntry (portal animation) rather than gameplay start

**Testing Results:**
1. ✅ **Menu Music (AC 1):**
   - Menu music plays after first click (autoplay policy workaround)
   - Crossfade to random gameplay music works during systemEntry transition
   - Crossfade back to menu music works from gameOver/victory screens

2. ✅ **Tunnel Music (AC 2, 3):**
   - Wormhole_Loop.wav plays when entering tunnel after boss defeat
   - Seamless loop confirmed (no gaps or stuttering)
   - Crossfade from tunnel to new random gameplay music works
   - Multiple tunnel entries all play Wormhole_Loop.wav correctly

**Technical Notes:**
- Originally planned as config-only but required useAudio.jsx modifications
- Added debug console.log statements for phase transitions (can be removed post-review)
- No unit tests written (audio playback requires manual validation)
- Howler.js handles .wav format natively
- Graceful error handling already in place for missing files

### File List

- src/config/assetManifest.js (modified - planned)
- src/hooks/useAudio.jsx (modified - unplanned, required for browser autoplay fix and phase transitions)

**Note:** Git working directory contains additional modified files from other in-progress stories (21.1: Dual-stick controls, 20.7: Enriched ship stats). Those changes are excluded from this story's scope and will be committed separately.

### Code Review Notes (AI)

**Review Date:** 2026-02-15
**Reviewer:** Claude Sonnet 4.5 (Code Review Agent)

**Fixes Applied:**
1. ✅ Removed 3 debug console.log statements from useAudio.jsx (lines 78, 110, 114)
2. ✅ Added retrospective tasks for unplanned work (autoplay fix, phase timing)
3. ✅ Added File List note about external story changes in git working directory

**Issues Fixed:** 3 Medium severity issues
**Issues Remaining:** 1 High (git working directory contains uncommitted changes from Stories 21.1 and 20.7 - requires manual git management)

**Acceptance Criteria:** All 3 ACs verified as implemented ✅
**Task Completion:** All tasks [x] verified complete ✅

**Recommendations for Next Story:**
- Commit Story 26.2 changes separately before starting new work
- Consider using git stash or feature branches to isolate story changes
- Remove or conditionalize debug logging during development (use `if (import.meta.env.DEV)`)
