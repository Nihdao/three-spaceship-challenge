# Epic 26: Audio Integration & Placeholder Sounds

The game integrates all placeholder audio files to create a complete soundscape, with proper music rotation per system, looping scan sound, and graceful handling of missing assets.

## Epic Goals

- Replace menu music with mainMenu.mp3
- Implement random music selection for each system (rotate between 3 tracks: Creo - Rock Thing, Guifrog - Frog Punch, Michett - Snackmix)
- Use Wormhole_Loop.wav as the tunnel theme music
- Transform scan-start.wav into a looping sound that plays while scanning
- Map all existing placeholder SFX files (.wav) to their corresponding game events
- Ensure graceful handling of missing audio files (no crashes, console warnings only)

## Epic Context

Currently, the game uses Michett - Snackmix.mp3 for menu music and Creo - Rock Thing.mp3 for gameplay. Most SFX files are placeholder .wav files that exist in public/audio/sfx/ but some referenced files (boss-theme.mp3, tunnel-theme.mp3, level-up.mp3, etc.) are missing. The scan-start sound plays once instead of looping during the scan duration.

Without proper audio integration, the game feels incomplete and players don't get the full intended experience. This epic ensures all available placeholder sounds are used correctly while gracefully handling missing files.

## Stories

### Story 26.1: Random Gameplay Music Per System

As a player,
I want to hear different music in each system I explore,
So that each system feels fresh and distinct.

**Acceptance Criteria:**

**Given** the gameplay music system
**When** a new system starts (system 1, 2, or 3)
**Then** the game randomly selects one of the 3 available gameplay tracks:
  - Creo - Rock Thing.mp3
  - Guifrog - Frog Punch.mp3
  - Michett - Snackmix.mp3
**And** the selected track plays for the entire system duration
**And** the selection is random each time (no guaranteed cycle)

**Given** the player transitions between systems
**When** moving from system 1 → tunnel → system 2
**Then** system 2's music is randomly selected (may be the same or different from system 1)
**And** the music crossfades smoothly during the transition

**Given** the boss phase
**When** the boss spawns
**Then** the gameplay music crossfades to boss music (if available)
**And** if boss music is missing, gameplay music continues playing

**Technical Implementation:**
- Create a `selectRandomGameplayMusic()` function in audioManager.js that returns one of the 3 tracks
- Update ASSET_MANIFEST.gameplay.audio to include all 3 gameplay tracks as an array
- Call `selectRandomGameplayMusic()` when entering gameplay phase from menu or tunnel
- Store selected track in useGame store (optional, for debugging)

### Story 26.2: Main Menu & Tunnel Music Integration

As a player,
I want to hear distinct music in the menu and tunnel hub,
So that each game phase has its own atmosphere.

**Acceptance Criteria:**

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

**Technical Implementation:**
- Update ASSET_MANIFEST.critical.audio.menuMusic to point to 'audio/music/mainMenu.mp3'
- Update ASSET_MANIFEST.tier2.audio.tunnelMusic to point to 'audio/music/Wormhole_Loop.wav'
- No code changes needed in useAudio.jsx beyond manifest updates

### Story 26.3: Scan Sound Looping System

As a player,
I want to hear a continuous scan sound while I'm scanning a planet,
So that the scanning action feels immersive and reactive.

**Acceptance Criteria:**

**Given** the player starts scanning a planet
**When** the scan begins (player enters planet scan zone and holds still)
**Then** scan-start.wav starts playing in loop
**And** the sound continues looping until the scan completes or is interrupted

**Given** the scan is interrupted
**When** the player moves out of the scan zone before completion
**Then** the scan-start loop stops immediately

**Given** the scan completes successfully
**When** the scan timer reaches 100%
**Then** the scan-start loop stops
**And** scan-complete.wav plays once

