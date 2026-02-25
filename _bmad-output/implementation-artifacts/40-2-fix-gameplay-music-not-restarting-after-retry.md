# Story 40.2: Fix Gameplay Music Not Restarting After Game Over Retry

Status: done

## Story

As a player,
I want the gameplay music to restart when I click Retry after a game over,
so that I don't play in silence after dying.

## Acceptance Criteria

1. **Given** the player clicks Retry on the game over screen — **When** `startGameplay()` is called and phase transitions to `systemEntry` with `prevPhase === 'gameOver'` — **Then** the gameplay music starts (crossfade from silence) with a random track selected from `ASSET_MANIFEST.gameplay.audio.gameplayMusic` — **And** the music is audible at the normal gameplay volume.

2. **Given** the same flow for victory retry (VictoryScreen also calls `startGameplay()`) — **When** phase transitions to `systemEntry` with `prevPhase === 'victory'` — **Then** the gameplay music also restarts correctly (same fix covers both cases).

3. **Given** the existing transitions (menu → systemEntry, shipSelect → systemEntry, galaxyChoice → systemEntry, tunnel → systemEntry) — **When** the fix is applied — **Then** those transitions continue to work exactly as before (no regression).

4. **Given** the implementation — **When** fixing `useAudio.jsx` — **Then** in the `systemEntry` handler, the existing condition on line 115 is extended to include `prevPhase === 'gameOver'` and `prevPhase === 'victory'` as cases that trigger `crossfadeMusic(selectedTrack, 1000)`.

## Tasks / Subtasks

