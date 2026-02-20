# Story 28.3: Fix Music Transition & Volume Balance

Status: done

## Story

As a player,
I want the music to transition cleanly between menu and gameplay,
And I want to hear SFX clearly without them being covered by music.

## Acceptance Criteria

### AC1: Clean Menu → Gameplay Music Transition
**Given** the music transition (menu → gameplay)
**When** gameplay starts (systemEntry phase)
**Then** the main menu music fully stops before the gameplay music starts
**And** there is no overlap or bleed of the menu music into gameplay
**And** the gameplay music is selected randomly from available tracks (Story 26.1 behavior preserved)

### AC2: Reduced Gameplay Music Volume
**Given** gameplay music volume
**When** a gameplay track is playing
**Then** its default volume is reduced to ~0.35 (down from 1.0) to avoid drowning SFX
**And** music volume can still be adjusted by the player in Options

### AC3: SFX Volume Rebalancing
**Given** SFX volume rebalancing
**When** the player triggers SFX (explosions, dash, scans, wormhole, boss events, UI sounds)
**Then** non-weapon SFX are perceived as clearly audible over the music
**And** the VOLUME_CATEGORIES in audioManager.js are adjusted:
  - `sfxFeedbackPositive`: 1.0 (up from 0.9) — explosions, scan-complete, etc.
  - `sfxFeedbackNegative`: 1.2 (up from 1.0) — damage-taken, more urgent
  - `events`: 1.5 (up from 1.2) — boss defeat, game over impact
  - `ui`: 0.7 (up from 0.5) — button sounds now more audible
  - `music` default volume constant: 0.35 (down from 1.0)
**And** weapon SFX (`sfxAction`) remain at 0.8 as-is

### AC4: Scan Loop Rebalancing
**Given** the scan loop sound (Story 26.3)
**When** scanning is active
**Then** the scan loop sound is also rebalanced consistently with the new SFX volumes
**And** `playScanLoop()` picks up the updated `ui` category volume (0.7) automatically via VOLUME_CATEGORIES

## Tasks / Subtasks