**Technical Implementation:**
- Add a new function `playScanLoop()` in audioManager.js that creates a looping Howl instance
- Add a new function `stopScanLoop()` in audioManager.js that stops the scan loop
- Modify the scan system (likely in GameLoop or a scan-related store) to call `playScanLoop()` when scan starts and `stopScanLoop()` when scan ends/interrupts
- Store the scan loop Howl instance separately from sfxPool (it's a special case, not a one-shot SFX)

### Story 26.4: Complete SFX Placeholder Mapping

As a player,
I want all game actions to have corresponding sound effects,
So that the game feels polished and responsive.

**Acceptance Criteria:**

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

**Technical Implementation:**
- Review ASSET_MANIFEST.gameplay.audio and ASSET_MANIFEST.tier2.audio
- Update all SFX file extensions from .mp3 to .wav where applicable
- Verify all paths match actual files
- Add UI-Message.wav to manifest (but don't use it yet, reserve for future)

### Story 26.5: Graceful Audio Error Handling

As a developer,
I want the game to handle missing audio files gracefully,
So that placeholder or missing assets don't crash the game or disrupt the player experience.

**Acceptance Criteria:**

**Given** a referenced audio file is missing (e.g., boss-theme.mp3, level-up.mp3)
**When** the game attempts to load or play it
**Then** the audioManager logs a console warning with the missing file name
**And** the game continues without the sound
**And** no error is thrown to the console or crashes the game

**Given** music files that are currently missing
**When** they would be played
**Then** the following fallback behavior occurs:
  - boss-theme.mp3 missing → continue playing current gameplay music (no crossfade)
  - level-up.mp3 missing → no level-up sound (silent)
  - boss-attack.mp3 missing → no boss attack sound (silent)
  - boss-hit.mp3 missing → no boss hit sound (silent)
  - hp-recover.mp3 missing → no heal sound (silent, until heal gems are implemented)

**Given** the audioManager preload system
**When** preloadSounds() is called
**Then** the onloaderror callback already handles missing files gracefully (console.warn)
**And** failed loads don't prevent other sounds from loading

**Given** the playMusic and playSFX functions
**When** called with a missing asset
**Then** Howler's built-in error handling prevents crashes
**And** the game continues normally

**Technical Implementation:**
- Verify that audioManager.js already handles missing files via Howl's onloaderror
- Test that missing music files don't crash the crossfade logic
- Add defensive checks in useAudio.jsx if needed (optional, Howler should handle this)
- Document the fallback behavior in code comments

## Technical Notes

**Architecture Alignment:**
- **Config Layer**: ASSET_MANIFEST.js — Update music paths and SFX extensions
- **Systems Layer**: audioManager.js — Add scan loop functions, random music selection
- **Systems Layer**: Scan system (GameLoop or scan store) — Integrate scan loop calls
- **UI Layer**: useAudio.jsx — Update music transitions to use random selection

**Howler.js Capabilities:**
- Howl instances can be looped via `loop: true`
- Scan loop is a special Howl instance (not in sfxPool) with manual stop control
- onloaderror already provides graceful failure handling

**Random Music Selection:**
- Use `Math.floor(Math.random() * 3)` to select from array of 3 tracks
- Store selection in audioManager scope (not in store, to keep audio logic isolated)
- Consider storing selected track name in useGame.systemMusicTrack for debugging (optional)

**File Extensions:**
- Music files: .mp3 and .wav (Wormhole_Loop.wav)
- SFX files: .wav (most), .mp3 (currently incorrect in manifest, need to update)

## Dependencies

- Story 4.5 (Audio System) — Base audio system implementation
- Story 5.3 (Planet Scanning) — Scan start/stop events
- Story 6.1 (Wormhole Discovery) — Wormhole spawn events
- Story 7.3 (Tunnel Exit) — System transition events
- Story 11.3 (Complete Weapon Roster) — Weapon SFX mapping
- Story 19.1 (Rare XP Gem Drops) — Rare XP pickup SFX
- Story 19.3 (Fragment Drops) — Fragment pickup SFX

## Success Metrics

- Players report that each system feels distinct with varied music
- Scan sound feels immersive and reactive (playtest feedback)
- No audio-related crashes or console errors during gameplay
- All available placeholder sounds are heard during normal gameplay
- Missing audio files are logged but don't disrupt experience

## References

- audioManager.js — Current audio system implementation
- useAudio.jsx — Phase-based music transitions
- ASSET_MANIFEST.js — Asset path definitions
- Howler.js documentation — Looping, error handling