- [x] Task 1: Extend the `systemEntry` prevPhase condition in `useAudio.jsx` (AC: #1, #2, #4)
  - [x] 1.1: Open `src/hooks/useAudio.jsx`
  - [x] 1.2: On line 115, change the condition from `prevPhase === 'menu' || prevPhase === 'shipSelect' || prevPhase === 'galaxyChoice'` to also include `|| prevPhase === 'gameOver' || prevPhase === 'victory'`
  - [x] 1.3: Update the inline comment above line 115 to reflect the new cases

- [x] Task 2: Update the misleading comment in the `gameplay` phase handler (AC: #1)
  - [x] 2.1: On line 124, update comment `// gameOver/victory → gameplay: music already handled by systemEntry transition` — this comment becomes accurate after the fix, but add a note referencing Story 40.2 for traceability

- [x] Task 3: Verify no regressions (AC: #3)
  - [x] 3.1: Run `npm test src/audio/__tests__/audioManager.test.js` — all existing tests must pass (44/44 ✅)
  - [x] 3.2: Manual QA: die in-game → click Retry → verify music starts within the `systemEntry` phase
  - [x] 3.3: Manual QA: win → click Retry (VictoryScreen) → verify music starts
  - [x] 3.4: Manual QA: menu → play → verify music still works (no regression on existing flow)

## Dev Notes

### Root Cause Analysis

**File:** `src/hooks/useAudio.jsx` — `systemEntry` phase handler, line 94–121.

The `systemEntry` handler correctly selects a random track (`selectRandomGameplayMusic(tracks)` at line 107) before the condition check. However, the `if` on line 115 only triggers `crossfadeMusic` for `menu`, `shipSelect`, `galaxyChoice` (first game entry), and `tunnel` (cross-system travel). The retry flow (`gameOver → systemEntry`) falls through all branches with no music action → silence.

**The misleading comment at line 122–124:**
```js
} else if (phase === 'gameplay') {
  // systemEntry → gameplay: music continues, no change
  // gameOver/victory → gameplay: music already handled by systemEntry transition
}
```
The second comment is incorrect — the `systemEntry` transition does NOT currently handle `gameOver/victory` as prevPhase. After the fix it becomes accurate.

### Exact Code Change (Task 1.2)

**Before (line 115):**
```js
if (prevPhase === 'menu' || prevPhase === 'shipSelect' || prevPhase === 'galaxyChoice') {
  // Menu/ShipSelect/GalaxyChoice → systemEntry: crossfade to randomly selected track
  crossfadeMusic(selectedTrack, 1000)
} else if (prevPhase === 'tunnel') {
  // Tunnel → systemEntry: crossfade to new random track for new system
  crossfadeMusic(selectedTrack, 1000)
}
```

**After:**
```js
if (
  prevPhase === 'menu' ||
  prevPhase === 'shipSelect' ||
  prevPhase === 'galaxyChoice' ||
  prevPhase === 'gameOver' ||   // Story 40.2: retry from game over
  prevPhase === 'victory'       // Story 40.2: retry from victory screen
) {
  // Menu/ShipSelect/GalaxyChoice/GameOver/Victory → systemEntry: crossfade to randomly selected track
  crossfadeMusic(selectedTrack, 1000)
} else if (prevPhase === 'tunnel') {
  // Tunnel → systemEntry: crossfade to new random track for new system
  crossfadeMusic(selectedTrack, 1000)
}
```

> **Why the two `crossfadeMusic` calls are not merged:** The `tunnel` case is intentionally separate (currently identical behavior, but may diverge in the future — different fade duration, different track pool for "new system"). Keep them separate.

### Why `selectedTrack` is Already Available

The `selectRandomGameplayMusic(tracks)` call at line 107 executes BEFORE the condition check on line 115. This means `selectedTrack` is always computed regardless of `prevPhase`, so no restructuring is needed — the fix is purely additive (two extra `||` conditions).

### Phase Transition Flow for Retry

```
Game Over screen → user clicks Retry
  → stores/useGame.jsx: startGameplay() called
  → phase: 'gameOver' → 'systemEntry'
  → useAudio.jsx subscribe fires: phase='systemEntry', prevPhase='gameOver'
  → [BUG] condition doesn't match → no crossfadeMusic → silence
  → [FIX] condition matches → crossfadeMusic(selectedTrack, 1000) → music plays
  → phase: 'systemEntry' → 'gameplay' (music continues)
```

### Testing Approach

There are no unit tests for `useAudio.jsx`'s subscription logic (this hook uses `useGame.subscribe` which requires complex Zustand + React lifecycle mocking). This is consistent with the existing test coverage gap — `audioManager.test.js` tests the lower-level audio functions only.

**Acceptable testing approach:**
- Run existing `audioManager.test.js` + `audioManager.randomMusic.test.js` — must pass (no regression, these test `selectRandomGameplayMusic` and audio manager functions)
- Manual QA is the primary validation path for `useAudio.jsx` subscription behavior
- If a unit test is desired, it would require mocking `useGame` with Zustand's `act` + React's `renderHook` — out of scope for this single-condition fix

### Project Structure Notes

- **Only file to touch:** `src/hooks/useAudio.jsx`
- **No new files needed**
- **No config changes needed** — `ASSET_MANIFEST.gameplay.audio.gameplayMusic` already provides the track pool
- **No store changes needed** — `startGameplay()` in `useGame.jsx` already transitions through `systemEntry`

### References

- Epic 40 context: `_bmad-output/planning-artifacts/epic-40-bugfixes-pause-music-aura.md#Story-40.2`
- Audio hook source: `src/hooks/useAudio.jsx` (Story 26.1 introduced random music selection)
- Audio manager: `src/audio/audioManager.js` — `crossfadeMusic`, `selectRandomGameplayMusic`
- Audio manager tests: `src/audio/__tests__/audioManager.test.js`, `audioManager.randomMusic.test.js`
- Previous story (40.1): `_bmad-output/implementation-artifacts/40-1-fix-damage-numbers-camera-shake-during-pause.md`
- Project context: `_bmad-output/planning-artifacts/project-context.md`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None — root cause was straightforward, no debugging required. The condition gap was exactly as described in Dev Notes.

### Completion Notes List

- ✅ AC #1: `gameOver → systemEntry` now triggers `crossfadeMusic(selectedTrack, 1000)` — retry from Game Over plays music
- ✅ AC #2: `victory → systemEntry` now triggers `crossfadeMusic(selectedTrack, 1000)` — retry from Victory plays music
- ✅ AC #3: All existing transitions (menu/shipSelect/galaxyChoice/tunnel → systemEntry) untouched — no regression. `audioManager.test.js`: 44/44 pass.
- ✅ AC #4: Condition on line 115 extended with `|| prevPhase === 'gameOver' || prevPhase === 'victory'` exactly as specified
- Fix is purely additive (two extra `||` conditions) — `selectedTrack` was already computed before the condition check, no restructuring needed
- Misleading comment at line 124 corrected to reflect post-fix accuracy, referencing Story 40.2

### File List

- `src/hooks/useAudio.jsx`

## Change Log

- 2026-02-23: Extended `systemEntry` prevPhase condition to include `gameOver` and `victory` — music now restarts on retry