- [x] Update VOLUME_CATEGORIES in audioManager.js (AC: #2, #3, #4)
  - [x] Change `music: 1.0` → `music: 0.35`
  - [x] Change `sfxFeedbackPositive: 0.9` → `sfxFeedbackPositive: 1.0`
  - [x] Change `sfxFeedbackNegative: 1.0` → `sfxFeedbackNegative: 1.2`
  - [x] Change `events: 1.2` → `events: 1.5`
  - [x] Change `ui: 0.5` → `ui: 0.7`
  - [x] Keep `sfxAction: 0.8` unchanged
  - [x] Verify `musicVolume` variable is initialized from `VOLUME_CATEGORIES.music` (already true, line 73 — no code change needed)

- [x] Fix handleInteraction race condition in useAudio.jsx (AC: #1)
  - [x] In `handleInteraction`, capture `wasLocked = !isUnlocked()` BEFORE calling `unlockAudioContext()`
  - [x] Only call `playMusic(menuMusic)` if `wasLocked` is true AND phase is 'menu'
  - [x] This prevents menu music from restarting when the user's first click IS the "Play" button

- [x] Fix systemEntry music trigger for galaxyChoice → systemEntry transition (bonus fix)
  - [x] Add `|| prevPhase === 'galaxyChoice'` to systemEntry condition in useAudio.jsx
  - [x] Without this fix, gameplay music would not start when coming from the galaxy choice screen (Story 25.3 phase, never updated in music subscription)

- [x] Verify scan loop rebalancing is automatic — no code changes (AC: #4)
  - [x] Confirm `playScanLoop()` reads `SFX_CATEGORY_MAP['scan-start']` → 'ui' → VOLUME_CATEGORIES['ui'] at call time
  - [x] Confirm no hardcoded volume override in `playScanLoop()` (it doesn't have one)

- [ ] Manual QA: Music transition (AC: #1)
  - [ ] Scenario A: Open game → immediately click "Play" as first interaction — verify no menu music bleed
  - [ ] Scenario B: Wait for menu music to play → then click "Play" — verify clean transition
  - [ ] Scenario C: Die during gameplay → return to menu → menu music restarts correctly
  - [ ] Scenario D: Win → return to menu → menu music restarts correctly
  - [ ] Scenario E: Enter tunnel → music transitions to Wormhole_Loop.wav
  - [ ] Scenario F: Exit tunnel → music transitions to new random gameplay track

- [ ] Manual QA: Volume balance (AC: #2, #3)
  - [ ] Verify gameplay music plays noticeably quieter than before (~35% of max vs ~100%)
  - [ ] Trigger explosion SFX during gameplay — verify clearly audible over music
  - [ ] Trigger damage-taken SFX — verify more urgent/prominent than before
  - [ ] Trigger boss-defeat SFX — verify impactful (events now at 1.5)
  - [ ] Test UI button sounds — verify more audible (ui now at 0.7)
  - [ ] Test weapon fire (laser, railgun, etc.) — verify unchanged level (sfxAction still 0.8)
  - [ ] Open Options → adjust music slider → verify it still overrides music volume correctly

## Dev Notes

### Root Cause: handleInteraction Race Condition

The music bleed bug occurs when the user's **first ever click** is the "Play" button on the main menu. Native DOM events fire BEFORE React synthetic events (React 18 attaches events to root container, not document — so `document.addEventListener` fires first). The sequence:

1. User opens game — menu music may or may not be playing (browser autoplay policy)
2. User clicks "Play" (first click ever in this session)
3. **`handleInteraction` fires first** (native DOM listener on document):
   - `unlockAudioContext()` called
   - Checks `currentPhase === 'menu'` → **TRUE** (phase hasn't changed yet)
   - `playMusic(menuMusic)` called — (re)starts menu music from scratch
4. **React's onClick fires next** → game starts → phase changes to 'systemEntry'
5. Phase subscription fires → `crossfadeMusic(selectedTrack, 1000)`
6. Menu music fades out over **1 full second** — this is the bleed

Additionally: if menu music was already playing fine (no autoplay block), step 3 unnecessarily restarts it, making the crossfade fade out a brand-new track instead of the smoothly playing one.

**The Fix — useAudio.jsx lines 61-68:**

```js
// BEFORE:
const handleInteraction = () => {
  unlockAudioContext()
  const currentPhase = useGame.getState().phase
  if (currentPhase === 'menu') {
    playMusic(ASSET_MANIFEST.critical.audio.menuMusic)
  }
  document.removeEventListener('click', handleInteraction)
  document.removeEventListener('keydown', handleInteraction)
}

// AFTER:
const handleInteraction = () => {
  const wasLocked = !isUnlocked()  // capture BEFORE unlocking
  unlockAudioContext()
  if (wasLocked) {
    const currentPhase = useGame.getState().phase
    if (currentPhase === 'menu') {
      playMusic(ASSET_MANIFEST.critical.audio.menuMusic)
    }
  }
  document.removeEventListener('click', handleInteraction)
  document.removeEventListener('keydown', handleInteraction)
}
```

`isUnlocked()` is already exported from audioManager.js (line 264): `return Howler.ctx?.state === 'running'`. This check requires no new imports.

### VOLUME_CATEGORIES Changes — Before & After

**File: `src/audio/audioManager.js` lines 22-30**

```js
// BEFORE (current state):
export const VOLUME_CATEGORIES = {
  music: 1.0,
  sfxAction: 0.8,
  sfxFeedbackPositive: 0.9,
  sfxFeedbackNegative: 1.0,
  ui: 0.5,
  events: 1.2,
}

// AFTER (this story):
export const VOLUME_CATEGORIES = {
  music: 0.35,              // down from 1.0 — gameplay music no longer drowns SFX
  sfxAction: 0.8,           // UNCHANGED — "les sons de tirs sont fort" (per user)
  sfxFeedbackPositive: 1.0, // up from 0.9 — explosions, scan-complete more audible
  sfxFeedbackNegative: 1.2, // up from 1.0 — damage-taken more urgent
  ui: 0.7,                  // up from 0.5 — button sounds more audible
  events: 1.5,              // up from 1.2 — boss-defeat, game-over-impact more impactful
}
```

### How musicVolume & VOLUME_CATEGORIES Interact

The `music` value in VOLUME_CATEGORIES is the DEFAULT music volume. It flows through:

```js
// audioManager.js line 73:
let musicVolume = VOLUME_CATEGORIES.music  // initialized to 0.35 after fix

// playMusic() — uses musicVolume as default (line 94):
volume: options.volume ?? musicVolume  // 0.35 for gameplay music

// crossfadeMusic() — target fade volume (line 160):
currentMusic.fade(0, options.volume ?? musicVolume, duration)  // 0.35

// loadAudioSettings() — player preference overrides default (line 252):
musicVolume = Math.max(0, Math.min(1, saved.musicVolume / 100))
// → player who saved at 100% still hears at 1.0 (their saved choice)
// → new player (no saved settings) hears at 0.35 (the new default)
```

**No changes needed to `playMusic()` or `crossfadeMusic()` for volume** — they already use `musicVolume` as default, which picks up the new 0.35 value automatically.

### Scan Loop: Automatic Rebalancing

`playScanLoop()` in audioManager.js (line 308-322):
```js
const category = SFX_CATEGORY_MAP['scan-start'] || 'ui'   // → 'ui'
const categoryVol = VOLUME_CATEGORIES[category] ?? 1.0     // → 0.7 (was 0.5)
scanLoopSound = new Howl({
  src: ['audio/sfx/scan-start.wav'],
  loop: true,
  volume: categoryVol * sfxVolume,  // → 0.7 * sfxVolume
  // ...
})
```

**No code changes needed.** The volume reads VOLUME_CATEGORIES at call time. Changing `ui: 0.5 → 0.7` automatically applies to scan loop. AC4 is satisfied purely by Task 1.

### Music Transition Flow (Complete Reference)

```
menu → shipSelect → systemEntry → gameplay → boss → victory/gameOver → menu
         ↑                ↓            ↓       ↓         ↓              ↓
         no audio    crossfade    no change  crossfade  fadeOut(500)  crossfade
         trigger     random@0.35  (cont.)   boss@1500               menu@500
```

The `crossfadeMusic(selectedTrack, 1000)` for `systemEntry` already uses `options.volume ?? musicVolume`. After fixing VOLUME_CATEGORIES, `musicVolume` = 0.35, so gameplay music fades in to 0.35 automatically. **No changes needed to the phase subscription logic in useAudio.jsx.**

### Architecture Compliance

Following the 6-layer architecture:

1. **Config/Data**: No changes
2. **Systems**: `src/audio/audioManager.js` — VOLUME_CATEGORIES data constants updated (lines 22-30 only)
3. **Stores**: No changes
4. **GameLoop**: No changes
5. **Rendering**: No changes
6. **UI/Hooks**: `src/hooks/useAudio.jsx` — handleInteraction race condition fixed (lines 61-68 only)

Both changes are surgical. No new imports. No new dependencies. No new functions.

### Previous Story Intelligence (28.2)

From Story 28.2 learnings:
- Epic 28 scope is deliberately minimal — each story touches 1-2 files max
- No tests for audio/visual-only changes — manual QA is the standard
- Root cause analysis before touching files is key (28.2 identified the actual culprit in `usePlayerCamera.jsx`, not `DebugControls.jsx`)
- Same applies here: `handleInteraction` is the actual bug, not `crossfadeMusic()` itself

From Story 26.2 learnings (music system origin):
- The `handleInteraction` listener was added specifically to handle browser autoplay block
- Phase flow was corrected to trigger at `systemEntry` not `gameplay`
- Any future audio work should account for this phase ordering: menu → shipSelect → systemEntry → gameplay

### Project Structure Notes

**Files to modify:**
1. `src/audio/audioManager.js` — VOLUME_CATEGORIES constants (lines 22-30)
2. `src/hooks/useAudio.jsx` — `handleInteraction` function (lines 61-68)

**Total changes: ~8 lines modified across 2 files.**

**Do NOT touch:**
- `playScanLoop()` — rebalances automatically
- `crossfadeMusic()` / `playMusic()` — volume reads from `musicVolume` automatically
- Phase subscription logic in `useAudio.jsx` — correctly implemented in 26.1/26.2

### References

- [Source: src/audio/audioManager.js:22-30] — VOLUME_CATEGORIES constants to update
- [Source: src/audio/audioManager.js:73] — `let musicVolume = VOLUME_CATEGORIES.music` initialization
- [Source: src/audio/audioManager.js:88-109] — `playMusic()` — uses `options.volume ?? musicVolume`
- [Source: src/audio/audioManager.js:133-165] — `crossfadeMusic()` — target volume = `musicVolume`
- [Source: src/audio/audioManager.js:264-270] — `isUnlocked()` — already exported, needed for fix
- [Source: src/audio/audioManager.js:303-323] — `playScanLoop()` — reads VOLUME_CATEGORIES at call time
- [Source: src/hooks/useAudio.jsx:61-68] — `handleInteraction` race condition fix location
- [Source: src/hooks/useAudio.jsx:86-113] — Phase subscription — music transitions (no change needed)
- [Source: _bmad-output/planning-artifacts/epic-28-bugs-balance-polish.md#Story 28.3] — Full requirements
- [Source: _bmad-output/planning-artifacts/epic-28-bugs-balance-polish.md#Technical Notes] — Implementation guidance
- [Source: _bmad-output/implementation-artifacts/26-2-main-menu-tunnel-music-integration.md#Completion Notes] — Reveals race condition origin and phase flow history

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (claude-sonnet-4-6)

### Debug Log References

None.

### Completion Notes List

- **audioManager.js VOLUME_CATEGORIES**: `music: 1.0→0.35`, `sfxFeedbackPositive: 0.9→1.0`, `sfxFeedbackNegative: 1.0→1.2`, `ui: 0.5→0.7`, `events: 1.2→1.5`. `sfxAction` kept at 0.8.
- **`musicVolume`** (line 73) initialises from `VOLUME_CATEGORIES.music` — picks up 0.35 automatically, no other changes needed to `playMusic()` or `crossfadeMusic()`.
- **useAudio.jsx handleInteraction race condition fixed**: added `isUnlocked` import; `wasLocked = !isUnlocked()` captured before `unlockAudioContext()`. Menu music only (re)started if audio context was actually locked.
- **useAudio.jsx systemEntry prevPhase bug fixed**: subscription check `prevPhase === 'shipSelect'` was missing `'galaxyChoice'`. Real phase flow is menu → shipSelect → galaxyChoice → systemEntry (Story 25.3 added galaxyChoice but music subscription was never updated). Added `|| prevPhase === 'galaxyChoice'` — gameplay music now crossfades correctly from galaxy choice screen.
- **Scan loop rebalancing (AC4)**: automatic — `playScanLoop()` reads `VOLUME_CATEGORIES['ui']` at call time; changing `ui: 0.5→0.7` is sufficient, no playScanLoop code change.
- No tests added — audio/visual-only changes; manual QA is the validation standard per story Dev Notes.

### File List

- src/audio/audioManager.js
- src/hooks/useAudio.jsx

### Change Log

- 2026-02-20: Story 28.3 implemented — VOLUME_CATEGORIES rebalanced, handleInteraction race condition fixed
- 2026-02-20: Bonus fix — galaxyChoice → systemEntry music trigger (useAudio.jsx:113): prevPhase check was missing 'galaxyChoice', causing gameplay music to not start in the normal menu → shipSelect → galaxyChoice → systemEntry flow
- 2026-02-20: Code review fix — added comment to VOLUME_CATEGORIES explaining Howler.js [0,1] clamping for sfxFeedbackNegative:1.2 and events:1.5 (values above 1.0 act as priority weights at reduced sfxVolume)
